// =============================================================================
// Student Data Service — Firestore-backed dynamic data layer
// All student portal data is stored per-user in Firestore.
// Collection: student_portal/{userId}/data/{docKey}
// Each doc stores its payload in a `value` field.
// =============================================================================

import { db, auth } from "@/services/firebase";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { 
  studentService, 
  attendanceService as firestoreAttendanceService,
  timetableService, 
  assignmentService,
  assignmentSubmissionService,
  examResultService,
  examService,
  notificationService,
  lessonService,
  quizResultService 
} from "@/utils/firestoreService";

import {
  type HomeworkTopic,
  type ObjectiveQuestion,
  type CalendarEvent,
  type Notification,
} from "@/data/studentMockData";

// ─── Firestore helpers ────────────────────────────────────────────────────────

/** Wait for Firebase Auth to resolve the current user (handles page refresh). */
function waitForAuth(): Promise<import('firebase/auth').User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) return resolve(auth.currentUser);
    const unsub = auth.onAuthStateChanged((user) => {
      unsub();
      resolve(user);
    });
  });
}

function getUid(): string {
  return auth.currentUser?.uid || "anonymous";
}

/** Read a student-portal document. Returns fallback when doc doesn't exist. */
async function getData<T>(key: string, fallback: T): Promise<T> {
  try {
    const snap = await getDoc(doc(db, "student_portal", getUid(), "data", key));
    if (snap.exists()) return snap.data().value as T;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Write a student-portal document (merge to avoid overwrites). */
async function saveData<T>(key: string, data: T): Promise<void> {
  await setDoc(doc(db, "student_portal", getUid(), "data", key), { value: data }, { merge: true });
}

// ─── No-op initialize (Firestore needs no seeding) ──────────────────────────
export function initializeStudentData(_force = false): void {
  // Intentional no-op — data is fetched on demand from Firestore
}

// ─── Student Profile ─────────────────────────────────────────────────────────
export const StudentProfile = {
  get: async () => {
    const user = await waitForAuth();
    const email = user?.email;
    if (email) {
      const student = await studentService.getByEmail(email);
      if (student) {
        // Fetch timetable to count unique subjects (courses)
        let courseCount = 0;
        try {
          const timetable = await timetableService.getByClass(student.class, student.section);
          const uniqueSubjects = new Set(timetable.map(slot => slot.subjectId));
          courseCount = uniqueSubjects.size;
        } catch (err) {
          console.warn("Failed to fetch course count:", err);
        }

        return {
          name: student.name,
          grade: student.class,
          section: student.section,
          avatar: student.photo || "",
          email: student.email || email,
          id: student.id,
          phone: student.phone || student.parentPhone || "Not Provided",
          address: student.address || "Not Provided",
          joinedDate: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Not Provided",
          enrolledCoursesCount: courseCount || 6, // Fallback to 6 if none found to match UI expectation for now
        };
      }
    }
    return getData("student_profile", { 
      name: "", 
      grade: "", 
      section: "", 
      avatar: "", 
      email: "", 
      id: "",
      phone: "",
      address: "",
      joinedDate: "",
      enrolledCoursesCount: 0
    });
  },
  update: async (data: Record<string, any>) => {
    const current = await StudentProfile.get();
    const updated = { ...current, ...data };
    await saveData("student_profile", updated);
    return updated;
  },
};

export const Quotes = {
  getAll: async () => {
    return getData<string[]>("quotes", []);
  },
  getRandom: async () => {
    const quotes = await Quotes.getAll();
    if (quotes.length === 0) return "Keep pushing forward!";
    return quotes[Math.floor(Math.random() * quotes.length)];
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Return the current local date as "YYYY-MM-DD" (avoids UTC-shift from toISOString). */
function getLocalDateStr(d: Date = new Date()): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// ─── Today's Classes ─────────────────────────────────────────────────────────
export const TodaysClasses = {
  getAll: async () => {
    const profile = await StudentProfile.get();
    if (!profile.grade || !profile.section) return [];

    const todayStr = getLocalDateStr();

    // Helper for icon / colour
    const iconFor = (subj: string) =>
      subj.toLowerCase().includes("math") ? "calculator" :
      subj.toLowerCase().includes("sci") ? "beaker" : "book";
    const colorFor = (subj: string) =>
      subj.toLowerCase().includes("math") ? "bg-blue-500" :
      subj.toLowerCase().includes("sci") ? "bg-emerald-500" : "bg-indigo-500";

    // 1. Primary source: lesson logs the teacher created today
    try {
      const allLessons = await lessonService.getByClass(profile.grade, profile.section);
      const todaysLessons = allLessons.filter(l => l.date === todayStr);

      if (todaysLessons.length > 0) {
        // Enrich with time from the timetable when available
        const slots = await timetableService.getByClass(profile.grade, profile.section);

        return todaysLessons.map(l => {
          const matchingSlot = slots.find(
            s => s.subject?.toLowerCase() === l.subject?.toLowerCase()
          );
          return {
            id: l.id,
            subject: l.subject,
            topic: l.topic,
            teacher: l.teacherName,
            time: matchingSlot ? `${matchingSlot.startTime} - ${matchingSlot.endTime}` : (l.time || ''),
            icon: iconFor(l.subject),
            color: colorFor(l.subject),
          };
        });
      }
    } catch (e) {
      console.warn('[TodaysClasses] lesson fetch failed, falling back to timetable', e);
    }

    // 2. Fallback: static timetable for today's day-of-week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[new Date().getDay()].toLowerCase();
    const slots = await timetableService.getByClass(profile.grade, profile.section);
    const todaysSlots = slots.filter(s => (s.day || '').toLowerCase() === dayName);

    return todaysSlots.map(s => ({
      id: s.id,
      subject: s.subject,
      topic: '',
      teacher: s.teacherName,
      time: `${s.startTime} - ${s.endTime}`,
      icon: iconFor(s.subject),
      color: colorFor(s.subject),
    }));
  },
  updateStatus: async (classId: number | string, status: string) => {
    const classes = await TodaysClasses.getAll();
    const updated = classes.map((c: any) =>
      c.id === classId ? { ...c, status } : c
    );
    await saveData("todays_classes", updated);
    return updated;
  },
};

// ─── Pending Tasks ───────────────────────────────────────────────────────────

/**
 * Build pending tasks dynamically from:
 *  1. Incomplete homework topics (flashcards or quiz not done)
 *  2. Active assignments with due dates
 */
export const PendingTasks = {
  getAll: async () => {
    const profile = await StudentProfile.get();
    if (!profile.grade || !profile.section) return [];

    const tasks: any[] = [];
    let nextId = 1;
    const todayStr = getLocalDateStr();

    const SUBJECT_ICONS: Record<string, string> = {
      mathematics: "calculator", math: "calculator", maths: "calculator",
      physics: "atom", chemistry: "beaker", biology: "leaf",
      english: "book-open", history: "scroll", science: "atom",
    };
    const SUBJECT_COLORS: Record<string, string> = {
      mathematics: "bg-blue-500", math: "bg-blue-500", maths: "bg-blue-500",
      physics: "bg-purple-500", chemistry: "bg-red-500", biology: "bg-emerald-500",
      english: "bg-green-500", history: "bg-amber-500", science: "bg-indigo-500",
    };
    const getIcon = (subj: string) => SUBJECT_ICONS[subj.toLowerCase()] || "book-open";
    const getColor = (subj: string) => SUBJECT_COLORS[subj.toLowerCase()] || "bg-gray-500";

    try {
      // 1. Incomplete homework → pending tasks
      const hwTopics = await HomeworkService.getAll();
      for (const hw of hwTopics) {
        if (hw.status === "completed") continue;

        const parts: string[] = [];
        if (!hw.flashcardsCompleted) parts.push("Flashcards");
        if (!hw.questionsCompleted) parts.push("Quiz");
        if (parts.length === 0) continue;

        tasks.push({
          id: nextId++,
          title: `${hw.subject}: ${parts.join(" & ")} — ${hw.topic}`,
          icon: getIcon(hw.subject),
          color: getColor(hw.subject),
          estimatedTime: parts.length === 2 ? "20 min" : "10 min",
          dueDate: "Today",
          priority: hw.flashcardProgress === 0 && hw.questionsProgress === 0 ? "high" : "medium",
          type: "homework",
          topicId: hw.id,
        });
      }

      // 2. Active assignments with due dates
      const assignments = await assignmentService.getByClass(profile.grade, profile.section);
      for (const a of assignments) {
        if (a.status !== "active") continue;
        const isDueToday = a.dueDate === todayStr;
        const isPastDue = a.dueDate < todayStr;
        const dueLabel = isDueToday ? "Today" : isPastDue ? "Overdue" : a.dueDate;

        tasks.push({
          id: nextId++,
          title: `${a.subject}: ${a.title}`,
          icon: "pen-tool",
          color: isPastDue ? "bg-red-500" : "bg-amber-500",
          estimatedTime: `${a.totalMarks} marks`,
          dueDate: dueLabel,
          priority: isDueToday || isPastDue ? "high" : "medium",
          type: "assignment",
          assignmentId: a.id,
        });
      }
    } catch (error) {
      console.error("[PendingTasks] Error fetching tasks:", error);
    }

    return tasks;
  },
  complete: async (taskId: number | string) => {
    // Tasks are derived dynamically — completion is tracked per-source
    return PendingTasks.getAll();
  },
  isCompleted: async (taskId: number | string) => {
    return false;
  },
  add: async (task: any) => {
    return PendingTasks.getAll();
  },
};

// ─── Learning Goals ──────────────────────────────────────────────────────────
export const LearningGoals = {
  getAll: async () => {
    return getData<any[]>("learning_goals", []);
  },
  updateProgress: async (subject: string, current: number) => {
    const goals = await LearningGoals.getAll();
    const updated = goals.map((g: any) =>
      g.subject === subject ? { ...g, current: Math.min(current, g.target) } : g
    );
    await saveData("learning_goals", updated);
    return updated;
  },
};

// ─── Performance Data (monthly scores chart) ─────────────────────────────────
export const PerformanceData = {
  getAll: async () => {
    const user = auth.currentUser || await waitForAuth();
    if (!user) return [];

    try {
      // Fetch quiz results from the real quiz_results collection
      const quizResults = await quizResultService.getByStudent(user.uid);

      // Also try exam results
      const profile = await StudentProfile.get();
      let examResults: any[] = [];
      if (profile.id) {
        try { examResults = await examResultService.getByStudent(profile.id); } catch {}
      }

      // Combine both sources into chronological performance entries
      const allEntries: { date: string; score: number; label: string }[] = [];

      for (const qr of quizResults) {
        allEntries.push({
          date: qr.completed_at || qr.created_at || "",
          score: qr.accuracy ?? Math.round((qr.correct / (qr.total || 1)) * 100),
          label: qr.subject,
        });
      }

      for (const er of examResults) {
        allEntries.push({
          date: er.gradedAt || er.created_at || "",
          score: er.percentage,
          label: "Exam",
        });
      }

      if (allEntries.length === 0) return [];

      // Sort chronologically and map to chart-friendly format
      allEntries.sort((a, b) => a.date.localeCompare(b.date));

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return allEntries.map((e, i) => {
        const d = new Date(e.date);
        const monthLabel = isNaN(d.getTime()) ? `#${i + 1}` : `${months[d.getMonth()]} ${d.getDate()}`;
        return { month: monthLabel, score: e.score, subject: e.label };
      });
    } catch (err) {
      console.warn("Failed to fetch performance data:", err);
    }

    return [];
  },
  addMonth: async (month: string, score: number) => {
    const data = await PerformanceData.getAll();
    const existing = data.findIndex((entry: any) => entry.month === month);
    const updated = existing >= 0
      ? data.map((entry: any, index: number) => index === existing ? { ...entry, score } : entry)
      : [...data, { month, score }];
    await saveData("performance_data", updated);
    return updated;
  },
};

// ─── Subject Performance ─────────────────────────────────────────────────────
export const SubjectPerformance = {
  getAll: async () => {
    const user = auth.currentUser || await waitForAuth();
    if (!user) return [];

    const SUBJECT_COLORS: Record<string, string> = {
      mathematics: "bg-blue-500", math: "bg-blue-500", maths: "bg-blue-500",
      physics: "bg-purple-500", chemistry: "bg-red-500", biology: "bg-emerald-500",
      english: "bg-green-500", history: "bg-amber-500", science: "bg-indigo-500",
    };
    const getColor = (subj: string) => SUBJECT_COLORS[subj.toLowerCase()] || "bg-gray-500";

    try {
      // Primary: quiz_results collection (all historical data)
      const quizResults = await quizResultService.getByStudent(user.uid);

      // Group by subject
      const subjectMap: Record<string, { scores: number[]; dates: string[] }> = {};
      for (const qr of quizResults) {
        const subj = qr.subject || "General";
        if (!subjectMap[subj]) subjectMap[subj] = { scores: [], dates: [] };
        subjectMap[subj].scores.push(qr.accuracy ?? Math.round((qr.correct / (qr.total || 1)) * 100));
        subjectMap[subj].dates.push(qr.completed_at || '');
      }

      // Also try exam results
      const profile = await StudentProfile.get();
      if (profile.id) {
        try {
          const examResults = await examResultService.getByStudent(profile.id);
          for (const er of examResults) {
            const subj = er.subject || "Exams";
            if (!subjectMap[subj]) subjectMap[subj] = { scores: [], dates: [] };
            subjectMap[subj].scores.push(er.percentage);
            subjectMap[subj].dates.push(er.gradedAt || er.created_at || '');
          }
        } catch {}
      }

      if (Object.keys(subjectMap).length > 0) {
        return Object.entries(subjectMap).map(([subject, data]) => {
          const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
          const lastTwo = data.scores.slice(-2);
          const trend = lastTwo.length >= 2 ? (lastTwo[1] > lastTwo[0] ? "up" : lastTwo[1] < lastTwo[0] ? "down" : "same") : "same";
          return {
            subject,
            score: avg,
            trend,
            color: getColor(subject),
            data: data.scores.slice(-5),
            icon: "book-open",
          };
        });
      }
    } catch (err) {
      console.warn("Failed to aggregate subject performance:", err);
    }

    return [];
  },
  updateScore: async (subject: string, newScore: number) => {
    const performance = await SubjectPerformance.getAll();
    const updated = performance.map((entry: any) => {
      if (entry.subject !== subject) return entry;
      const previousScore = entry.score;
      const trend = newScore > previousScore ? "up" : newScore < previousScore ? "down" : "same";
      const data = Array.isArray(entry.data) ? [...entry.data.slice(1), newScore] : [newScore];
      return { ...entry, score: newScore, trend, data };
    });
    await saveData("subject_performance", updated);
    return updated;
  },
};

// ─── Skills Data (radar chart) ───────────────────────────────────────────────
export const SkillsData = {
  getAll: async () => {
    const user = auth.currentUser || await waitForAuth();
    if (!user) return [];

    try {
      // Use ALL quiz results (historical) for skills assessment
      const quizResults = await quizResultService.getByStudent(user.uid);

      // Count lesson logs (all historical) for engagement metrics
      const profile = await StudentProfile.get();
      let totalLessons = 0;
      if (profile.grade && profile.section) {
        try {
          const lessons = await lessonService.getByClass(profile.grade, profile.section);
          totalLessons = lessons.length;
        } catch {}
      }

      if (quizResults.length === 0 && totalLessons === 0) return [];

      // Derive skill metrics from quiz results + lesson history
      const totalQuizzes = quizResults.length;

      // Count unique subject::topic combos that the student completed quizzes for
      const completedTopics = new Set(
        quizResults.map(r => `${r.subject}::${r.topic}`)
      );

      const avgAccuracy = totalQuizzes > 0
        ? Math.round(quizResults.reduce((s, r) => s + (r.accuracy ?? 0), 0) / totalQuizzes)
        : 0;

      // Completion rate: how many lesson topics did the student complete vs total lessons
      const completionRate = totalLessons > 0
        ? Math.min(Math.round((completedTopics.size / totalLessons) * 100), 100)
        : 0;

      // Consistency: based on how many different days the student took quizzes
      const uniqueDays = new Set(
        quizResults.map(r => (r.completed_at || '').split('T')[0]).filter(Boolean)
      );
      const consistencyScore = Math.min(uniqueDays.size * 15, 100);

      // Engagement: based on total quizzes + lesson coverage
      const engagementScore = Math.min((totalQuizzes * 10 + completedTopics.size * 15), 100);

      return [
        { skill: "Quiz Accuracy", current: avgAccuracy, fullMark: 100, expected: 70 },
        { skill: "Topics Covered", current: totalLessons > 0 ? Math.min(Math.round((completedTopics.size / totalLessons) * 100), 100) : 0, fullMark: 100, expected: 80 },
        { skill: "Completion Rate", current: completionRate, fullMark: 100, expected: 75 },
        { skill: "Consistency", current: consistencyScore, fullMark: 100, expected: 60 },
        { skill: "Quizzes Done", current: Math.min(totalQuizzes * 20, 100), fullMark: 100, expected: 70 },
        { skill: "Engagement", current: engagementScore, fullMark: 100, expected: 50 },
      ];
    } catch (err) {
      console.warn("Failed to build skills data:", err);
    }

    return [];
  },
  update: async (skill: string, current: number) => {
    const skills = await SkillsData.getAll();
    const updated = skills.map((entry: any) =>
      entry.skill === skill ? { ...entry, current } : entry
    );
    await saveData("skills_data", updated);
    return updated;
  },
};

// ─── Topic Mastery ───────────────────────────────────────────────────────────
export const TopicMastery = {
  getAll: async () => {
    return getData<any[]>("topic_mastery", []);
  },
  updateProgress: async (topic: string, progress: number) => {
    const topics = await TopicMastery.getAll();
    const level = progress >= 90 ? "Mastered" : progress >= 60 ? "Advanced" : progress >= 30 ? "Intermediate" : "Beginner";
    const updated = topics.map((entry: any) =>
      entry.topic === topic ? { ...entry, progress, level } : entry
    );
    await saveData("topic_mastery", updated);
    return updated;
  },
};

// ─── Quiz Trends ─────────────────────────────────────────────────────────────
export const QuizTrends = {
  getAll: async () => {
    const user = auth.currentUser || await waitForAuth();
    if (!user) return [];

    try {
      // Fetch from the real quiz_results collection
      const quizResults = await quizResultService.getByStudent(user.uid);
      if (quizResults.length > 0) {
        // Sort oldest first for charting
        const sorted = [...quizResults].sort((a, b) =>
          (a.completed_at || "").localeCompare(b.completed_at || "")
        );

        return sorted.map((r, i) => ({
          week: r.subject ? `${r.subject}` : `Quiz ${i + 1}`,
          average: r.accuracy ?? Math.round((r.correct / (r.total || 1)) * 100),
          completion: 100,
          topic: r.topic,
          date: r.completed_at,
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch quiz trends:", err);
    }

    return [];
  },
  addWeek: async (week: string, average: number, completion: number) => {
    const trends = await QuizTrends.getAll();
    const updated = [...trends, { week, average, completion }];
    await saveData("quiz_trends", updated);
    return updated;
  },
};

// ─── Attendance Summary ──────────────────────────────────────────────────────
export const AttendanceService = {
  get: async () => {
    const profile = await StudentProfile.get();
    const defaultStats = { present: 0, absent: 0, total: 0, percentage: 0 };
    if (profile.id) {
      try {
        const stats = await firestoreAttendanceService.getAttendanceStats(profile.id);
        return {
          ...defaultStats,
          ...stats,
        };
      } catch {
        // Fall back to stored data
      }
    }

    return getData("attendance", defaultStats);
  },
  markPresent: async () => {
    const attendance: any = await AttendanceService.get();
    const updated = {
      ...attendance,
      present: attendance.present + 1,
      total: attendance.total + 1,
      percentage: Math.round(((attendance.present + 1) / (attendance.total + 1)) * 100),
    };
    await saveData("attendance", updated);
    return updated;
  },
  markAbsent: async () => {
    const attendance: any = await AttendanceService.get();
    const updated = {
      ...attendance,
      absent: attendance.absent + 1,
      total: attendance.total + 1,
      percentage: Math.round((attendance.present / (attendance.total + 1)) * 100),
    };
    await saveData("attendance", updated);
    return updated;
  },
};

// ─── Daily Tasks by Subject ──────────────────────────────────────────────────
export const DailyTasks = {
  getAll: async () => {
    // Dynamically fetch from lessons collection based on student's class/section
    const profile = await StudentProfile.get();
    if (!profile.grade || !profile.section) return getData<any[]>("daily_tasks", []);

    try {
      const lessons = await lessonService.getByClass(profile.grade, profile.section);
      if (lessons.length === 0) return getData<any[]>("daily_tasks", []);

      // Group lessons by subject and build daily task items
      const subjectMap = new Map<string, any>();
      for (const lesson of lessons) {
        if (!subjectMap.has(lesson.subject)) {
          subjectMap.set(lesson.subject, {
            subject: lesson.subject,
            icon: lesson.subject.toLowerCase().includes("math") ? "calculator" : 
                  lesson.subject.toLowerCase().includes("sci") ? "beaker" : "book",
            color: lesson.subject.toLowerCase().includes("math") ? "bg-blue-500" :
                   lesson.subject.toLowerCase().includes("sci") ? "bg-emerald-500" : "bg-indigo-500",
            teacher: lesson.teacherName,
            topic: lesson.topic,
            objectives: lesson.objectives || [],
            tasks: (lesson.objectives || []).map((obj: string, i: number) => ({
              id: `${lesson.id}-${i}`,
              text: obj,
              completed: false,
            })),
          });
        }
      }
      return Array.from(subjectMap.values());
    } catch (e) {
      console.warn("Failed to fetch lessons for daily tasks:", e);
      return getData<any[]>("daily_tasks", []);
    }
  },
  toggleTaskCompletion: async (taskId: number) => {
    const subjects = await DailyTasks.getAll();
    const updated = subjects.map((s: any) => ({
      ...s,
      tasks: s.tasks.map((t: any) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
    await saveData("daily_tasks", updated);
    return updated;
  },
  getCompletionStats: async () => {
    const subjects = await DailyTasks.getAll();
    let total = 0, completed = 0;
    subjects.forEach((s: any) => {
      s.tasks.forEach((t: any) => {
        total++;
        if (t.completed) completed++;
      });
    });
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  },
};

// ─── Homework Topics ─────────────────────────────────────────────────────────
export const HomeworkService = {
  getAll: async (): Promise<HomeworkTopic[]> => {
    const profile = await StudentProfile.get();
    if (!profile.grade || !profile.section) return getData<HomeworkTopic[]>("homework_topics", []);

    const todayStr = getLocalDateStr();
    const uid = auth.currentUser?.uid || getUid();

    // Load saved progress (keyed by "subject::topic" for uniqueness)
    const savedProgress = await getData<Record<string, Partial<HomeworkTopic>>>("homework_progress", {});

    // Fetch quiz results so we can mark already-completed topics
    // Only consider quizzes completed TODAY — if teacher re-assigns same topic
    // next day, the student gets fresh homework.
    let completedTopics = new Map<string, { accuracy: number; correct: number; total: number; completed_at: string }>();
    try {
      const quizResults = await quizResultService.getByStudent(uid);
      for (const r of quizResults) {
        if (r.subject && r.topic) {
          const completedDate = r.completed_at ? r.completed_at.split('T')[0] : '';
          if (completedDate === todayStr) {
            completedTopics.set(
              `${r.subject.toLowerCase()}::${r.topic.toLowerCase()}`,
              { accuracy: r.accuracy ?? 0, correct: r.correct, total: r.total, completed_at: r.completed_at || '' }
            );
          }
        }
      }
    } catch { /* ignore */ }

    const getCompletedResult = (subject: string, topic: string) =>
      completedTopics.get(`${subject.toLowerCase()}::${topic.toLowerCase()}`);

    const mergeProgress = (topic: HomeworkTopic): HomeworkTopic => {
      // Only match progress saved for the exact same subject + topic combination
      const key = `${topic.subject}::${topic.topic}`;
      const saved = savedProgress[key];
      if (!saved) return topic;

      // Only merge progress that was saved TODAY to avoid stale data from old topics
      const savedDate = saved.lastAttemptDate ? saved.lastAttemptDate.split('T')[0] : null;
      if (savedDate && savedDate !== todayStr) return topic;

      return {
        ...topic,
        flashcardProgress: saved.flashcardProgress ?? topic.flashcardProgress,
        flashcardsCompleted: saved.flashcardsCompleted ?? topic.flashcardsCompleted,
        questionsProgress: saved.questionsProgress ?? topic.questionsProgress,
        questionsCompleted: saved.questionsCompleted ?? topic.questionsCompleted,
        questionsAttempted: saved.questionsAttempted ?? topic.questionsAttempted,
        accuracy: saved.accuracy ?? topic.accuracy,
        lastAttemptDate: saved.lastAttemptDate ?? topic.lastAttemptDate,
        status: saved.status ?? topic.status,
      } as HomeworkTopic;
    };

    const iconFor = (subj: string) =>
      subj.toLowerCase().includes("math") ? "calculator" :
      subj.toLowerCase().includes("sci") ? "beaker" : "book";
    const colorFor = (subj: string) =>
      subj.toLowerCase().includes("math") ? "bg-blue-500" :
      subj.toLowerCase().includes("sci") ? "bg-emerald-500" : "bg-indigo-500";

    // ── 1. Primary source: today's lesson logs from teachers ──
    try {
      const allLessons = await lessonService.getByClass(profile.grade, profile.section);
      const todaysLessons = allLessons.filter(l => l.date === todayStr);

      if (todaysLessons.length > 0) {
        // Include ALL today's lessons — completed ones shown as completed, pending as pending
        const topics = todaysLessons.map((lesson, index) => {
          const completedResult = getCompletedResult(lesson.subject, lesson.topic);
          if (completedResult) {
            // Show completed homework with its result — do not filter out
            return {
              id: index + 1,
              subject: lesson.subject,
              topic: lesson.topic,
              teacher: lesson.teacherName,
              icon: iconFor(lesson.subject),
              color: colorFor(lesson.subject),
              status: "completed" as const,
              flashcardProgress: 100,
              questionsProgress: 100,
              flashcardsCompleted: true,
              questionsCompleted: true,
              questionsAttempted: completedResult.total,
              totalQuestions: completedResult.total,
              accuracy: completedResult.accuracy,
              lastAttemptDate: completedResult.completed_at,
            } as HomeworkTopic;
          }
          // Not yet completed — merge any in-progress saved data
          return mergeProgress({
            id: index + 1,
            subject: lesson.subject,
            topic: lesson.topic,
            teacher: lesson.teacherName,
            icon: iconFor(lesson.subject),
            color: colorFor(lesson.subject),
            status: "pending" as const,
            flashcardProgress: 0,
            questionsProgress: 0,
            flashcardsCompleted: false,
            questionsCompleted: false,
            questionsAttempted: 0,
            totalQuestions: 5,
            accuracy: null,
            lastAttemptDate: null,
          } as HomeworkTopic);
        });

        return topics;
      }
    } catch (e) {
      console.warn("Failed to fetch lessons for homework:", e);
    }

    // ── 2. Fallback: active assignments (not yet due / not closed) ──
    try {
      const allAssignments = await assignmentService.getByClass(profile.grade, profile.section);
      const activeAssignments = allAssignments.filter(a => a.status === 'active');
      if (activeAssignments.length > 0) {
        return activeAssignments.map((a, index) => {
          const completedResult = getCompletedResult(a.subject, a.title);
          if (completedResult) {
            return {
              id: index + 1,
              subject: a.subject,
              topic: a.title,
              teacher: a.assignedBy || "",
              icon: iconFor(a.subject),
              color: colorFor(a.subject),
              status: "completed" as const,
              flashcardProgress: 100,
              questionsProgress: 100,
              flashcardsCompleted: true,
              questionsCompleted: true,
              questionsAttempted: completedResult.total,
              totalQuestions: completedResult.total,
              accuracy: completedResult.accuracy,
              lastAttemptDate: completedResult.completed_at,
            } as HomeworkTopic;
          }
          return mergeProgress({
            id: index + 1,
            subject: a.subject,
            topic: a.title,
            teacher: a.assignedBy || "",
            icon: iconFor(a.subject),
            color: colorFor(a.subject),
            status: "pending" as const,
            flashcardProgress: 0,
            questionsProgress: 0,
            flashcardsCompleted: false,
            questionsCompleted: false,
            questionsAttempted: 0,
            totalQuestions: 5,
            accuracy: null,
            lastAttemptDate: null,
          } as HomeworkTopic);
        });
      }
    } catch (e) {
      console.warn("Failed to fetch assignments for homework:", e);
    }

    return [];
  },
  getById: async (id: number): Promise<HomeworkTopic | undefined> => {
    const all = await HomeworkService.getAll();
    return all.find(t => t.id === id);
  },
  updateTopic: async (id: number, updates: Partial<HomeworkTopic>): Promise<HomeworkTopic[]> => {
    const topics = await HomeworkService.getAll();
    const target = topics.find(t => t.id === id);
    if (target) {
      // Save progress keyed by subject::topic so it persists across regenerations
      const savedProgress = await getData<Record<string, Partial<HomeworkTopic>>>("homework_progress", {});
      const key = `${target.subject}::${target.topic}`;
      savedProgress[key] = {
        ...(savedProgress[key] || {}),
        ...updates,
      };
      await saveData("homework_progress", savedProgress);
    }
    // Return merged list
    return HomeworkService.getAll();
  },
  getRecommendedQuizzes: async () => {
    const topics = await HomeworkService.getAll();
    return topics.filter(t => t.status !== "completed").map(t => ({
      id: t.id,
      title: `${t.topic} Quiz`,
      subject: t.subject,
      icon: t.icon,
      dueDate: "Tomorrow",
      estimatedTime: "15 min",
      priority: t.status === "in-progress" ? "high" : "medium" as const,
      color: t.color,
      questions: t.totalQuestions,
    }));
  },
  updateFlashcardProgress: async (topicId: number, progress: number): Promise<HomeworkTopic[]> => {
    const completed = progress >= 100;
    return HomeworkService.updateTopic(topicId, {
      flashcardProgress: Math.min(progress, 100),
      flashcardsCompleted: completed,
      status: completed ? "in-progress" : "pending",
    });
  },
  updateQuestionsProgress: async (topicId: number, attempted: number, correct: number, total: number): Promise<HomeworkTopic[]> => {
    const progress = Math.round((attempted / total) * 100);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;
    const completed = attempted >= total;
    return HomeworkService.updateTopic(topicId, {
      questionsProgress: progress,
      questionsAttempted: attempted,
      accuracy,
      questionsCompleted: completed,
      status: completed ? "completed" : "in-progress",
      lastAttemptDate: new Date().toISOString(),
    });
  },
  saveDetailedResults: async (topicId: number, results: any) => {
    // Save to the dedicated quiz_results collection
    const profile = await StudentProfile.get();
    const topic = await HomeworkService.getById(topicId);
    const user = auth.currentUser;

    await quizResultService.create({
      student_id: user?.uid || getUid(),
      student_email: user?.email || "",
      student_name: profile.name || "",
      class: profile.grade || "",
      section: profile.section || "",
      subject: topic?.subject || results.subject || "",
      topic: topic?.topic || results.topic || "",
      score: results.accuracy,
      correct: results.correctAnswers,
      total: results.totalQuestions,
      accuracy: results.accuracy,
      answers: results.answers || [],
      questions: results.questions || [],
      completed_at: results.timestamp || new Date().toISOString(),
    } as any);

    // Also keep a lightweight copy in student_portal for quick access
    const allResults = await getData<Record<number, any>>("topic_quiz_results", {});
    allResults[topicId] = {
      completed: results.completed,
      questionsAttempted: results.questionsAttempted,
      totalQuestions: results.totalQuestions,
      correctAnswers: results.correctAnswers,
      accuracy: results.accuracy,
      timestamp: results.timestamp,
    };
    await saveData("topic_quiz_results", allResults);
  },
  getDetailedResults: async (topicId: number) => {
    // Try from quiz_results collection first for full data
    const topic = await HomeworkService.getById(topicId);
    if (topic) {
      const user = auth.currentUser;
      const result = await quizResultService.getLatest(
        user?.uid || getUid(),
        topic.subject,
        topic.topic,
      );
      if (result) return result;
    }
    // Fallback to student_portal lightweight copy
    const allResults = await getData<Record<number, any>>("topic_quiz_results", {});
    return allResults[topicId];
  },
  getStats: async () => {
    const topics = await HomeworkService.getAll();
    return {
      total: topics.length,
      completed: topics.filter(t => t.status === "completed").length,
      inProgress: topics.filter(t => t.status === "in-progress").length,
      pending: topics.filter(t => t.status === "pending").length,
    };
  },
};

// ─── Objective Questions ─────────────────────────────────────────────────────
export const ObjectiveQuestions = {
  getAll: async (): Promise<ObjectiveQuestion[]> => getData<ObjectiveQuestion[]>("objective_questions", []),
  getByTopicId: async (topicId: number): Promise<ObjectiveQuestion[]> => {
    const all = await ObjectiveQuestions.getAll();
    return all.filter(q => q.topicId === topicId);
  },
};

// ─── Flashcards ──────────────────────────────────────────────────────────────
export const Flashcards = {
  getAll: async () => getData<Record<string, any[]>>("flashcards", {}),
  getBySubject: async (subject: string) => {
    const all = await Flashcards.getAll();
    return all[subject] || [];
  },
  getProgress: async (subject: string): Promise<{ viewed: number[]; mastered: number[] }> => {
    const progress = await getData<Record<string, { viewed: number[]; mastered: number[] }>>("flashcard_progress", {});
    return progress[subject] || { viewed: [], mastered: [] };
  },
  markViewed: async (subject: string, cardId: number) => {
    const progress = await getData<Record<string, { viewed: number[]; mastered: number[] }>>("flashcard_progress", {});
    if (!progress[subject]) progress[subject] = { viewed: [], mastered: [] };
    if (!progress[subject].viewed.includes(cardId)) {
      progress[subject].viewed.push(cardId);
    }
    await saveData("flashcard_progress", progress);
    return progress[subject];
  },
  markMastered: async (subject: string, cardId: number) => {
    const progress = await getData<Record<string, { viewed: number[]; mastered: number[] }>>("flashcard_progress", {});
    if (!progress[subject]) progress[subject] = { viewed: [], mastered: [] };
    if (!progress[subject].mastered.includes(cardId)) {
      progress[subject].mastered.push(cardId);
    }
    await saveData("flashcard_progress", progress);
    return progress[subject];
  },
};

// ─── Calendar Events ─────────────────────────────────────────────────────────

/**
 * Build CalendarEvent objects from real Firestore collections:
 *   timetable  → recurring "class" events expanded for ±30 days
 *   lessons    → enrich class events with topic/objectives on the day they were taught
 *   exams      → "exam" events
 *   assignments→ "assignment" events (placed on dueDate)
 */
export const CalendarService = {
  getAll: async (): Promise<CalendarEvent[]> => {
    const profile = await StudentProfile.get();
    if (!profile.grade || !profile.section) return [];

    const events: CalendarEvent[] = [];
    let nextId = 1;

    const SUBJECT_COLORS: Record<string, string> = {
      mathematics: "#3b82f6", math: "#3b82f6", maths: "#3b82f6",
      physics: "#a855f7", chemistry: "#ef4444",
      biology: "#10b981", science: "#10b981",
      english: "#22c55e", history: "#f59e0b",
      geography: "#06b6d4", hindi: "#ec4899",
      computer: "#6366f1", default: "#64748b",
    };
    const getColor = (subj: string) =>
      SUBJECT_COLORS[subj.toLowerCase()] || SUBJECT_COLORS.default;

    try {
      // ── 1. Timetable → recurring class events (±30 days from today) ──────
      const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const slots = await timetableService.getByClass(profile.grade, profile.section);

      // Pre-fetch lessons so we can enrich class events with topics
      const lessons = await lessonService.getByClass(profile.grade, profile.section);
      // Index lessons by "date::subject(lower)" for fast lookup
      const lessonIndex = new Map<string, typeof lessons[0]>();
      for (const l of lessons) {
        const key = `${l.date}::${l.subject.toLowerCase()}`;
        // Keep the latest entry if duplicates
        if (!lessonIndex.has(key) || (l.date > (lessonIndex.get(key)!.date || ''))) {
          lessonIndex.set(key, l);
        }
      }

      // Pre-fetch homework progress for the current student
      const uid = auth.currentUser?.uid || getUid();
      let quizResultsByTopic = new Map<string, any>();
      try {
        const quizResults = await quizResultService.getByStudent(uid);
        for (const r of quizResults) {
          if (r.subject && r.topic) {
            const key = `${r.completed_at?.split('T')[0] || ''}::${r.subject.toLowerCase()}::${r.topic.toLowerCase()}`;
            quizResultsByTopic.set(key, r);
          }
        }
      } catch { /* ignore */ }

      const now = new Date();
      const rangeStart = new Date(now); rangeStart.setDate(now.getDate() - 30);
      const rangeEnd = new Date(now); rangeEnd.setDate(now.getDate() + 30);

      for (const d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
        const dayName = DAY_NAMES[d.getDay()].toLowerCase();
        const dateStr = getLocalDateStr(d);
        for (const slot of slots) {
          if ((slot.day || '').toLowerCase() === dayName) {
            // Check if teacher logged a lesson for this subject on this date
            const lessonKey = `${dateStr}::${slot.subject.toLowerCase()}`;
            const lesson = lessonIndex.get(lessonKey);

            // Check if student completed homework for this topic
            let homeworkStatus = '';
            if (lesson) {
              const qKey = `${dateStr}::${lesson.subject.toLowerCase()}::${lesson.topic.toLowerCase()}`;
              const qr = quizResultsByTopic.get(qKey);
              if (qr) {
                homeworkStatus = ` · ✅ Completed (${qr.accuracy}%)`;
              }
            }

            const topicLabel = lesson ? lesson.topic : '';
            const description = lesson
              ? `Topic: ${lesson.topic}${lesson.objectives?.length ? ' — ' + lesson.objectives.join(', ') : ''}${homeworkStatus}`
              : `${slot.subject} class with ${slot.teacherName}`;

            events.push({
              id: nextId++,
              title: lesson ? `${slot.subject}: ${lesson.topic}` : `${slot.subject} Class`,
              subject: slot.subject,
              type: "class",
              date: dateStr,
              startTime: slot.startTime,
              endTime: slot.endTime,
              teacher: lesson?.teacherName || slot.teacherName,
              location: slot.room || undefined,
              description,
              color: getColor(slot.subject),
              completed: !!homeworkStatus,
            });
          }
        }
      }

      // ── 2. Lessons → homework events (only for days with actual logs) ────
      for (const lesson of lessons) {
        // Check if student completed this homework
        const qKey = `${lesson.date}::${lesson.subject.toLowerCase()}::${lesson.topic.toLowerCase()}`;
        const qr = quizResultsByTopic.get(qKey);
        const isCompleted = !!qr;

        events.push({
          id: nextId++,
          title: `${lesson.subject}: ${lesson.topic}`,
          subject: lesson.subject,
          type: "homework",
          date: lesson.date,
          teacher: lesson.teacherName,
          description: (lesson.description || lesson.objectives?.join(", ") || lesson.topic)
            + (isCompleted ? ` · ✅ Quiz: ${qr.accuracy}%` : ' · 📝 Pending'),
          color: getColor(lesson.subject),
          completed: isCompleted,
        });
      }

      // ── 3. Exams ─────────────────────────────────────────────────────────
      const exams = await examService.getByClass(profile.grade, profile.section);
      for (const exam of exams) {
        events.push({
          id: nextId++,
          title: `${exam.type.replace("-", " ").toUpperCase()}: ${exam.subject} — ${exam.name}`,
          subject: exam.subject,
          type: "exam",
          date: exam.date,
          description: exam.syllabus || `${exam.name} (${exam.duration} min, ${exam.totalMarks} marks)`,
          color: "#ef4444",
          priority: "high",
        });
      }

      // ── 4. Assignments ───────────────────────────────────────────────────
      const assignments = await assignmentService.getByClass(profile.grade, profile.section);
      for (const a of assignments) {
        events.push({
          id: nextId++,
          title: `${a.subject}: ${a.title}`,
          subject: a.subject,
          type: "assignment",
          date: a.dueDate,
          description: a.description || a.title,
          color: "#f59e0b",
          priority: a.status === "active" ? "medium" : "low",
        });
      }
    } catch (error) {
      console.error("[CalendarService] Error fetching calendar data:", error);
    }

    return events;
  },

  getByDate: async (date: string): Promise<CalendarEvent[]> => {
    const all = await CalendarService.getAll();
    return all.filter(e => e.date === date);
  },
  toggleCompleted: async (eventId: number): Promise<CalendarEvent[]> => {
    // Toggling completion of dynamic events is not persisted for Firestore-sourced events
    return CalendarService.getAll();
  },
  add: async (event: Omit<CalendarEvent, "id">): Promise<CalendarEvent[]> => {
    // Custom events could be saved to student_portal — for now just refresh
    return CalendarService.getAll();
  },
  delete: async (eventId: number): Promise<CalendarEvent[]> => {
    return CalendarService.getAll();
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────

// Maps Firestore notification types → student portal types
function mapFirestoreType(type: string): Notification["type"] {
  switch (type) {
    case "assignment": return "homework";
    case "attendance": return "reminder";
    case "exam": return "deadline";
    case "fee": return "reminder";
    case "announcement": return "announcement";
    default: return "reminder";
  }
}

function mapFirestorePriority(type: string): Notification["priority"] {
  switch (type) {
    case "exam": return "high";
    case "assignment": return "high";
    case "fee": return "medium";
    case "attendance": return "low";
    default: return "medium";
  }
}

function mapFirestoreIcon(type: string): string {
  switch (type) {
    case "assignment": return "📚";
    case "exam": return "📝";
    case "attendance": return "✅";
    case "fee": return "💰";
    case "announcement": return "📢";
    default: return "🔔";
  }
}

// Simple numeric hash from string ID
function hashId(str: string): number {
  return Math.abs(str.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
}

export const NotificationService = {
  /**
   * Fetch all notifications for the current student:
   * 1. Personal + broadcast from Firestore `notifications` collection
   * 2. Smart reminders from the reminder engine (homework, deadlines, classes)
   * 3. Merge, deduplicate, cache locally for mark-read/delete operations
   */
  getAll: async (): Promise<Notification[]> => {
    const user = auth.currentUser || await waitForAuth();
    const profile = await StudentProfile.get();
    const readState = await getData<Record<string, boolean>>("notification_read_state", {});
    const deletedIds = await getData<number[]>("notification_deleted_ids", []);

    let firestoreNotifs: Notification[] = [];

    // 1. Fetch from Firestore notifications collection
    if (user) {
      try {
        // Fetch via email (personal + class broadcast + role broadcast)
        const byEmail = user.email
          ? await notificationService.getByUser(
              user.email,
              "student",
              profile.grade || undefined,
              profile.section || undefined
            )
          : [];

        // Also fetch via UID — some notifications store userId = Firebase UID
        const byUid = user.uid
          ? await notificationService.getByUser(
              user.uid,
              "student",
              profile.grade || undefined,
              profile.section || undefined
            )
          : [];

        // Merge both, deduplicate by Firestore document ID
        const seenFirestoreIds = new Set<string>();
        const rawNotifs: any[] = [];
        for (const n of [...byEmail, ...byUid]) {
          if (!seenFirestoreIds.has(n.id)) {
            seenFirestoreIds.add(n.id);
            rawNotifs.push(n);
          }
        }

        firestoreNotifs = rawNotifs.map(fn => {
          const numId = hashId(fn.id);
          return {
            id: numId,
            type: mapFirestoreType(fn.type),
            title: fn.title,
            message: fn.message,
            timestamp: fn.date || fn.created_at || new Date().toISOString(),
            read: readState[String(numId)] ?? (fn.read === true),
            priority: mapFirestorePriority(fn.type),
            actionUrl: fn.type === "assignment" ? "/homework"
              : fn.type === "exam" ? "/schedule"
              : fn.link || undefined,
            icon: mapFirestoreIcon(fn.type),
            _firestoreId: fn.id,
          } as Notification & { _firestoreId?: string };
        });
      } catch (err) {
        console.warn("[NotificationService] Failed to fetch Firestore notifications:", err);
      }
    }

    // 2. Generate smart reminders from homework/calendar/timetable
    let smartReminders: Notification[] = [];
    try {
      const { generateAllReminders } = await import("./reminderService");
      smartReminders = await generateAllReminders();
      // Apply persisted read/deleted state to smart reminders
      smartReminders = smartReminders.map(r => ({
        ...r,
        read: readState[String(r.id)] ?? r.read,
      }));
    } catch (err) {
      console.warn("[NotificationService] Failed to generate reminders:", err);
    }

    // 3. Combine, deduplicate by title+type, filter deleted
    const combined = [...firestoreNotifs, ...smartReminders];
    const seen = new Set<string>();
    const deduped = combined.filter(n => {
      const key = `${n.type}_${n.title}`;
      if (seen.has(key)) return false;
      if (deletedIds.includes(n.id)) return false;
      seen.add(key);
      return true;
    });

    // Sort by timestamp descending (newest first)
    deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return deduped;
  },

  getUnread: async (): Promise<Notification[]> => {
    const all = await NotificationService.getAll();
    return all.filter(n => !n.read);
  },

  getUnreadCount: async (): Promise<number> => {
    const unread = await NotificationService.getUnread();
    return unread.length;
  },

  /**
   * Lightweight: persist read state + fire-and-forget Firestore sync.
   * Does NOT re-fetch — the component manages local state optimistically.
   */
  markRead: async (notificationId: number, firestoreId?: string): Promise<void> => {
    const readState = await getData<Record<string, boolean>>("notification_read_state", {});
    readState[String(notificationId)] = true;
    await saveData("notification_read_state", readState);

    // Fire-and-forget Firestore sync
    if (firestoreId) {
      notificationService.markAsRead(firestoreId).catch(() => {});
    }
  },

  /**
   * Lightweight: mark all IDs as read locally + fire-and-forget Firestore sync.
   */
  markAllRead: async (ids: number[]): Promise<void> => {
    const readState = await getData<Record<string, boolean>>("notification_read_state", {});
    for (const id of ids) {
      readState[String(id)] = true;
    }
    await saveData("notification_read_state", readState);

    const user = auth.currentUser;
    if (user?.email) {
      notificationService.markAllAsRead(user.email).catch(() => {});
    }
  },

  add: async (notification: Omit<Notification, "id">): Promise<void> => {
    const stored = await getData<Notification[]>("custom_notifications", []);
    const newNotif = { ...notification, id: Date.now() } as Notification;
    await saveData("custom_notifications", [newNotif, ...stored]);
  },

  /**
   * Lightweight: persist deleted ID. Does NOT re-fetch.
   */
  delete: async (notificationId: number): Promise<void> => {
    const deletedIds = await getData<number[]>("notification_deleted_ids", []);
    if (!deletedIds.includes(notificationId)) {
      deletedIds.push(notificationId);
      await saveData("notification_deleted_ids", deletedIds);
    }
  },

  // Keep fetchNotifications as alias for getAll (used by NotificationCenter)
  fetchNotifications: async (): Promise<Notification[]> => {
    return NotificationService.getAll();
  },
};

// ─── Timeline Events ─────────────────────────────────────────────────────────
export const TimelineService = {
  getAll: async () => getData<any[]>("timeline", []),
  add: async (event: any) => {
    const events = await TimelineService.getAll();
    const newEvent = { ...event, id: Date.now() };
    const updated = [newEvent, ...events];
    await saveData("timeline", updated);
    return updated;
  },
};

// ─── Quiz Questions ──────────────────────────────────────────────────────────
export const QuizService = {
  getAll: async () => getData<any[]>("quiz_questions", []),
  getResults: async (): Promise<any[]> => getData<any[]>("quiz_results", []),
  saveResult: async (result: {
    score: number;
    total: number;
    percentage: number;
    subject?: string;
    duration?: number;
    date: string;
    answers: Record<number, any>;
  }) => {
    const results = await QuizService.getResults();
    const newResult = { ...result, id: Date.now() };
    const updated = [newResult, ...results];
    await saveData("quiz_results", updated);
    return updated;
  },
  getBestScore: async (): Promise<number> => {
    const results = await QuizService.getResults();
    if (results.length === 0) return 0;
    return Math.max(...results.map((r: any) => r.percentage));
  },
  getAverageScore: async (): Promise<number> => {
    const results = await QuizService.getResults();
    if (results.length === 0) return 0;
    const sum = results.reduce((acc: number, r: any) => acc + r.percentage, 0);
    return Math.round(sum / results.length);
  },
};

// ─── Settings Service ────────────────────────────────────────────────────────
export const SettingsService = {
  get: async () => getData("settings", {
    notifications: { quizReminders: true, assignmentDue: true, weeklyReport: false },
    theme: "light",
    language: "en",
    soundEnabled: true,
  }),
  update: async (updates: any) => {
    const current = await SettingsService.get();
    const updated = { ...current, ...updates };
    await saveData("settings", updated);
    return updated;
  },
};

// ─── Reset ───────────────────────────────────────────────────────────────────
export async function resetStudentData(): Promise<void> {
  // No-op for Firestore — data is managed per-document
}

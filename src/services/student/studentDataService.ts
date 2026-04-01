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

// ─── Today's Classes ─────────────────────────────────────────────────────────
export const TodaysClasses = {
  getAll: async () => {
    const profile = await StudentProfile.get();
    if (!profile.grade || !profile.section) return getData<any[]>("todays_classes", []);
    
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    
    const slots = await timetableService.getByClass(profile.grade, profile.section);
    const todaysSlots = slots.filter(s => s.day === today);
    
    if (todaysSlots.length === 0) return getData<any[]>("todays_classes", []);

    return todaysSlots.map(s => ({
      id: s.id,
      subject: s.subject,
      teacher: s.teacherName,
      time: `${s.startTime} - ${s.endTime}`,
      icon: s.subject.toLowerCase().includes("math") ? "calculator" : 
            s.subject.toLowerCase().includes("sci") ? "beaker" : "book",
      color: s.subject.toLowerCase().includes("math") ? "bg-blue-500" :
             s.subject.toLowerCase().includes("sci") ? "bg-emerald-500" : "bg-indigo-500",
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
    const todayStr = new Date().toISOString().split("T")[0];

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
      // Primary: quiz_results collection (has real subject data)
      const quizResults = await quizResultService.getByStudent(user.uid);

      // Group by subject
      const subjectMap: Record<string, { scores: number[] }> = {};
      for (const qr of quizResults) {
        const subj = qr.subject || "General";
        if (!subjectMap[subj]) subjectMap[subj] = { scores: [] };
        subjectMap[subj].scores.push(qr.accuracy ?? Math.round((qr.correct / (qr.total || 1)) * 100));
      }

      // Also try exam results
      const profile = await StudentProfile.get();
      if (profile.id) {
        try {
          const examResults = await examResultService.getByStudent(profile.id);
          for (const er of examResults) {
            const subj = "Exams";
            if (!subjectMap[subj]) subjectMap[subj] = { scores: [] };
            subjectMap[subj].scores.push(er.percentage);
          }
        } catch {}
      }

      // Also incorporate homework progress
      const hwTopics = await HomeworkService.getAll();
      for (const hw of hwTopics) {
        if (hw.questionsCompleted && hw.accuracy !== null) {
          const subj = hw.subject;
          if (!subjectMap[subj]) subjectMap[subj] = { scores: [] };
          // Only add if not already counted (quiz_results should have it, but just in case)
          if (quizResults.length === 0) {
            subjectMap[subj].scores.push(hw.accuracy);
          }
        }
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
      const quizResults = await quizResultService.getByStudent(user.uid);
      const hwTopics = await HomeworkService.getAll();

      if (quizResults.length === 0 && hwTopics.length === 0) return [];

      // Derive skill metrics from quiz + homework data
      const totalQuizzes = quizResults.length;
      const totalHw = hwTopics.length;
      const completedHw = hwTopics.filter(h => h.status === "completed").length;
      const avgAccuracy = totalQuizzes > 0
        ? Math.round(quizResults.reduce((s, r) => s + (r.accuracy ?? 0), 0) / totalQuizzes)
        : 0;
      const flashcardAvg = totalHw > 0
        ? Math.round(hwTopics.reduce((s, h) => s + (h.flashcardProgress || 0), 0) / totalHw)
        : 0;
      const quizCompletionRate = totalHw > 0
        ? Math.round((hwTopics.filter(h => h.questionsCompleted).length / totalHw) * 100)
        : 0;

      return [
        { skill: "Quiz Accuracy", current: avgAccuracy, fullMark: 100, expected: 70 },
        { skill: "Flashcard Mastery", current: flashcardAvg, fullMark: 100, expected: 80 },
        { skill: "Completion Rate", current: totalHw > 0 ? Math.round((completedHw / totalHw) * 100) : 0, fullMark: 100, expected: 75 },
        { skill: "Consistency", current: Math.min(totalQuizzes * 20, 100), fullMark: 100, expected: 60 },
        { skill: "Quiz Completion", current: quizCompletionRate, fullMark: 100, expected: 70 },
        { skill: "Engagement", current: Math.min((totalQuizzes + completedHw) * 15, 100), fullMark: 100, expected: 50 },
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
    
    // Load saved progress (keyed by subject) to merge with dynamic data
    const savedProgress = await getData<Record<string, Partial<HomeworkTopic>>>("homework_progress", {});

    const mergeProgress = (topic: HomeworkTopic): HomeworkTopic => {
      const saved = savedProgress[topic.subject];
      if (!saved) return topic;
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

    // Try assignments first
    const assignments = await assignmentService.getByClass(profile.grade, profile.section);
    if (assignments.length > 0) {
      return assignments.map((a, index) => mergeProgress({
        id: index + 1,
        subject: a.subject,
        topic: a.title,
        teacher: "",
        icon: a.subject.toLowerCase().includes("math") ? "calculator" : 
              a.subject.toLowerCase().includes("sci") ? "beaker" : "book",
        color: a.subject.toLowerCase().includes("math") ? "bg-blue-500" :
               a.subject.toLowerCase().includes("sci") ? "bg-emerald-500" : "bg-indigo-500",
        status: a.status === "active" ? "pending" : "completed",
        flashcardProgress: 0,
        questionsProgress: 0,
        flashcardsCompleted: false,
        questionsCompleted: false,
        questionsAttempted: 0,
        totalQuestions: 5,
        accuracy: null,
        lastAttemptDate: null,
      } as HomeworkTopic));
    }

    // Fallback: generate homework topics from lessons collection
    try {
      const lessons = await lessonService.getByClass(profile.grade, profile.section);
      if (lessons.length > 0) {
        // Deduplicate by subject — pick latest lesson per subject
        const subjectMap = new Map<string, typeof lessons[0]>();
        for (const lesson of lessons) {
          const existing = subjectMap.get(lesson.subject);
          if (!existing || (lesson.date && existing.date && lesson.date > existing.date)) {
            subjectMap.set(lesson.subject, lesson);
          }
        }

        return Array.from(subjectMap.values()).map((lesson, index) => mergeProgress({
          id: index + 1,
          subject: lesson.subject,
          topic: lesson.topic,
          teacher: lesson.teacherName,
          icon: lesson.subject.toLowerCase().includes("math") ? "calculator" : 
                lesson.subject.toLowerCase().includes("sci") ? "beaker" : "book",
          color: lesson.subject.toLowerCase().includes("math") ? "bg-blue-500" :
                 lesson.subject.toLowerCase().includes("sci") ? "bg-emerald-500" : "bg-indigo-500",
          status: "pending" as const,
          flashcardProgress: 0,
          questionsProgress: 0,
          flashcardsCompleted: false,
          questionsCompleted: false,
          questionsAttempted: 0,
          totalQuestions: 5,
          accuracy: null,
          lastAttemptDate: null,
        } as HomeworkTopic));
      }
    } catch (e) {
      console.warn("Failed to fetch lessons for homework:", e);
    }

    return getData<HomeworkTopic[]>("homework_topics", []);
  },
  getById: async (id: number): Promise<HomeworkTopic | undefined> => {
    const all = await HomeworkService.getAll();
    return all.find(t => t.id === id);
  },
  updateTopic: async (id: number, updates: Partial<HomeworkTopic>): Promise<HomeworkTopic[]> => {
    const topics = await HomeworkService.getAll();
    const target = topics.find(t => t.id === id);
    if (target) {
      // Save progress keyed by subject so it persists across regenerations
      const savedProgress = await getData<Record<string, Partial<HomeworkTopic>>>("homework_progress", {});
      savedProgress[target.subject] = {
        ...(savedProgress[target.subject] || {}),
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
 *   lessons    → "homework" events on the date the teacher logged them
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
      const now = new Date();
      const rangeStart = new Date(now); rangeStart.setDate(now.getDate() - 30);
      const rangeEnd = new Date(now); rangeEnd.setDate(now.getDate() + 30);

      for (const d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
        const dayName = DAY_NAMES[d.getDay()];
        const dateStr = d.toISOString().split("T")[0];
        for (const slot of slots) {
          if (slot.day === dayName) {
            events.push({
              id: nextId++,
              title: `${slot.subject} Class`,
              subject: slot.subject,
              type: "class",
              date: dateStr,
              startTime: slot.startTime,
              endTime: slot.endTime,
              teacher: slot.teacherName,
              location: slot.room || undefined,
              description: `${slot.subject} class with ${slot.teacherName}`,
              color: getColor(slot.subject),
            });
          }
        }
      }

      // ── 2. Lessons → homework events ─────────────────────────────────────
      const lessons = await lessonService.getByClass(profile.grade, profile.section);
      for (const lesson of lessons) {
        events.push({
          id: nextId++,
          title: `${lesson.subject}: ${lesson.topic}`,
          subject: lesson.subject,
          type: "homework",
          date: lesson.date,
          teacher: lesson.teacherName,
          description: lesson.description || lesson.objectives?.join(", ") || lesson.topic,
          color: getColor(lesson.subject),
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
    if (user?.email) {
      try {
        // Query by student email (personal) + class broadcast + role broadcast
        const rawNotifs = await notificationService.getByUser(
          user.email,
          "student",
          profile.grade || undefined,
          (profile as any).section || undefined
        );

        // Also try by UID in case some notifications use userId = uid
        let byUid: any[] = [];
        try {
          const { fetchCollection } = await import("@/utils/firestoreService").then(m => ({ fetchCollection: m.default })).catch(() => ({ fetchCollection: null }));
          // Just use the already-fetched rawNotifs; UID-based ones would need a separate query
          // but getByUser already handles the main cases
        } catch {}

        firestoreNotifs = rawNotifs.map(fn => {
          const numId = hashId(fn.id);
          return {
            id: numId,
            type: mapFirestoreType(fn.type),
            title: fn.title,
            message: fn.message,
            timestamp: fn.date || fn.created_at || new Date().toISOString(),
            read: readState[String(numId)] ?? fn.read,
            priority: mapFirestorePriority(fn.type),
            actionUrl: fn.type === "assignment" ? "/homework" : fn.type === "exam" ? "/schedule" : undefined,
            icon: mapFirestoreIcon(fn.type),
            _firestoreId: fn.id, // Keep original ID for mark-read
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
      // Apply read state to smart reminders
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

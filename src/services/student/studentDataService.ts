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
export const PendingTasks = {
  getAll: async () => {
    return getData<any[]>("pending_tasks", []);
  },
  complete: async (taskId: number | string) => {
    const tasks = await PendingTasks.getAll();
    const updated = tasks.filter((t: any) => t.id !== taskId);
    await saveData("pending_tasks", updated);
    const completion = await getData<Record<string, boolean>>("task_completion", {});
    completion[String(taskId)] = true;
    await saveData("task_completion", completion);
    return updated;
  },
  isCompleted: async (taskId: number | string) => {
    const completion = await getData<Record<string, boolean>>("task_completion", {});
    return !!completion[String(taskId)];
  },
  add: async (task: any) => {
    const tasks = await PendingTasks.getAll();
    const newTask = { ...task, id: Date.now() };
    const updated = [...tasks, newTask];
    await saveData("pending_tasks", updated);
    return updated;
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
    const profile = await StudentProfile.get();
    if (profile.id) {
      try {
        // Fetch all exam results for the student
        const results = await examResultService.getByStudent(profile.id);
        if (results.length > 0) {
          // Map to month-based format for the LineChart
          // Since we might not have a full year's data, we'll extract months from any date info 
          // or just show the last N results as months if dates are missing.
          const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
          return results.map((r, i) => ({
            month: months[i % 12],
            score: r.percentage
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch real performance data:", err);
      }
    }

    return getData<any[]>("performance_data", []);
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
    const profile = await StudentProfile.get();
    if (profile.id) {
      try {
        const [results, submissions] = await Promise.all([
          examResultService.getByStudent(profile.id),
          assignmentSubmissionService.getByStudent(profile.id)
        ]);

        if (results.length > 0 || submissions.length > 0) {
          // Aggregate by subject
          const subjectMap: Record<string, { scores: number[], color: string }> = {};
          
          // Helper to get consistent colors
          const getSubjectColor = (subject: string): string => {
            const low = subject.toLowerCase();
            if (low.includes('math')) return 'bg-blue-500';
            if (low.includes('sci')) return 'bg-emerald-500';
            if (low.includes('eng')) return 'bg-indigo-500';
            return 'bg-amber-500';
          };

          // Process Exam Results
          results.forEach(r => {
            // Note: Exam results might not have subject directly if they reference an Exam doc.
            // For now, let's assume 'General' if subject info is deep or missing in this join.
            // (In a real app, we'd join with the Exam doc here)
            const subj = 'Exams'; 
            if (!subjectMap[subj]) subjectMap[subj] = { scores: [], color: 'bg-blue-600' };
            subjectMap[subj].scores.push(r.percentage);
          });

          // Process Assignments
          // Note: Submissions also need to be joined with Assignment to get the subject.
          // For now, let's group by 'Assignments' if subject isn't immediate.
          submissions.filter(s => s.status === 'graded').forEach(s => {
             const subj = 'Assignments';
             if (!subjectMap[subj]) subjectMap[subj] = { scores: [], color: 'bg-indigo-600' };
             if (s.marksObtained !== undefined && (s as any).totalMarks) {
               subjectMap[subj].scores.push(Math.round((s.marksObtained / (s as any).totalMarks) * 100));
             }
          });

          if (Object.keys(subjectMap).length > 0) {
            return Object.entries(subjectMap).map(([subject, data]) => ({
              subject,
              score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
              trend: "up", // Default to up for new recordings
              color: data.color,
              data: data.scores.slice(-5), // Last 5 scores for the mini sparkline
              icon: "book-open"
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to aggregate subject performance:", err);
      }
    }

    return getData<any[]>("subject_performance", []);
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
    return getData<any[]>("skills_data", []);
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
    try {
      const results = await QuizService.getResults();
      if (results.length > 0) {
        // Group by week (simple grouping for now: last 4 results as 'Week 1', 'Week 2' etc.)
        return results.slice(-4).reverse().map((r, i) => ({
          week: `Week ${i + 1}`,
          average: r.percentage,
          completion: 100 // Assume 100% completion for a finished quiz
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch real quiz trends:", err);
    }

    return getData<any[]>("quiz_trends", []);
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
export const CalendarService = {
  getAll: async (): Promise<CalendarEvent[]> => getData<CalendarEvent[]>("calendar_events", []),
  getByDate: async (date: string): Promise<CalendarEvent[]> => {
    const all = await CalendarService.getAll();
    return all.filter(e => e.date === date);
  },
  toggleCompleted: async (eventId: number): Promise<CalendarEvent[]> => {
    const events = await CalendarService.getAll();
    const updated = events.map(e =>
      e.id === eventId ? { ...e, completed: !e.completed } : e
    );
    await saveData("calendar_events", updated);
    return updated;
  },
  add: async (event: Omit<CalendarEvent, "id">): Promise<CalendarEvent[]> => {
    const events = await CalendarService.getAll();
    const newEvent = { ...event, id: Date.now() };
    const updated = [...events, newEvent];
    await saveData("calendar_events", updated);
    return updated;
  },
  delete: async (eventId: number): Promise<CalendarEvent[]> => {
    const events = await CalendarService.getAll();
    const updated = events.filter(e => e.id !== eventId);
    await saveData("calendar_events", updated);
    return updated;
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const NotificationService = {
  getAll: async (): Promise<Notification[]> => getData<Notification[]>("notifications", []),
  getUnread: async (): Promise<Notification[]> => {
    const all = await NotificationService.getAll();
    return all.filter(n => !n.read);
  },
  getUnreadCount: async (): Promise<number> => {
    const unread = await NotificationService.getUnread();
    return unread.length;
  },
  markRead: async (notificationId: number): Promise<Notification[]> => {
    const notifications = await NotificationService.getAll();
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    await saveData("notifications", updated);
    return updated;
  },
  markAllRead: async (): Promise<Notification[]> => {
    const notifications = await NotificationService.getAll();
    const updated = notifications.map(n => ({ ...n, read: true }));
    await saveData("notifications", updated);
    return updated;
  },
  add: async (notification: Omit<Notification, "id">): Promise<Notification[]> => {
    const notifications = await NotificationService.getAll();
    const newNotif = { ...notification, id: Date.now() };
    const updated = [newNotif, ...notifications];
    await saveData("notifications", updated);
    return updated;
  },
  delete: async (notificationId: number): Promise<Notification[]> => {
    const notifications = await NotificationService.getAll();
    const updated = notifications.filter(n => n.id !== notificationId);
    await saveData("notifications", updated);
    return updated;
  },
  fetchNotifications: async (): Promise<Notification[]> => {
    try {
      // 1. Fetch personal + role-based notifications from Firestore
      const userEmail = auth.currentUser?.email;
      const profile = await StudentProfile.get();
      const firestoreNotifs = userEmail 
        ? await notificationService.getByUser(userEmail, 'student', profile.grade || undefined, (profile as any).section || undefined)
        : [];

      // 2. Fetch local storage notifications (current system)
      const localNotifs = await getData<Notification[]>("notifications", []);

      // 3. Map Firestore notifications to the Student Portal's interface
      const mappedFirestoreNotifs: Notification[] = firestoreNotifs.map(fn => ({
        id: Math.abs(fn.id.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)), // Generate a numeric ID from hash
        type: fn.type === 'announcement' ? 'announcement' : 
              fn.type === 'assignment' ? 'homework' : 'reminder',
        title: fn.title,
        message: fn.message,
        timestamp: fn.date || new Date().toISOString(), // Use date from Firestore, fallback to now
        read: fn.read,
        priority: 'medium',
        icon: fn.type === 'announcement' ? '📢' : '📚',
        color: fn.type === 'announcement' ? '#6366f1' : '#3b82f6'
      }));

      // Combine and sort by timestamp (descending)
      return [...mappedFirestoreNotifs, ...localNotifs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error("Failed to fetch notifications for student:", error);
      return getData<Notification[]>("notifications", []);
    }
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

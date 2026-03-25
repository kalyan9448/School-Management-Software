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
  type HomeworkTopic,
  type ObjectiveQuestion,
  type CalendarEvent,
  type Notification,
} from "@/data/studentMockData";

// ─── Firestore helpers ────────────────────────────────────────────────────────

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
  get: async () => getData("student_profile", { name: "", grade: "", avatar: "", email: "" }),
  update: async (data: Record<string, any>) => {
    const current = await StudentProfile.get();
    const updated = { ...current, ...data };
    await saveData("student_profile", updated);
    return updated;
  },
};

// ─── Motivational Quotes ─────────────────────────────────────────────────────
export const Quotes = {
  getAll: async () => getData<string[]>("quotes", []),
  getRandom: async () => {
    const quotes = await Quotes.getAll();
    if (quotes.length === 0) return "";
    return quotes[Math.floor(Math.random() * quotes.length)];
  },
};

// ─── Today's Classes ─────────────────────────────────────────────────────────
export const TodaysClasses = {
  getAll: async () => getData<any[]>("todays_classes", []),
  updateStatus: async (classId: number, status: string) => {
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
  getAll: async () => getData<any[]>("pending_tasks", []),
  complete: async (taskId: number) => {
    const tasks = await PendingTasks.getAll();
    const updated = tasks.filter((t: any) => t.id !== taskId);
    await saveData("pending_tasks", updated);
    const completion = await getData<Record<number, boolean>>("task_completion", {});
    completion[taskId] = true;
    await saveData("task_completion", completion);
    return updated;
  },
  isCompleted: async (taskId: number) => {
    const completion = await getData<Record<number, boolean>>("task_completion", {});
    return !!completion[taskId];
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
  getAll: async () => getData<any[]>("learning_goals", []),
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
  getAll: async () => getData<any[]>("performance_data", []),
  addMonth: async (month: string, score: number) => {
    const data = await PerformanceData.getAll();
    const existing = data.findIndex((d: any) => d.month === month);
    let updated;
    if (existing >= 0) {
      updated = data.map((d: any, i: number) =>
        i === existing ? { ...d, score } : d
      );
    } else {
      updated = [...data, { month, score }];
    }
    await saveData("performance_data", updated);
    return updated;
  },
};

// ─── Subject Performance ─────────────────────────────────────────────────────
export const SubjectPerformance = {
  getAll: async () => getData<any[]>("subject_performance", []),
  updateScore: async (subject: string, newScore: number) => {
    const perfs = await SubjectPerformance.getAll();
    const updated = perfs.map((p: any) => {
      if (p.subject === subject) {
        const prevScore = p.score;
        const trend = newScore > prevScore ? "up" : newScore < prevScore ? "down" : "same";
        const data = [...p.data.slice(1), newScore];
        return { ...p, score: newScore, trend, data };
      }
      return p;
    });
    await saveData("subject_performance", updated);
    return updated;
  },
};

// ─── Skills Data (radar chart) ───────────────────────────────────────────────
export const SkillsData = {
  getAll: async () => getData<any[]>("skills_data", []),
  update: async (skill: string, current: number) => {
    const skills = await SkillsData.getAll();
    const updated = skills.map((s: any) =>
      s.skill === skill ? { ...s, current } : s
    );
    await saveData("skills_data", updated);
    return updated;
  },
};

// ─── Topic Mastery ───────────────────────────────────────────────────────────
export const TopicMastery = {
  getAll: async () => getData<any[]>("topic_mastery", []),
  updateProgress: async (topic: string, progress: number) => {
    const topics = await TopicMastery.getAll();
    const level = progress >= 90 ? "Mastered" : progress >= 60 ? "Advanced" : progress >= 30 ? "Intermediate" : "Beginner";
    const updated = topics.map((t: any) =>
      t.topic === topic ? { ...t, progress, level } : t
    );
    await saveData("topic_mastery", updated);
    return updated;
  },
};

// ─── Quiz Trends ─────────────────────────────────────────────────────────────
export const QuizTrends = {
  getAll: async () => getData<any[]>("quiz_trends", []),
  addWeek: async (week: string, average: number, completion: number) => {
    const trends = await QuizTrends.getAll();
    const updated = [...trends, { week, average, completion }];
    await saveData("quiz_trends", updated);
    return updated;
  },
};

// ─── Attendance ──────────────────────────────────────────────────────────────
export const AttendanceService = {
  get: async () => getData("attendance", { present: 0, absent: 0, total: 0, percentage: 0 }),
  markPresent: async () => {
    const att: any = await AttendanceService.get();
    const updated = {
      ...att,
      present: att.present + 1,
      total: att.total + 1,
      percentage: Math.round(((att.present + 1) / (att.total + 1)) * 100),
    };
    await saveData("attendance", updated);
    return updated;
  },
  markAbsent: async () => {
    const att: any = await AttendanceService.get();
    const updated = {
      ...att,
      absent: att.absent + 1,
      total: att.total + 1,
      percentage: Math.round((att.present / (att.total + 1)) * 100),
    };
    await saveData("attendance", updated);
    return updated;
  },
};

// ─── Daily Tasks by Subject ──────────────────────────────────────────────────
export const DailyTasks = {
  getAll: async () => getData<any[]>("daily_tasks", []),
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
  getAll: async (): Promise<HomeworkTopic[]> => getData<HomeworkTopic[]>("homework_topics", []),
  getById: async (id: number): Promise<HomeworkTopic | undefined> => {
    const all = await HomeworkService.getAll();
    return all.find(t => t.id === id);
  },
  updateTopic: async (id: number, updates: Partial<HomeworkTopic>): Promise<HomeworkTopic[]> => {
    const topics = await HomeworkService.getAll();
    const updated = topics.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    await saveData("homework_topics", updated);
    return updated;
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
    const allResults = await getData<Record<number, any>>("topic_quiz_results", {});
    allResults[topicId] = results;
    await saveData("topic_quiz_results", allResults);
  },
  getDetailedResults: async (topicId: number) => {
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

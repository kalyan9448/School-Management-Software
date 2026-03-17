// =============================================================================
// Student Data Service — localStorage-backed dynamic data layer
// Seeds mock data on first load, then all mutations persist in localStorage.
// Pattern matches centralDataService.ts used by other dashboards.
// =============================================================================

import {
  studentData as defaultStudentData,
  motivationalQuotes as defaultQuotes,
  todaysClasses as defaultClasses,
  pendingTasks as defaultPendingTasks,
  learningGoals as defaultGoals,
  performanceData as defaultPerformance,
  subjectPerformance as defaultSubjectPerf,
  skillsData as defaultSkills,
  topicMastery as defaultMastery,
  quizTrends as defaultQuizTrends,
  attendanceData as defaultAttendance,
  dailyTasksBySubject as defaultDailyTasks,
  homeworkTopics as defaultHomeworkTopics,
  objectiveQuestions as defaultQuestions,
  flashcardsBySubject as defaultFlashcards,
  calendarEvents as defaultCalendarEvents,
  notifications as defaultNotifications,
  timelineEvents as defaultTimeline,
  quizQuestions as defaultQuizQuestions,
  type HomeworkTopic,
  type ObjectiveQuestion,
  type CalendarEvent,
  type Notification,
} from "@/data/studentMockData";

// ─── LocalStorage Key Constants ───────────────────────────────────────────────
const KEYS = {
  STUDENT_PROFILE:       "student_profile",
  QUOTES:                "student_quotes",
  TODAYS_CLASSES:        "student_todays_classes",
  PENDING_TASKS:         "student_pending_tasks",
  LEARNING_GOALS:        "student_learning_goals",
  PERFORMANCE_DATA:      "student_performance_data",
  SUBJECT_PERFORMANCE:   "student_subject_performance",
  SKILLS_DATA:           "student_skills_data",
  TOPIC_MASTERY:         "student_topic_mastery",
  QUIZ_TRENDS:           "student_quiz_trends",
  ATTENDANCE:            "student_attendance",
  DAILY_TASKS:           "student_daily_tasks",
  HOMEWORK_TOPICS:       "student_homework_topics",
  OBJECTIVE_QUESTIONS:   "student_objective_questions",
  FLASHCARDS:            "student_flashcards",
  CALENDAR_EVENTS:       "student_calendar_events",
  NOTIFICATIONS:         "student_notifications",
  TIMELINE:              "student_timeline",
  QUIZ_QUESTIONS:        "student_quiz_questions",
  TASK_COMPLETION:       "student_task_completion",
  QUIZ_RESULTS:          "student_quiz_results",
  FLASHCARD_PROGRESS:    "student_flashcard_progress",
  TOPIC_QUIZ_RESULTS:   "student_topic_quiz_results",
  SETTINGS:             "student_settings",
  INITIALIZED:           "student_data_initialized",
} as const;

// ─── Generic localStorage helpers ─────────────────────────────────────────────
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function seedIfEmpty<T>(key: string, defaultData: T): void {
  if (!localStorage.getItem(key)) {
    saveToStorage(key, defaultData);
  }
}

// ─── Initialize / Seed ───────────────────────────────────────────────────────
export function initializeStudentData(force = false): void {
  if (!force && localStorage.getItem(KEYS.INITIALIZED)) return;

  seedIfEmpty(KEYS.STUDENT_PROFILE, defaultStudentData);
  seedIfEmpty(KEYS.QUOTES, defaultQuotes);
  seedIfEmpty(KEYS.TODAYS_CLASSES, defaultClasses);
  seedIfEmpty(KEYS.PENDING_TASKS, defaultPendingTasks);
  seedIfEmpty(KEYS.LEARNING_GOALS, defaultGoals);
  seedIfEmpty(KEYS.PERFORMANCE_DATA, defaultPerformance);
  seedIfEmpty(KEYS.SUBJECT_PERFORMANCE, defaultSubjectPerf);
  seedIfEmpty(KEYS.SKILLS_DATA, defaultSkills);
  seedIfEmpty(KEYS.TOPIC_MASTERY, defaultMastery);
  seedIfEmpty(KEYS.QUIZ_TRENDS, defaultQuizTrends);
  seedIfEmpty(KEYS.ATTENDANCE, defaultAttendance);
  seedIfEmpty(KEYS.DAILY_TASKS, defaultDailyTasks);
  seedIfEmpty(KEYS.HOMEWORK_TOPICS, defaultHomeworkTopics);
  seedIfEmpty(KEYS.OBJECTIVE_QUESTIONS, defaultQuestions);
  seedIfEmpty(KEYS.FLASHCARDS, defaultFlashcards);
  seedIfEmpty(KEYS.CALENDAR_EVENTS, defaultCalendarEvents);
  seedIfEmpty(KEYS.SETTINGS, {
    notifications: {
      quizReminders: true,
      assignmentDue: true,
      weeklyReport: false,
    },
    theme: "light",
    language: "en",
    soundEnabled: true,
  });
  seedIfEmpty(KEYS.NOTIFICATIONS, defaultNotifications);
  seedIfEmpty(KEYS.TIMELINE, defaultTimeline);
  seedIfEmpty(KEYS.QUIZ_QUESTIONS, defaultQuizQuestions);
  seedIfEmpty(KEYS.TASK_COMPLETION, {});
  seedIfEmpty(KEYS.QUIZ_RESULTS, []);
  seedIfEmpty(KEYS.FLASHCARD_PROGRESS, {});

  localStorage.setItem(KEYS.INITIALIZED, "true");
}

// ─── Student Profile ─────────────────────────────────────────────────────────
export const StudentProfile = {
  get: () => getFromStorage(KEYS.STUDENT_PROFILE, defaultStudentData),
  update: (data: Partial<typeof defaultStudentData>) => {
    const current = StudentProfile.get();
    const updated = { ...current, ...data };
    saveToStorage(KEYS.STUDENT_PROFILE, updated);
    return updated;
  },
};

// ─── Motivational Quotes ─────────────────────────────────────────────────────
export const Quotes = {
  getAll: () => getFromStorage<string[]>(KEYS.QUOTES, defaultQuotes),
  getRandom: () => {
    const quotes = Quotes.getAll();
    return quotes[Math.floor(Math.random() * quotes.length)];
  },
};

// ─── Today's Classes ─────────────────────────────────────────────────────────
export const TodaysClasses = {
  getAll: () => getFromStorage(KEYS.TODAYS_CLASSES, defaultClasses),
  updateStatus: (classId: number, status: string) => {
    const classes = TodaysClasses.getAll();
    const updated = classes.map((c: any) =>
      c.id === classId ? { ...c, status } : c
    );
    saveToStorage(KEYS.TODAYS_CLASSES, updated);
    return updated;
  },
};

// ─── Pending Tasks ───────────────────────────────────────────────────────────
export const PendingTasks = {
  getAll: () => getFromStorage(KEYS.PENDING_TASKS, defaultPendingTasks),
  complete: (taskId: number) => {
    const tasks = PendingTasks.getAll();
    const updated = tasks.filter((t: any) => t.id !== taskId);
    saveToStorage(KEYS.PENDING_TASKS, updated);
    // Also track completion
    const completion = getFromStorage<Record<number, boolean>>(KEYS.TASK_COMPLETION, {});
    completion[taskId] = true;
    saveToStorage(KEYS.TASK_COMPLETION, completion);
    return updated;
  },
  isCompleted: (taskId: number) => {
    const completion = getFromStorage<Record<number, boolean>>(KEYS.TASK_COMPLETION, {});
    return !!completion[taskId];
  },
  add: (task: any) => {
    const tasks = PendingTasks.getAll();
    const newTask = { ...task, id: Date.now() };
    const updated = [...tasks, newTask];
    saveToStorage(KEYS.PENDING_TASKS, updated);
    return updated;
  },
};

// ─── Learning Goals ──────────────────────────────────────────────────────────
export const LearningGoals = {
  getAll: () => getFromStorage(KEYS.LEARNING_GOALS, defaultGoals),
  updateProgress: (subject: string, current: number) => {
    const goals = LearningGoals.getAll();
    const updated = goals.map((g: any) =>
      g.subject === subject ? { ...g, current: Math.min(current, g.target) } : g
    );
    saveToStorage(KEYS.LEARNING_GOALS, updated);
    return updated;
  },
};

// ─── Performance Data (monthly scores chart) ─────────────────────────────────
export const PerformanceData = {
  getAll: () => getFromStorage(KEYS.PERFORMANCE_DATA, defaultPerformance),
  addMonth: (month: string, score: number) => {
    const data = PerformanceData.getAll();
    const existing = data.findIndex((d: any) => d.month === month);
    let updated;
    if (existing >= 0) {
      updated = data.map((d: any, i: number) =>
        i === existing ? { ...d, score } : d
      );
    } else {
      updated = [...data, { month, score }];
    }
    saveToStorage(KEYS.PERFORMANCE_DATA, updated);
    return updated;
  },
};

// ─── Subject Performance ─────────────────────────────────────────────────────
export const SubjectPerformance = {
  getAll: () => getFromStorage(KEYS.SUBJECT_PERFORMANCE, defaultSubjectPerf),
  updateScore: (subject: string, newScore: number) => {
    const perfs = SubjectPerformance.getAll();
    const updated = perfs.map((p: any) => {
      if (p.subject === subject) {
        const prevScore = p.score;
        const trend = newScore > prevScore ? "up" : newScore < prevScore ? "down" : "same";
        const data = [...p.data.slice(1), newScore];
        return { ...p, score: newScore, trend, data };
      }
      return p;
    });
    saveToStorage(KEYS.SUBJECT_PERFORMANCE, updated);
    return updated;
  },
};

// ─── Skills Data (radar chart) ───────────────────────────────────────────────
export const SkillsData = {
  getAll: () => getFromStorage(KEYS.SKILLS_DATA, defaultSkills),
  update: (skill: string, current: number) => {
    const skills = SkillsData.getAll();
    const updated = skills.map((s: any) =>
      s.skill === skill ? { ...s, current } : s
    );
    saveToStorage(KEYS.SKILLS_DATA, updated);
    return updated;
  },
};

// ─── Topic Mastery ───────────────────────────────────────────────────────────
export const TopicMastery = {
  getAll: () => getFromStorage(KEYS.TOPIC_MASTERY, defaultMastery),
  updateProgress: (topic: string, progress: number) => {
    const topics = TopicMastery.getAll();
    const level = progress >= 90 ? "Mastered" : progress >= 60 ? "Advanced" : progress >= 30 ? "Intermediate" : "Beginner";
    const updated = topics.map((t: any) =>
      t.topic === topic ? { ...t, progress, level } : t
    );
    saveToStorage(KEYS.TOPIC_MASTERY, updated);
    return updated;
  },
};

// ─── Quiz Trends ─────────────────────────────────────────────────────────────
export const QuizTrends = {
  getAll: () => getFromStorage(KEYS.QUIZ_TRENDS, defaultQuizTrends),
  addWeek: (week: string, average: number, completion: number) => {
    const trends = QuizTrends.getAll();
    const updated = [...trends, { week, average, completion }];
    saveToStorage(KEYS.QUIZ_TRENDS, updated);
    return updated;
  },
};

// ─── Attendance ──────────────────────────────────────────────────────────────
export const AttendanceService = {
  get: () => getFromStorage(KEYS.ATTENDANCE, defaultAttendance),
  markPresent: () => {
    const att = AttendanceService.get();
    const updated = {
      ...att,
      present: att.present + 1,
      total: att.total + 1,
      percentage: Math.round(((att.present + 1) / (att.total + 1)) * 100),
    };
    saveToStorage(KEYS.ATTENDANCE, updated);
    return updated;
  },
  markAbsent: () => {
    const att = AttendanceService.get();
    const updated = {
      ...att,
      absent: att.absent + 1,
      total: att.total + 1,
      percentage: Math.round((att.present / (att.total + 1)) * 100),
    };
    saveToStorage(KEYS.ATTENDANCE, updated);
    return updated;
  },
};

// ─── Daily Tasks by Subject ──────────────────────────────────────────────────
export const DailyTasks = {
  getAll: () => getFromStorage(KEYS.DAILY_TASKS, defaultDailyTasks),
  toggleTaskCompletion: (taskId: number) => {
    const subjects = DailyTasks.getAll();
    const updated = subjects.map((s: any) => ({
      ...s,
      tasks: s.tasks.map((t: any) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
    saveToStorage(KEYS.DAILY_TASKS, updated);
    return updated;
  },
  getCompletionStats: () => {
    const subjects = DailyTasks.getAll();
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
  getAll: (): HomeworkTopic[] => getFromStorage(KEYS.HOMEWORK_TOPICS, defaultHomeworkTopics),
  getById: (id: number): HomeworkTopic | undefined => {
    return HomeworkService.getAll().find(t => t.id === id);
  },
  updateTopic: (id: number, updates: Partial<HomeworkTopic>): HomeworkTopic[] => {
    const topics = HomeworkService.getAll();
    const updated = topics.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    saveToStorage(KEYS.HOMEWORK_TOPICS, updated);
    return updated;
  },
  getRecommendedQuizzes: () => {
    const topics = HomeworkService.getAll();
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
  updateFlashcardProgress: (topicId: number, progress: number): HomeworkTopic[] => {
    const completed = progress >= 100;
    return HomeworkService.updateTopic(topicId, {
      flashcardProgress: Math.min(progress, 100),
      flashcardsCompleted: completed,
      status: completed ? "in-progress" : "pending",
    });
  },
  updateQuestionsProgress: (topicId: number, attempted: number, correct: number, total: number): HomeworkTopic[] => {
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
  saveDetailedResults: (topicId: number, results: any) => {
    const allResults = getFromStorage<Record<number, any>>(KEYS.TOPIC_QUIZ_RESULTS, {});
    allResults[topicId] = results;
    saveToStorage(KEYS.TOPIC_QUIZ_RESULTS, allResults);
  },
  getDetailedResults: (topicId: number) => {
    const allResults = getFromStorage<Record<number, any>>(KEYS.TOPIC_QUIZ_RESULTS, {});
    return allResults[topicId];
  },
  getStats: () => {
    const topics = HomeworkService.getAll();
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
  getAll: (): ObjectiveQuestion[] => getFromStorage(KEYS.OBJECTIVE_QUESTIONS, defaultQuestions),
  getByTopicId: (topicId: number): ObjectiveQuestion[] => {
    return ObjectiveQuestions.getAll().filter(q => q.topicId === topicId);
  },
};

// ─── Flashcards ──────────────────────────────────────────────────────────────
export const Flashcards = {
  getAll: () => getFromStorage<Record<string, any[]>>(KEYS.FLASHCARDS, defaultFlashcards),
  getBySubject: (subject: string) => {
    const all = Flashcards.getAll();
    return all[subject] || [];
  },
  getProgress: (subject: string): { viewed: number[]; mastered: number[] } => {
    const progress = getFromStorage<Record<string, { viewed: number[]; mastered: number[] }>>(
      KEYS.FLASHCARD_PROGRESS, {}
    );
    return progress[subject] || { viewed: [], mastered: [] };
  },
  markViewed: (subject: string, cardId: number) => {
    const progress = getFromStorage<Record<string, { viewed: number[]; mastered: number[] }>>(
      KEYS.FLASHCARD_PROGRESS, {}
    );
    if (!progress[subject]) progress[subject] = { viewed: [], mastered: [] };
    if (!progress[subject].viewed.includes(cardId)) {
      progress[subject].viewed.push(cardId);
    }
    saveToStorage(KEYS.FLASHCARD_PROGRESS, progress);
    return progress[subject];
  },
  markMastered: (subject: string, cardId: number) => {
    const progress = getFromStorage<Record<string, { viewed: number[]; mastered: number[] }>>(
      KEYS.FLASHCARD_PROGRESS, {}
    );
    if (!progress[subject]) progress[subject] = { viewed: [], mastered: [] };
    if (!progress[subject].mastered.includes(cardId)) {
      progress[subject].mastered.push(cardId);
    }
    saveToStorage(KEYS.FLASHCARD_PROGRESS, progress);
    return progress[subject];
  },
};

// ─── Calendar Events ─────────────────────────────────────────────────────────
export const CalendarService = {
  getAll: (): CalendarEvent[] => getFromStorage(KEYS.CALENDAR_EVENTS, defaultCalendarEvents),
  getByDate: (date: string): CalendarEvent[] => {
    return CalendarService.getAll().filter(e => e.date === date);
  },
  toggleCompleted: (eventId: number): CalendarEvent[] => {
    const events = CalendarService.getAll();
    const updated = events.map(e =>
      e.id === eventId ? { ...e, completed: !e.completed } : e
    );
    saveToStorage(KEYS.CALENDAR_EVENTS, updated);
    return updated;
  },
  add: (event: Omit<CalendarEvent, "id">): CalendarEvent[] => {
    const events = CalendarService.getAll();
    const newEvent = { ...event, id: Date.now() };
    const updated = [...events, newEvent];
    saveToStorage(KEYS.CALENDAR_EVENTS, updated);
    return updated;
  },
  delete: (eventId: number): CalendarEvent[] => {
    const events = CalendarService.getAll();
    const updated = events.filter(e => e.id !== eventId);
    saveToStorage(KEYS.CALENDAR_EVENTS, updated);
    return updated;
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const NotificationService = {
  getAll: (): Notification[] => getFromStorage(KEYS.NOTIFICATIONS, defaultNotifications),
  getUnread: (): Notification[] => {
    return NotificationService.getAll().filter(n => !n.read);
  },
  getUnreadCount: (): number => {
    return NotificationService.getUnread().length;
  },
  markRead: (notificationId: number): Notification[] => {
    const notifications = NotificationService.getAll();
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveToStorage(KEYS.NOTIFICATIONS, updated);
    return updated;
  },
  markAllRead: (): Notification[] => {
    const notifications = NotificationService.getAll();
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveToStorage(KEYS.NOTIFICATIONS, updated);
    return updated;
  },
  add: (notification: Omit<Notification, "id">): Notification[] => {
    const notifications = NotificationService.getAll();
    const newNotif = { ...notification, id: Date.now() };
    const updated = [newNotif, ...notifications];
    saveToStorage(KEYS.NOTIFICATIONS, updated);
    return updated;
  },
  delete: (notificationId: number): Notification[] => {
    const notifications = NotificationService.getAll();
    const updated = notifications.filter(n => n.id !== notificationId);
    saveToStorage(KEYS.NOTIFICATIONS, updated);
    return updated;
  },
  /**
   * Simulates an asynchronous fetch of notifications.
   * Useful for UI components that want to show a loading state.
   */
  fetchNotifications: async (): Promise<Notification[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return NotificationService.getAll();
  }
};

// ─── Timeline Events ─────────────────────────────────────────────────────────
export const TimelineService = {
  getAll: () => getFromStorage(KEYS.TIMELINE, defaultTimeline),
  add: (event: any) => {
    const events = TimelineService.getAll();
    const newEvent = { ...event, id: Date.now() };
    const updated = [newEvent, ...events];
    saveToStorage(KEYS.TIMELINE, updated);
    return updated;
  },
};

// ─── Quiz Questions ──────────────────────────────────────────────────────────
export const QuizService = {
  getAll: () => getFromStorage(KEYS.QUIZ_QUESTIONS, defaultQuizQuestions),
  getResults: (): any[] => getFromStorage(KEYS.QUIZ_RESULTS, []),
  saveResult: (result: {
    score: number;
    total: number;
    percentage: number;
    subject?: string;
    duration?: number;
    date: string;
    answers: Record<number, any>;
  }) => {
    const results = QuizService.getResults();
    const newResult = { ...result, id: Date.now() };
    const updated = [newResult, ...results];
    saveToStorage(KEYS.QUIZ_RESULTS, updated);
    return updated;
  },
  getBestScore: (): number => {
    const results = QuizService.getResults();
    if (results.length === 0) return 0;
    return Math.max(...results.map((r: any) => r.percentage));
  },
  getAverageScore: (): number => {
    const results = QuizService.getResults();
    if (results.length === 0) return 0;
    const sum = results.reduce((acc: number, r: any) => acc + r.percentage, 0);
    return Math.round(sum / results.length);
  },
};

// ─── Settings Service ────────────────────────────────────────────────────────
export const SettingsService = {
  get: () => getFromStorage(KEYS.SETTINGS, {
    notifications: { quizReminders: true, assignmentDue: true, weeklyReport: false },
    theme: "light",
    language: "en",
    soundEnabled: true,
  }),
  update: (updates: any) => {
    const current = SettingsService.get();
    const updated = { ...current, ...updates };
    saveToStorage(KEYS.SETTINGS, updated);
    return updated;
  },
};

// ─── Reset ───────────────────────────────────────────────────────────────────
export function resetStudentData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  initializeStudentData(true);
}

// ─── Export all keys for debugging ───────────────────────────────────────────
export { KEYS as STUDENT_STORAGE_KEYS };

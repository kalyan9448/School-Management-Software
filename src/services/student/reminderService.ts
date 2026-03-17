// Reminder Engine - Automatically generates notifications based on homework, calendar events, and deadlines

import { calendarEvents, todaysClasses } from "@/data/studentMockData";

export interface Notification {
  id: number;
  type: "homework" | "deadline" | "reminder" | "announcement" | "grade";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  actionUrl?: string;
  icon?: string;
  color?: string;
}

// Generate unique ID
let notificationIdCounter = 1000;

const generateId = () => {
  notificationIdCounter += 1;
  return notificationIdCounter;
};

// Get date strings
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getTomorrowString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const getDateString = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const getDaysUntil = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/** Returns ISO timestamp for today at the given hour:minute */
const todayAt = (hour: number, minute = 0): string => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// Generate homework reminders from todaysClasses
export const generateHomeworkReminders = (): Notification[] => {
  const reminders: Notification[] = [];
  const today = getTodayString();

  todaysClasses.forEach((classItem) => {
    // Check if homework is pending
    const homeworkKey = `homework_${classItem.id}_status`;
    const homeworkStatus = localStorage.getItem(homeworkKey) || "pending";

    if (homeworkStatus === "pending") {
      reminders.push({
        id: generateId(),
        type: "homework",
        title: `Complete ${classItem.subject} Homework`,
        message: `You have pending homework for "${classItem.topicDetails?.mainTopic || classItem.topics?.[0]}". Complete flashcards and questions before the deadline.`,
        timestamp: todayAt(8, 0),
        read: false,
        priority: "high",
        actionUrl: `/homework/${classItem.id}`,
        icon: "📚",
      });
    }

    // Morning reminder for today's classes
    if (classItem.status === "upcoming") {
      reminders.push({
        id: generateId(),
        type: "reminder",
        title: `Upcoming Class: ${classItem.subject}`,
        message: `Your ${classItem.subject} class with ${classItem.teacher} starts at ${classItem.time}. Topic: ${classItem.topicDetails?.mainTopic || classItem.topics?.[0]}`,
        timestamp: todayAt(7, 30),
        read: false,
        priority: "medium",
        actionUrl: "/schedule",
        icon: "🔔",
      });
    }
  });

  return reminders;
};

// Generate deadline reminders from calendar events
export const generateDeadlineReminders = (): Notification[] => {
  const reminders: Notification[] = [];
  const today = getTodayString();
  const tomorrow = getTomorrowString();

  calendarEvents.forEach((event) => {
    const daysUntil = getDaysUntil(event.date);

    // Only create reminders for future events (within next 7 days)
    if (daysUntil >= 0 && daysUntil <= 7) {
      let priority: "high" | "medium" | "low" = "low";
      let notificationType: "deadline" | "reminder" = "reminder";

      if (event.type === "exam") {
        priority = daysUntil <= 2 ? "high" : "medium";
        notificationType = "deadline";
      } else if (event.type === "assignment" || event.type === "homework") {
        priority = daysUntil <= 1 ? "high" : daysUntil <= 3 ? "medium" : "low";
        notificationType = "deadline";
      }

      if (daysUntil === 0) {
        reminders.push({
          id: generateId(),
          type: notificationType,
          title: `Today: ${event.title}`,
          message: `${event.description}${event.startTime ? ` at ${event.startTime}` : ""}${event.location ? ` in ${event.location}` : ""}`,
          timestamp: todayAt(6, 0),
          read: false,
          priority: priority,
          actionUrl: event.actionUrl || "/schedule",
          icon: event.type === "exam" ? "📝" : event.type === "assignment" ? "📋" : "📅",
        });
      } else if (daysUntil === 1) {
        reminders.push({
          id: generateId(),
          type: notificationType,
          title: `Tomorrow: ${event.title}`,
          message: `Don't forget! ${event.description}${event.startTime ? ` at ${event.startTime}` : ""}`,
          timestamp: todayAt(18, 0),
          read: false,
          priority: priority,
          actionUrl: event.actionUrl || "/schedule",
          icon: event.type === "exam" ? "⚠️" : "🔔",
        });
      } else if (daysUntil === 3 && event.type === "exam") {
        reminders.push({
          id: generateId(),
          type: "reminder",
          title: `Exam in 3 Days: ${event.title}`,
          message: `Start preparing! ${event.description} is coming up on ${new Date(event.date).toLocaleDateString()}.`,
          timestamp: todayAt(12, 0),
          read: false,
          priority: "medium",
          actionUrl: event.actionUrl || "/schedule",
          icon: "📖",
        });
      } else if (daysUntil === 7 && event.type === "exam") {
        reminders.push({
          id: generateId(),
          type: "reminder",
          title: `Exam Next Week: ${event.title}`,
          message: `Advance notice: ${event.description} is scheduled for ${new Date(event.date).toLocaleDateString()}.`,
          timestamp: todayAt(9, 0),
          read: false,
          priority: "low",
          actionUrl: event.actionUrl || "/schedule",
          icon: "📅",
        });
      }
    }
  });

  return reminders;
};

// Generate daily morning reminder
export const generateDailyReminder = (): Notification => {
  const todayEvents = calendarEvents.filter((e) => e.date === getTodayString());
  const eventCount = todayEvents.length;

  return {
    id: generateId(),
    type: "reminder",
    title: "Good Morning! Ready for Today?",
    message: `You have ${eventCount} event${eventCount !== 1 ? "s" : ""} scheduled today. Check your schedule and complete your homework!`,
    timestamp: todayAt(7, 0),
    read: false,
    priority: "medium",
    actionUrl: "/schedule",
    icon: "☀️",
  };
};

// Generate evening reminder for incomplete homework
export const generateEveningReminder = (): Notification[] => {
  const reminders: Notification[] = [];
  const incompleteCount = todaysClasses.filter((c) => {
    const status = localStorage.getItem(`homework_${c.id}_status`) || "pending";
    return status === "pending" || status === "in-progress";
  }).length;

  if (incompleteCount > 0) {
    reminders.push({
      id: generateId(),
      type: "reminder",
      title: "Evening Check-in",
      message: `You still have ${incompleteCount} incomplete homework assignment${incompleteCount !== 1 ? "s" : ""}. Complete them before midnight!`,
      timestamp: todayAt(20, 0),
      read: false,
      priority: "high",
      actionUrl: "/homework",
      icon: "🌙",
    });
  }

  return reminders;
};


// Generate weekly summary notification
export const generateWeeklySummary = (): Notification => {
  return {
    id: generateId(),
    type: "announcement",
    title: "📊 Weekly Summary Ready",
    message: "Your weekly performance report is ready! See how you did this week and get personalized recommendations.",
    timestamp: todayAt(10, 0),
    read: false,
    priority: "low",
    actionUrl: "/analytics",
    icon: "📊",
  };
};

// Generate all smart reminders
export const generateAllReminders = (): Notification[] => {
  const allReminders: Notification[] = [];

  // Add daily morning reminder
  allReminders.push(generateDailyReminder());

  // Add homework reminders
  allReminders.push(...generateHomeworkReminders());

  // Add deadline reminders from calendar
  allReminders.push(...generateDeadlineReminders());

  // Add evening reminders
  allReminders.push(...generateEveningReminder());


  // Add weekly summary
  allReminders.push(generateWeeklySummary());

  // Sort by timestamp (newest first)
  return allReminders.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Check and update reminders (call this on app load)
export const updateReminders = (): Notification[] => {
  const existingNotifications = localStorage.getItem("student_notifications");
  const existing: Notification[] = existingNotifications
    ? JSON.parse(existingNotifications)
    : [];

  // Generate new reminders
  const newReminders = generateAllReminders();

  // Merge: Keep existing (preserve read status), add new unique ones
  const existingIds = new Set(existing.map((n) => `${n.type}_${n.title}`));
  const uniqueNewReminders = newReminders.filter(
    (n) => !existingIds.has(`${n.type}_${n.title}`)
  );

  // Combine and sort
  const combined = [...existing, ...uniqueNewReminders].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Save back to localStorage
  localStorage.setItem("student_notifications", JSON.stringify(combined));

  return combined;
};

// Initialize reminders on first load
export const initializeReminders = () => {
  const hasInitialized = localStorage.getItem("reminders_initialized");
  // Always regenerate if stored data has stale (pre-2026-03) timestamps
  const storedData = localStorage.getItem("student_notifications");
  const isStale = storedData && storedData.includes("2026-02-2");

  if (!hasInitialized || isStale) {
    // First time or stale data - generate all reminders fresh
    const reminders = generateAllReminders();
    localStorage.setItem("student_notifications", JSON.stringify(reminders));
    localStorage.setItem("reminders_initialized", "true");
    localStorage.setItem("last_reminder_check", new Date().toISOString());
    return reminders;
  } else {
    // Check if we need to update (once per day)
    const lastCheck = localStorage.getItem("last_reminder_check");
    const now = new Date();

    if (!lastCheck || isNewDay(new Date(lastCheck), now)) {
      const updated = updateReminders();
      localStorage.setItem("last_reminder_check", now.toISOString());
      return updated;
    }
  }

  const existing = localStorage.getItem("student_notifications");
  return existing ? JSON.parse(existing) : [];
};

// Helper to check if it's a new day
const isNewDay = (lastDate: Date, currentDate: Date): boolean => {
  return (
    lastDate.getDate() !== currentDate.getDate() ||
    lastDate.getMonth() !== currentDate.getMonth() ||
    lastDate.getFullYear() !== currentDate.getFullYear()
  );
};

// Add a new reminder manually (for testing or manual creation)
export const addReminder = (
  type: Notification["type"],
  title: string,
  message: string,
  priority: "high" | "medium" | "low",
  actionUrl?: string
): void => {
  const notifications = localStorage.getItem("student_notifications");
  const existing: Notification[] = notifications ? JSON.parse(notifications) : [];

  const newNotification: Notification = {
    id: generateId(),
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    priority,
    actionUrl,
    icon: type === "homework" ? "📚" : type === "deadline" ? "⏰" : "🔔",
  };

  existing.unshift(newNotification);
  localStorage.setItem("student_notifications", JSON.stringify(existing));
};

// Clear old notifications (older than 30 days)
export const clearOldNotifications = (): void => {
  const notifications = localStorage.getItem("student_notifications");
  if (!notifications) return;

  const existing: Notification[] = JSON.parse(notifications);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filtered = existing.filter(
    (n) => new Date(n.timestamp) > thirtyDaysAgo
  );

  localStorage.setItem("student_notifications", JSON.stringify(filtered));
};
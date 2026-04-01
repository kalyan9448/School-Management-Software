// Reminder Engine — Firestore-backed
// Generates notifications from Firestore student data (calendar events, classes, homework)

import { NotificationService, TodaysClasses, CalendarService, HomeworkService } from "./studentDataService";

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
const generateId = () => ++notificationIdCounter;

const getTodayString = () => new Date().toISOString().split("T")[0];

const getDaysUntil = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const todayAt = (hour: number, minute = 0): string => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// Generate homework reminders from Firestore classes
export const generateHomeworkReminders = async (): Promise<Notification[]> => {
  const reminders: Notification[] = [];
  const classes = await TodaysClasses.getAll();
  const hwTopics = await HomeworkService.getAll();

  classes.forEach((classItem: any) => {
    // Check if any homework for this class is pending
    const topic = hwTopics.find((t: any) => t.subject === classItem.subject);
    if (topic && topic.status === "pending") {
      reminders.push({
        id: generateId(),
        type: "homework",
        title: `Complete ${classItem.subject} Homework`,
        message: `You have pending homework for "${classItem.topicDetails?.mainTopic || classItem.topics?.[0]}". Complete flashcards and questions before the deadline.`,
        timestamp: todayAt(8, 0),
        read: false,
        priority: "high",
        actionUrl: `/homework/${topic.id}`,
        icon: "📚",
      });
    }

    if (classItem.status === "upcoming") {
      reminders.push({
        id: generateId(),
        type: "reminder",
        title: `Upcoming Class: ${classItem.subject}`,
        message: `Your ${classItem.subject} class with ${classItem.teacher} starts at ${classItem.time}.`,
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
export const generateDeadlineReminders = async (): Promise<Notification[]> => {
  const reminders: Notification[] = [];
  const calendarEvents = await CalendarService.getAll();

  calendarEvents.forEach((event: any) => {
    const daysUntil = getDaysUntil(event.date);
    if (daysUntil < 0 || daysUntil > 7) return;

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
        priority,
        actionUrl: event.actionUrl || "/schedule",
        icon: event.type === "exam" ? "📝" : "📅",
      });
    } else if (daysUntil === 1) {
      reminders.push({
        id: generateId(),
        type: notificationType,
        title: `Tomorrow: ${event.title}`,
        message: `Don't forget! ${event.description}`,
        timestamp: todayAt(18, 0),
        read: false,
        priority,
        actionUrl: event.actionUrl || "/schedule",
        icon: event.type === "exam" ? "⚠️" : "🔔",
      });
    }
  });

  return reminders;
};

// Generate daily morning reminder
export const generateDailyReminder = async (): Promise<Notification> => {
  const calendarEvents = await CalendarService.getAll();
  const todayEvents = calendarEvents.filter((e: any) => e.date === getTodayString());

  return {
    id: generateId(),
    type: "reminder",
    title: "Good Morning! Ready for Today?",
    message: `You have ${todayEvents.length} event${todayEvents.length !== 1 ? "s" : ""} scheduled today.`,
    timestamp: todayAt(7, 0),
    read: false,
    priority: "medium",
    actionUrl: "/schedule",
    icon: "☀️",
  };
};

// Generate all smart reminders
export const generateAllReminders = async (): Promise<Notification[]> => {
  const [daily, homework, deadline] = await Promise.all([
    generateDailyReminder(),
    generateHomeworkReminders(),
    generateDeadlineReminders(),
  ]);
  const all = [daily, ...homework, ...deadline];
  return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Check and update reminders — now just returns all notifications (reminders are generated inline)
export const updateReminders = async (): Promise<Notification[]> => {
  return NotificationService.getAll();
};

// Initialize reminders on first load
export const initializeReminders = async (): Promise<Notification[]> => {
  return NotificationService.getAll();
};

// Add a new reminder manually
export const addReminder = async (
  type: Notification["type"],
  title: string,
  message: string,
  priority: "high" | "medium" | "low",
  actionUrl?: string
): Promise<void> => {
  await NotificationService.add({
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    priority,
    actionUrl,
    icon: type === "homework" ? "📚" : type === "deadline" ? "⏰" : "🔔",
  } as Omit<Notification, "id">);
};

// Clear old notifications (older than 30 days)
export const clearOldNotifications = async (): Promise<void> => {
  const all = await NotificationService.getAll();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const n of all) {
    if (new Date(n.timestamp) < thirtyDaysAgo) {
      await NotificationService.delete(n.id);
    }
  }
};
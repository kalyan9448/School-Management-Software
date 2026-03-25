// Custom hook for managing reminders — Firestore-backed
import { useEffect, useState, useCallback } from "react";
import { updateReminders, addReminder, type Notification } from "@/services/student/reminderService";
import { NotificationService } from "@/services/student/studentDataService";

export const useReminders = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from Firestore on mount
  useEffect(() => {
    (async () => {
      const data = await NotificationService.getAll();
      setNotifications(data);
    })();
  }, []);

  // Refresh reminders (generates new + merges)
  const refreshReminders = useCallback(async () => {
    const updated = await updateReminders();
    setNotifications(updated);
    return updated;
  }, []);

  // Add custom reminder
  const createReminder = useCallback(async (
    type: Notification["type"],
    title: string,
    message: string,
    priority: "high" | "medium" | "low" = "medium",
    actionUrl?: string
  ) => {
    await addReminder(type, title, message, priority, actionUrl);
    await refreshReminders();
  }, [refreshReminders]);

  // Trigger quiz completion reminder
  const onQuizCompleted = useCallback(async (subjectName: string, score: number) => {
    const priority = score >= 80 ? "low" : score >= 60 ? "medium" : "high";
    const message =
      score >= 80
        ? `Excellent! You scored ${score}% on your ${subjectName} quiz. Outstanding performance!`
        : score >= 60
        ? `Good effort! You scored ${score}% on your ${subjectName} quiz. Keep practicing to improve!`
        : `You scored ${score}% on your ${subjectName} quiz. Review the topics and try again!`;

    await createReminder("grade", `Quiz Result: ${subjectName}`, message, priority, "/analytics");
  }, [createReminder]);

  return {
    notifications,
    refreshReminders,
    createReminder,
    onQuizCompleted,
  };
};


// Custom hook for managing reminders
import { useEffect, useState } from "react";
import { updateReminders, addReminder, type Notification } from "@/services/student/reminderService";

export const useReminders = () => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  // Refresh reminders
  const refreshReminders = () => {
    const updated = updateReminders();
    setNotifications(updated);
    return updated;
  };

  // Add custom reminder
  const createReminder = (
    type: Notification["type"],
    title: string,
    message: string,
    priority: "high" | "medium" | "low" = "medium",
    actionUrl?: string
  ) => {
    addReminder(type, title, message, priority, actionUrl);
    refreshReminders();
  };


  // Trigger quiz completion reminder
  const onQuizCompleted = (subjectName: string, score: number) => {
    const priority = score >= 80 ? "low" : score >= 60 ? "medium" : "high";
    const message =
      score >= 80
        ? `Excellent! You scored ${score}% on your ${subjectName} quiz. Outstanding performance!`
        : score >= 60
        ? `Good effort! You scored ${score}% on your ${subjectName} quiz. Keep practicing to improve!`
        : `You scored ${score}% on your ${subjectName} quiz. Review the topics and try again!`;

    createReminder("grade", `Quiz Result: ${subjectName}`, message, priority, "/analytics");
  };


  return {
    notifications,
    refreshReminders,
    createReminder,
    onQuizCompleted,
  };
};


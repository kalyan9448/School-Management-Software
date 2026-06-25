/**
 * Hook for aggregated notifications across exam results, announcements, fees, and events
 * Fetches and categorizes notifications dynamically from Firestore
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dataService from '../utils/firestoreService';
import { Notification } from '../utils/centralDataService';

export interface CategoryStats {
  exam: number;
  announcement: number;
  fee: number;
  event: number;
  assignment: number;
  attendance: number;
  general: number;
}

export interface NotificationCategory {
  type: string;
  label: string;
  iconColor: string;
  notifications: Notification[];
  unreadCount: number;
}

export const useAggregatedNotifications = (
  role?: string, 
  userClass?: string, 
  userSection?: string,
  allClasses?: { class: string; section: string }[]
) => {
  const { user } = useAuth();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCategorize = useCallback(async () => {
    if (!user?.id) {
      setAllNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch all notifications for the user
      const notifications = await dataService.notification.getByUser(
        user.id,
        role || 'parent',
        userClass,
        userSection,
        allClasses
      );

      // Sort by date descending
      const sorted = notifications.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAllNotifications(sorted);
    } catch (err) {
      console.error('Error fetching aggregated notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setAllNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, role, userClass, userSection, allClasses]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAndCategorize();
  }, [fetchAndCategorize]);

  // Derived reactive categories
  const categories = useMemo(() => {
    const categorized: Record<string, Notification[]> = {
      exam: [],
      announcement: [],
      fee: [],
      event: [],
      assignment: [],
      attendance: [],
      general: [],
    };

    allNotifications.forEach(notif => {
      const category = notif.type as keyof typeof categorized;
      if (categorized[category]) {
        categorized[category].push(notif);
      } else {
        categorized.general.push(notif);
      }
    });

    return [
      {
        type: 'exam',
        label: '📊 Exam Results',
        iconColor: 'from-indigo-600 to-indigo-800',
        notifications: categorized.exam,
        unreadCount: categorized.exam.filter(n => !n.read).length,
      },
      {
        type: 'announcement',
        label: '📢 Announcements',
        iconColor: 'from-teal-600 to-teal-800',
        notifications: categorized.announcement,
        unreadCount: categorized.announcement.filter(n => !n.read).length,
      },
      {
        type: 'fee',
        label: '💳 Fee Reminders',
        iconColor: 'from-orange-600 to-orange-800',
        notifications: categorized.fee,
        unreadCount: categorized.fee.filter(n => !n.read).length,
      },
      {
        type: 'event',
        label: '📅 Events',
        iconColor: 'from-purple-600 to-purple-800',
        notifications: categorized.event,
        unreadCount: categorized.event.filter(n => !n.read).length,
      },
      {
        type: 'assignment',
        label: '📝 Assignments',
        iconColor: 'from-blue-600 to-blue-800',
        notifications: categorized.assignment,
        unreadCount: categorized.assignment.filter(n => !n.read).length,
      },
      {
        type: 'attendance',
        label: '✅ Attendance',
        iconColor: 'from-green-600 to-green-800',
        notifications: categorized.attendance,
        unreadCount: categorized.attendance.filter(n => !n.read).length,
      },
      {
        type: 'general',
        label: '📌 General',
        iconColor: 'from-gray-600 to-gray-800',
        notifications: categorized.general,
        unreadCount: categorized.general.filter(n => !n.read).length,
      },
    ].filter(cat => cat.notifications.length > 0);
  }, [allNotifications]);

  // Derived reactive stats
  const stats = useMemo(() => {
    const s: CategoryStats = {
      exam: 0,
      announcement: 0,
      fee: 0,
      event: 0,
      assignment: 0,
      attendance: 0,
      general: 0,
    };
    allNotifications.forEach(notif => {
      const category = notif.type as keyof typeof s;
      if (s[category] !== undefined) {
        s[category]++;
      } else {
        s.general++;
      }
    });
    return s;
  }, [allNotifications]);

  // Derived reactive unread count
  const unreadCount = useMemo(() => {
    return allNotifications.filter(n => !n.read).length;
  }, [allNotifications]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAndCategorize();
  }, [fetchAndCategorize]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await dataService.notification.markAsRead(notificationId);
        setAllNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await dataService.notification.markAllAsRead(user.id);
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    try {
      setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
      await dataService.notification.delete(notificationId, user.id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [user?.id]);

  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Clear from UI immediately to give instant feedback
      setAllNotifications([]);
      
      // Delete personal notifications from backend and mark global ones as deleted by this user
      await dataService.notification.deleteAll(user.id, role, userClass, userSection, allClasses);
      
      // Note: We deliberately do not call fetchAndCategorize() here, 
      // as it would re-fetch global notifications (which can't be deleted)
      // and make the clear action appear broken to the user.
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  }, [user?.id, role, userClass, userSection, allClasses]);

  const getCategoryStats = useCallback((categoryType: string): number => {
    return stats[categoryType as keyof CategoryStats] || 0;
  }, [stats]);

  const getNotificationsByCategory = useCallback(
    (categoryType: string, limit?: number): Notification[] => {
      let filtered = allNotifications.filter(n => n.type === categoryType);
      if (limit) {
        filtered = filtered.slice(0, limit);
      }
      return filtered;
    },
    [allNotifications]
  );

  const getRecentNotifications = useCallback(
    (limit = 5): Notification[] => {
      return allNotifications.slice(0, limit);
    },
    [allNotifications]
  );

  const getUnreadNotifications = useCallback((): Notification[] => {
    return allNotifications.filter(n => !n.read);
  }, [allNotifications]);

  return {
    allNotifications,
    categories,
    stats,
    unreadCount,
    loading,
    error,
    refresh: fetchAndCategorize,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    deleteNotification,
    getCategoryStats,
    getNotificationsByCategory,
    getRecentNotifications,
    getUnreadNotifications,
  };
};

/**
 * Hook for aggregated notifications across exam results, announcements, fees, and events
 * Fetches and categorizes notifications dynamically from Firestore
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dataService from '../utils/firestoreService';
import { Notification } from '../types/index';

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

export const useAggregatedNotifications = (role?: string, userClass?: string, userSection?: string) => {
  const { currentUser } = useAuth();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    exam: 0,
    announcement: 0,
    fee: 0,
    event: 0,
    assignment: 0,
    attendance: 0,
    general: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCategorize = useCallback(async () => {
    if (!currentUser?.uid) {
      setAllNotifications([]);
      setCategories([]);
      setStats({
        exam: 0,
        announcement: 0,
        fee: 0,
        event: 0,
        assignment: 0,
        attendance: 0,
        general: 0,
      });
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch all notifications for the user
      const notifications = await dataService.notification.getByUser(
        currentUser.uid,
        role || 'parent',
        userClass,
        userSection
      );

      // Sort by date descending
      const sorted = notifications.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAllNotifications(sorted);

      // Categorize and calculate stats
      const categorized: Record<string, Notification[]> = {
        exam: [],
        announcement: [],
        fee: [],
        event: [],
        assignment: [],
        attendance: [],
        general: [],
      };

      sorted.forEach(notif => {
        const category = notif.type as keyof typeof categorized;
        if (categorized[category]) {
          categorized[category].push(notif);
        } else {
          categorized.general.push(notif);
        }
      });

      // Build category array with metadata
      const categoryList: NotificationCategory[] = [
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
      ].filter(cat => cat.notifications.length > 0); // Only show categories with notifications

      setCategories(categoryList);

      // Calculate stats
      const newStats: CategoryStats = {
        exam: categorized.exam.length,
        announcement: categorized.announcement.length,
        fee: categorized.fee.length,
        event: categorized.event.length,
        assignment: categorized.assignment.length,
        attendance: categorized.attendance.length,
        general: categorized.general.length,
      };
      setStats(newStats);

      // Calculate total unread
      const totalUnread = Object.values(categorized).reduce(
        (sum, items) => sum + items.filter(n => !n.read).length,
        0
      );
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Error fetching aggregated notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setAllNotifications([]);
      setCategories([]);
      setStats({
        exam: 0,
        announcement: 0,
        fee: 0,
        event: 0,
        assignment: 0,
        attendance: 0,
        general: 0,
      });
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, role, userClass, userSection]);

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
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      await dataService.notification.markAllAsRead(currentUser.uid);
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [currentUser?.uid]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Assuming delete method exists in notificationService
      // If not, this can be extended to firestore service
      setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

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
    deleteNotification,
    getCategoryStats,
    getNotificationsByCategory,
    getRecentNotifications,
    getUnreadNotifications,
  };
};

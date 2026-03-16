import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
  BookOpen,
  AlertTriangle,
  MessageSquare,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { initializeReminders, updateReminders, type Notification } from "@/services/student/reminderService";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Initialize reminders on first load
    return initializeReminders();
  });
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh reminders
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const updated = updateReminders();
      setNotifications(updated);
      setIsRefreshing(false);
    }, 500);
  };

  // Check for new reminders periodically
  useEffect(() => {
    // Update reminders every hour
    const interval = setInterval(() => {
      const updated = updateReminders();
      setNotifications(updated);
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filter notifications
  const getFilteredNotifications = () => {
    // First, filter out any remaining gamified notifications (safeguard)
    let filtered = notifications.filter(n => 
      !n.title.toLowerCase().includes("level") && 
      !n.title.toLowerCase().includes("milestone") &&
      !n.message.toLowerCase().includes("level")
    );
    
    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter === "high") {
      filtered = filtered.filter((n) => n.priority === "high");
    }
    
    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const filteredNotifications = getFilteredNotifications();

  // Mark as read
  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  // Get relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "homework":
        return BookOpen;
      case "deadline":
        return Clock;
      case "reminder":
        return Bell;
      case "announcement":
        return MessageSquare;
      case "grade":
        return GraduationCap;
      default:
        return Bell;
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <motion.div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div 
                className="text-white p-6 flex-shrink-0"
                style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-white/80 text-sm font-medium">
                      {unreadCount} unread messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-white hover:bg-white/20 text-xs flex-1"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4">
                  {["all", "unread", "high"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filter === f
                          ? "bg-white text-[#1F6FEB]"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {f === "all" && "All"}
                      {f === "unread" && "Unread"}
                      {f === "high" && "Important"}
                    </button>
                  ))}
                </div>

                {/* Refresh Button */}
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-white hover:bg-white/20 w-full"
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    {isRefreshing ? "Checking for updates..." : "Refresh Reminders"}
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#7A869A] p-6">
                    <Bell className="w-16 h-16 opacity-20 mb-3" />
                    <p className="text-center">
                      {filter === "all"
                        ? "No notifications yet"
                        : filter === "unread"
                        ? "All caught up! 🎉"
                        : "No high priority notifications"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification, index) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.read ? "bg-blue-50/50" : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-4">
                            {/* Icon Container with subtle glass effect */}
                            <div
                              className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-white/10"
                              style={{
                                backgroundColor: notification.color
                                  ? `${notification.color}15`
                                  : "#F1F5F9",
                                color: notification.color || "#475569",
                              }}
                            >
                              {notification.icon ? (
                                <span className="text-xl">
                                  {notification.icon}
                                </span>
                              ) : (
                                <Icon className="w-6 h-6" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h4
                                    className={`text-sm font-bold tracking-tight ${
                                      !notification.read
                                        ? "text-[#1A1A1A]"
                                        : "text-[#7A869A]"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                  )}
                                </div>

                                <p className={`text-xs leading-relaxed mb-3 ${
                                  !notification.read ? "text-[#4A5568]" : "text-[#7A869A]"
                                }`}>
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7A869A] bg-gray-100/50 px-2 py-0.5 rounded-md">
                                      <Clock className="w-3 h-3" />
                                      {getRelativeTime(notification.timestamp)}
                                    </div>
                                    
                                    {notification.priority === "high" && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold py-0 px-2 bg-red-50 text-red-600 border-red-100 rounded-md"
                                      >
                                        IMPORTANT
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
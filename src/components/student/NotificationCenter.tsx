import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Clock,
  BookOpen,
  AlertTriangle,
  MessageSquare,
  GraduationCap,
  RefreshCw,
  Check,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { NotificationService } from "@/services/student/studentDataService";
import { type Notification } from "@/services/student/reminderService";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  // Local notification state — all actions are optimistic
  const [notifications, setNotifications] = useState<(Notification & { _firestoreId?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await NotificationService.fetchNotifications();
      setNotifications(data as any);
      setIsLoading(false);
    };
    load();
  }, []);

  // Manual refresh — re-fetches from Firestore + regenerates smart reminders
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const updated = await NotificationService.getAll();
    setNotifications(updated as any);
    setIsRefreshing(false);
  };

  // ─── Optimistic actions ───────────────────────────────────────────────────

  /** Mark a single notification as read — immediately remove from unread view */
  const markAsRead = (id: number) => {
    const target = notifications.find(n => n.id === id);
    // Optimistic: update local state immediately
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    // Background sync (fire-and-forget)
    NotificationService.markRead(id, (target as any)?._firestoreId).catch(() => {});
  };

  /** Mark all as read — immediately clear the unread indicator */
  const markAllAsRead = () => {
    const ids = notifications.filter(n => !n.read).map(n => n.id);
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Background sync
    NotificationService.markAllRead(ids).catch(() => {});
  };

  /** Delete a notification — immediately remove from list */
  const deleteNotification = (id: number) => {
    // Optimistic: remove from local state immediately
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Background sync
    NotificationService.delete(id).catch(() => {});
  };

  /** Click a notification: mark read + navigate */
  const handleNotificationClick = (notification: Notification & { _firestoreId?: string }) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  // ─── Derived state ────────────────────────────────────────────────────────

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = (() => {
    let list = notifications.filter(n =>
      !n.title.toLowerCase().includes("level") &&
      !n.title.toLowerCase().includes("milestone")
    );
    if (filter === "unread") list = list.filter(n => !n.read);
    else if (filter === "high") list = list.filter(n => n.priority === "high");
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  })();

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d === 1) return "Yesterday";
    if (d < 7) return `${d}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "homework": return BookOpen;
      case "deadline": return Clock;
      case "announcement": return MessageSquare;
      case "grade": return GraduationCap;
      default: return Bell;
    }
  };

  const TYPE_COLOR: Record<string, string> = {
    homework: "#3b82f6",
    deadline: "#ef4444",
    reminder: "#f59e0b",
    announcement: "#6366f1",
    grade: "#10b981",
  };

  return (
    <>
      {/* Bell Button */}
      <motion.div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative usermenu-trigger"
        >
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center pointer-events-none"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Notification Panel — rendered in a portal so it overlays everything */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="relative z-[99999]">
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              />

              {/* Slide-in Panel */}
              <motion.div
                key="panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="fixed right-0 top-0 h-full w-full sm:w-[400px] shadow-2xl flex flex-col bg-white"
                style={{ zIndex: 99999 }}
              >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div
                  className="text-white p-5 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0A2540, #1F6FEB)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Notifications</h2>
                      <p className="text-white/70 text-xs mt-0.5">
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-2 mb-3">
                    {(["all", "unread", "high"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          filter === f
                            ? "bg-white text-[#1F6FEB]"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        {f === "all" ? "All" : f === "unread" ? `Unread (${unreadCount})` : "Important"}
                      </button>
                    ))}
                  </div>

                  {/* Action Row */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="text-white hover:bg-white/20 text-xs flex-1 h-8"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                      Mark all read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="text-white hover:bg-white/20 h-8 px-3"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* ── List ───────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 gap-3">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-sm text-gray-500 font-medium">Fetching notifications…</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600">
                        {filter === "unread" ? "All caught up! 🎉" : "No notifications"}
                      </p>
                      <p className="text-xs text-gray-400 text-center">
                        {filter === "unread"
                          ? "You've read all your notifications."
                          : "New notifications will appear here."}
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {filteredNotifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        const accentColor = TYPE_COLOR[notification.type] || "#64748b";
                        return (
                          <motion.div
                            key={notification.id}
                            layout
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, x: 60 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div
                              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50/80 ${
                                !notification.read ? "bg-blue-50/40" : "bg-white"
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex gap-3">
                                {/* Icon */}
                                <div
                                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                                  style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                                >
                                  {notification.icon ? (
                                    <span>{notification.icon}</span>
                                  ) : (
                                    <Icon className="w-5 h-5" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1 mb-0.5">
                                    <p className={`text-sm font-semibold leading-snug ${!notification.read ? "text-gray-900" : "text-gray-500"}`}>
                                      {notification.title}
                                    </p>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                      {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
                                      )}
                                    </div>
                                  </div>

                                  <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${!notification.read ? "text-gray-600" : "text-gray-400"}`}>
                                    {notification.message}
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-400 font-medium">
                                        {getRelativeTime(notification.timestamp)}
                                      </span>
                                      {notification.priority === "high" && (
                                        <Badge className="text-[9px] font-bold px-1.5 py-0 h-4 bg-red-50 text-red-600 border-red-100">
                                          URGENT
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                      {!notification.read && (
                                        <button
                                          onClick={() => markAsRead(notification.id)}
                                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                          title="Mark as read"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <button
                      onClick={() => {
                        const ids = notifications.map(n => n.id);
                        setNotifications([]);
                        NotificationService.markAllRead(ids).catch(() => {});
                      }}
                      className="w-full text-xs text-gray-400 hover:text-red-500 font-medium transition-colors py-1"
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/**
 * Parent Notification Panel Component
 * Displays dynamic notifications for exam results, announcements, fees, and events
 * with filtering, categorization, and real-time updates
 */

import React, { useState, useMemo } from 'react';
import {
  Bell,
  TrendingUp,
  Volume2,
  AlertCircle,
  Calendar,
  IndianRupee,
  BookOpen,
  CheckCircle,
  X,
  ChevronRight,
  Filter,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  Search,
} from 'lucide-react';
import { useAggregatedNotifications, NotificationCategory } from '../hooks/useAggregatedNotifications';
import { Notification } from '../types/index';

interface ParentNotificationPanelProps {
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export const ParentNotificationPanel: React.FC<ParentNotificationPanelProps> = ({
  onClose,
  className = '',
  maxHeight = 'max-h-[600px]',
  showHeader = true,
  compact = false,
}) => {
  const { categories, unreadCount, loading, error, markAsRead, markAllAsRead, getRecentNotifications, refresh } =
    useAggregatedNotifications('parent');

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('expanded');

  // Filter notifications based on active filter and search
  const filteredNotifications = useMemo(() => {
    let filtered = activeFilter
      ? categories.find(c => c.type === activeFilter)?.notifications || []
      : getRecentNotifications(20);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeFilter, searchQuery, categories, getRecentNotifications]);

  const getNotificationIcon = (type: string) => {
    const iconProps = 'w-5 h-5';
    switch (type) {
      case 'exam':
        return <TrendingUp className={`${iconProps} text-indigo-600`} />;
      case 'announcement':
        return <Volume2 className={`${iconProps} text-teal-600`} />;
      case 'fee':
        return <IndianRupee className={`${iconProps} text-orange-600`} />;
      case 'event':
        return <Calendar className={`${iconProps} text-purple-600`} />;
      case 'assignment':
        return <BookOpen className={`${iconProps} text-blue-600`} />;
      case 'attendance':
        return <CheckCircle className={`${iconProps} text-green-600`} />;
      default:
        return <Bell className={`${iconProps} text-gray-600`} />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100';
      case 'announcement':
        return 'bg-teal-50 border-teal-200 hover:bg-teal-100';
      case 'fee':
        return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
      case 'event':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'assignment':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'attendance':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const formatTimeAgo = (dateStr: string): string => {
    try {
      const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const NotificationCard: React.FC<{ notification: Notification; compact?: boolean }> = ({
    notification,
    compact: isCompact,
  }) => (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        notification.read ? 'bg-white border-gray-200' : `${getNotificationBgColor(notification.type)} border-l-4`
      } ${isCompact ? 'mb-2' : 'mb-3'}`}
      onClick={() => !notification.read && markAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{notification.title}</h4>
              <p className={`text-sm text-gray-600 ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}>
                {notification.message}
              </p>
            </div>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(notification.date)}
          </div>
        </div>

        <div className="flex-shrink-0 flex gap-1">
          {notification.read ? (
            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="w-4 h-4 text-blue-500 hover:text-blue-700" />
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center ${maxHeight} bg-gray-50 rounded-lg`}>
        <div className="text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} ${maxHeight} bg-red-50 rounded-lg p-4 border border-red-200`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Notifications</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white rounded-lg shadow-lg ${maxHeight} flex flex-col overflow-hidden`}>
      {/* Header */}
      {showHeader && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6" />
              <h2 className="text-lg font-bold">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="hover:bg-blue-700 p-2 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-blue-200" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-blue-500 bg-opacity-30 text-white placeholder-blue-200 rounded-lg border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      )}

      {/* Category Filter Bar */}
      <div className="bg-gray-50 border-b px-4 py-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeFilter === null
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.type}
              onClick={() => setActiveFilter(category.type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                activeFilter === category.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.label}
              {category.unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {category.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'compact' ? 'expanded' : 'compact')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {viewMode === 'compact' ? 'Expand' : 'Compact'} View
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className={`flex-1 overflow-y-auto ${maxHeight}`}>
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Bell className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">
              {searchQuery ? 'No notifications match your search' : 'No notifications yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">Check back soon for updates from school</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                compact={viewMode === 'compact'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t px-4 py-3 flex items-center justify-between">
        <button
          onClick={refresh}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
        >
          <Clock className="w-4 h-4" />
          Refresh
        </button>
        <div className="text-xs text-gray-500">
          {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default ParentNotificationPanel;

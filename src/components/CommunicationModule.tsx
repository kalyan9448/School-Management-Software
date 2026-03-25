import { useState, useEffect } from 'react';
import { Send, MessageSquare, Bell, Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';
import { NotificationService } from '../services/student/studentDataService';
import { announcementService, notificationService } from '../utils/centralDataService';

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  targetRole: string;
  type: 'announcement' | 'reminder' | 'event' | 'holiday';
}

export function CommunicationModule() {
  const [activeTab, setActiveTab] = useState<'messages' | 'calendar'>('messages');
  const [showForm, setShowForm] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Load announcements on mount
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await announcementService.getAll();
        if (data && data.length > 0) {
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Failed to load announcements:', error);
      }
    };
    loadAnnouncements();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    type: 'announcement' as 'announcement' | 'reminder' | 'event' | 'holiday',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      ...formData,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await announcementService.create(newAnnouncement);
      setAnnouncements([newAnnouncement, ...announcements]);
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }

    // Send to student dashboard if applicable
    if (formData.targetRole === 'students' || formData.targetRole === 'all') {
      const studentNotifType = formData.type === 'announcement' ? 'announcement' : 
                               formData.type === 'reminder' ? 'reminder' : 
                               formData.type === 'event' ? 'reminder' : 'reminder';
      
      await NotificationService.add({
        type: studentNotifType as any,
        title: formData.title,
        message: formData.message,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        color: formData.type === 'holiday' ? '#10b981' : '#6366f1'
      });
    }

    // --- Feature 2: Teacher Notification Bridge ---
    if (formData.targetRole === 'teachers' || formData.targetRole === 'all') {
      try {
        await notificationService.create({
          id: Date.now().toString(),
          title: formData.title,
          message: formData.message,
          type: formData.type,
          from: 'Admin',
          date: new Date().toISOString(),
          read: false,
          recipientRole: 'teacher',
        });
      } catch (error) {
        console.error('Failed to create teacher notification:', error);
      }
    }

    // --- Feature 5: Parent Notification Bridge ---
    if (formData.targetRole === 'parents' || formData.targetRole === 'all') {
      try {
        await notificationService.create({
          id: Date.now().toString(),
          title: formData.title,
          message: formData.message,
          type: formData.type,
          from: 'Admin',
          date: new Date().toISOString(),
          read: false,
          recipientRole: 'parent',
        });
      } catch (error) {
        console.error('Failed to create parent notification:', error);
      }
    }

    setFormData({
      title: '',
      message: '',
      targetRole: 'all',
      type: 'announcement',
    });
    setShowForm(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Bell className="w-5 h-5" />;
      case 'reminder':
        return <MessageSquare className="w-5 h-5" />;
      case 'event':
        return <CalendarIcon className="w-5 h-5" />;
      case 'holiday':
        return <CalendarIcon className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-700';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-700';
      case 'event':
        return 'bg-purple-100 text-purple-700';
      case 'holiday':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // --- Feature 1: Calendar helpers ---
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  const getEventsForDay = (day: number) => {
    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return announcements.filter(a => a.date === dateStr && (a.type === 'event' || a.type === 'holiday'));
  };
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="p-8">
      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-gray-900 font-bold text-xl mb-2">{showComingSoon}</h3>
            <p className="text-gray-500 mb-6">This integration is coming soon. You'll be able to configure {showComingSoon.toLowerCase()} settings from this panel.</p>
            <button onClick={() => setShowComingSoon(null)} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Got it!
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Communication Center</h1>
          <p className="text-gray-600">Send announcements, reminders and manage school events</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Message
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-6 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Messages</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Event Calendar</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <p className="text-gray-600 mb-1">Total Messages</p>
          <p className="text-gray-900 font-bold text-2xl">{announcements.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md border border-blue-200 p-4">
          <p className="text-blue-700 mb-1">Announcements</p>
          <p className="text-blue-900 font-bold text-2xl">{announcements.filter((a: Announcement) => a.type === 'announcement').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-md border border-yellow-200 p-4">
          <p className="text-yellow-700 mb-1">Reminders</p>
          <p className="text-yellow-900 font-bold text-2xl">{announcements.filter((a: Announcement) => a.type === 'reminder').length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-md border border-purple-200 p-4">
          <p className="text-purple-700 mb-1">Events / Holidays</p>
          <p className="text-purple-900 font-bold text-2xl">{announcements.filter((a: Announcement) => a.type === 'event' || a.type === 'holiday').length}</p>
        </div>
      </div>

      {/* Message Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-gray-900 mb-4">Create New Message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter message title"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your message..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Send To *</label>
                <select
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="parents">Parents Only</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="staff">Staff Only</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Message Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Send className="w-4 h-4" /> Send Message
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <>
          <div className="space-y-4">
            {announcements.map((announcement: Announcement) => (
              <div key={announcement.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeStyle(announcement.type)}`}>
                    {getTypeIcon(announcement.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900">{announcement.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeStyle(announcement.type)}`}>
                        {announcement.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{announcement.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {announcement.date}</span>
                      <span>👥 Sent to: {
                        announcement.targetRole === 'all' ? 'All Users' :
                        announcement.targetRole === 'students' ? 'Students Only' :
                        announcement.targetRole === 'teachers' ? 'Teachers Only' :
                        announcement.targetRole === 'parents' ? 'Parents Only' :
                        announcement.targetRole
                      }</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {announcements.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages sent yet</p>
            </div>
          )}
        </>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600">
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-white font-bold text-xl">{monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}</h2>
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {/* Day labels */}
          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-100 bg-gray-50" />
            ))}
            {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().toDateString() === new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toDateString();
              return (
                <div key={day} className={`h-24 border-b border-r border-gray-100 p-1 ${
                  isToday ? 'bg-blue-50' : 'hover:bg-gray-50'
                } transition-colors`}>
                  <span className={`text-sm font-semibold inline-flex w-7 h-7 items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}>{day}</span>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className={`text-xs px-1 py-0.5 rounded truncate font-medium ${
                        ev.type === 'holiday' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                      }`} title={ev.title}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-xs text-gray-400">+{dayEvents.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="p-4 flex items-center gap-6 border-t border-gray-100 bg-gray-50">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 rounded-full bg-purple-400 inline-block" /> Event
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Holiday
            </span>
            <span className="text-sm text-gray-400 ml-auto">Click "New Message" → select Event or Holiday to add to calendar</span>
          </div>
        </div>
      )}

      {/* Communication Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <MessageSquare className="w-8 h-8 mb-3" />
          <h3 className="text-white mb-2">SMS Notifications</h3>
          <p className="text-blue-100 mb-4">Send instant SMS alerts to parents</p>
          <button
            onClick={() => setShowComingSoon('SMS Notifications')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Coming Soon
          </button>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <Send className="w-8 h-8 mb-3" />
          <h3 className="text-white mb-2">WhatsApp Alerts</h3>
          <p className="text-green-100 mb-4">Auto-send fee reminders via WhatsApp</p>
          <button
            onClick={() => setShowComingSoon('WhatsApp Alerts')}
            className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
          >
            Coming Soon
          </button>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <Bell className="w-8 h-8 mb-3" />
          <h3 className="text-white mb-2">Email Campaigns</h3>
          <p className="text-purple-100 mb-4">Send newsletters and updates via email</p>
          <button
            onClick={() => setShowComingSoon('Email Campaigns')}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Send, MessageSquare, Bell, Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, X, Info, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/student/studentDataService';
import { announcementService, notificationService, Announcement, Class } from '../utils/centralDataService';
import { createDoc, classService } from '../utils/firestoreService';



export function CommunicationModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'messages' | 'calendar'>('messages');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Load announcements on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [annData, clsData] = await Promise.all([
          announcementService.getAll(),
          classService.getAll()
        ]);
        if (annData) setAnnouncements(annData);
        if (clsData) setClasses(clsData);
      } catch (error) {
        console.error('Failed to load communication data:', error);
      }
    };
    loadData();
  }, []);

  const initialFormState = {
    title: '',
    message: '',
    targetAudience: 'all' as 'all' | 'teachers' | 'parents' | 'students' | 'specific-class',
    class: '',
    section: '',
    type: 'general' as 'general' | 'urgent' | 'event' | 'holiday' | 'exam',
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Save as Announcement (matching announcementService expectation)
      const announcementData: Announcement = {
        id: Date.now().toString(),
        title: formData.title,
        message: formData.message,
        type: formData.type,
        postedBy: user?.email || 'Admin',
        postedDate: new Date().toISOString().split('T')[0],
        targetAudience: formData.targetAudience,
        class: formData.targetAudience === 'specific-class' ? formData.class : undefined,
        section: formData.targetAudience === 'specific-class' ? formData.section : undefined,
        priority: formData.type === 'urgent' ? 'high' : 'medium',
      };

      await announcementService.create(announcementData);

      // 2. Create Notifications (fan-out using the new 'all' pattern)
      const rolesToNotify = formData.targetAudience === 'all'
        ? ['teacher', 'parent', 'student']
        : formData.targetAudience === 'specific-class'
          ? ['student', 'parent']
          : [formData.targetAudience.replace(/s$/, '')]; // Handle 'teachers' -> 'teacher' etc.

      for (const role of rolesToNotify) {
        await notificationService.create({
          userId: 'all', // Broadcast to all users of this role
          recipientRole: role,
          class: formData.targetAudience === 'specific-class' ? formData.class : undefined,
          section: formData.targetAudience === 'specific-class' ? formData.section : undefined,
          type: 'announcement', // General type for these notifications
          title: formData.title,
          message: formData.message,
          date: new Date().toISOString(),
          read: false
        });
      }

      // Also send to student dashboard if applicable (old system, kept for compatibility if needed)
      if (formData.targetAudience === 'students' || formData.targetAudience === 'all') {
        const studentNotifType = formData.type === 'general' ? 'announcement' :
                                 formData.type === 'urgent' ? 'reminder' :
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

      setAnnouncements(prev => [announcementData, ...prev]);
      setFormData(initialFormState);
      alert('Message sent successfully to ' + formData.targetAudience);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
      setShowForm(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
      case 'general':
        return <Bell className="w-5 h-5" />;
      case 'reminder':
      case 'urgent':
        return <MessageSquare className="w-5 h-5" />;
      case 'event':
      case 'holiday':
      case 'exam':
        return <CalendarIcon className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'announcement':
      case 'general':
        return 'bg-blue-100 text-blue-700';
      case 'reminder':
      case 'urgent':
        return 'bg-yellow-100 text-yellow-700';
      case 'event':
      case 'exam':
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
    return announcements.filter(a => a.postedDate === dateStr && (a.type === 'event' || a.type === 'holiday' || a.type === 'exam'));
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
          <p className="text-blue-900 font-bold text-2xl">{announcements.filter((a: Announcement) => a.type === 'general' || a.type === 'urgent').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-md border border-yellow-200 p-4">
          <p className="text-yellow-700 mb-1">Reminders</p>
          <p className="text-yellow-900 font-bold text-2xl">{announcements.filter((a: Announcement) => a.type === 'urgent').length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-md border border-purple-200 p-4">
          <p className="text-purple-700 mb-1">Events / Holidays</p>
          <p className="text-purple-900 font-bold text-2xl">{announcements.filter((a: Announcement) => a.type === 'event' || a.type === 'holiday' || a.type === 'exam').length}</p>
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
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="parents">Parents Only</option>
                  <option value="teachers">Teachers Only</option>
                </select>
              </div>

              {formData.targetAudience === 'specific-class' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Class *</label>
                    <select
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Class</option>
                      {Array.from(new Set(classes.map(c => c.className))).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Section *</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Section</option>
                      {classes
                        .filter(c => c.className === formData.class)
                        .map(c => (
                          <option key={c.id} value={c.section}>{c.section}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">Message Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General Announcement</option>
                  <option value="urgent">Urgent Reminder</option>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="exam">Exam Schedule</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
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
                      <span>📅 {announcement.postedDate}</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Sent to: {
                          announcement.targetAudience === 'all' ? 'All Users' :
                          announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1)
                        }</span>
                      </div>
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

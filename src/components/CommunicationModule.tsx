import { useState } from 'react';
import { Send, MessageSquare, Bell, Calendar as CalendarIcon, Plus } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  targetRole: string;
  type: 'announcement' | 'reminder' | 'event' | 'holiday';
}

export function CommunicationModule() {
  const [showForm, setShowForm] = useState(false);
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Parent-Teacher Meeting',
      message: 'Parent-teacher meeting scheduled for all classes on February 15th. Please ensure attendance.',
      date: '2024-01-25',
      targetRole: 'all',
      type: 'event',
    },
    {
      id: '2',
      title: 'Fee Payment Reminder',
      message: 'Quarterly fee payment is due by January 31st. Please clear dues to avoid late fee.',
      date: '2024-01-24',
      targetRole: 'parents',
      type: 'reminder',
    },
    {
      id: '3',
      title: 'Republic Day Holiday',
      message: 'School will remain closed on January 26th for Republic Day. Will reopen on January 27th.',
      date: '2024-01-23',
      targetRole: 'all',
      type: 'holiday',
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    type: 'announcement' as 'announcement' | 'reminder' | 'event' | 'holiday',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      ...formData,
      date: new Date().toISOString().split('T')[0],
    };
    setAnnouncements([newAnnouncement, ...announcements]);
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Communication Center</h1>
          <p className="text-gray-600">Send announcements and reminders to parents and staff</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Message
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <p className="text-gray-600 mb-1">Total Messages</p>
          <p className="text-gray-900">{announcements.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md border border-blue-200 p-4">
          <p className="text-blue-700 mb-1">Announcements</p>
          <p className="text-blue-900">{announcements.filter(a => a.type === 'announcement').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-md border border-yellow-200 p-4">
          <p className="text-yellow-700 mb-1">Reminders</p>
          <p className="text-yellow-900">{announcements.filter(a => a.type === 'reminder').length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-md border border-purple-200 p-4">
          <p className="text-purple-700 mb-1">Events</p>
          <p className="text-purple-900">{announcements.filter(a => a.type === 'event').length}</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeStyle(announcement.type)}`}>
                {getTypeIcon(announcement.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900">{announcement.title}</h3>
                  <span className={`px-3 py-1 rounded-full ${getTypeStyle(announcement.type)}`}>
                    {announcement.type.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{announcement.message}</p>
                
                <div className="flex items-center gap-4 text-gray-500">
                  <span>📅 {announcement.date}</span>
                  <span>👥 Sent to: {announcement.targetRole === 'all' ? 'All Users' : announcement.targetRole}</span>
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

      {/* Communication Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <MessageSquare className="w-8 h-8 mb-3" />
          <h3 className="text-white mb-2">SMS Notifications</h3>
          <p className="text-blue-100 mb-4">Send instant SMS alerts to parents</p>
          <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Configure
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <Send className="w-8 h-8 mb-3" />
          <h3 className="text-white mb-2">WhatsApp Alerts</h3>
          <p className="text-green-100 mb-4">Auto-send fee reminders via WhatsApp</p>
          <button className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors">
            Configure
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <Bell className="w-8 h-8 mb-3" />
          <h3 className="text-white mb-2">Email Campaigns</h3>
          <p className="text-purple-100 mb-4">Send newsletters and updates via email</p>
          <button className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Clock, Bell, Send, Target, TrendingUp, Plus, X } from 'lucide-react';

export function ReportsApprovalView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'medium',
    recipients: 'All Parents',
  });

  // Load everything on mount
  useEffect(() => {
    // 1. Announcements (Shared with CommunicationModule)
    const savedAnnouncements = localStorage.getItem('school_announcements');
    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    } else {
      const defaultAnnouncements = [
        {
          id: '1',
          title: 'Annual Sports Day - March 15, 2024',
          message: 'All students are required to participate in the annual sports day. Parent attendance is encouraged.',
          priority: 'high',
          recipients: 'All Parents, All Students',
          scheduledFor: '2024-02-20 09:00 AM',
          status: 'scheduled',
          type: 'event'
        },
        {
          id: '2',
          title: 'Parent-Teacher Meeting',
          message: "PTM scheduled for Feb 25. Please check your ward's progress report beforehand.",
          priority: 'medium',
          recipients: 'All Parents',
          scheduledFor: '2024-02-22 10:00 AM',
          status: 'scheduled',
          type: 'event'
        }
      ];
      setAnnouncements(defaultAnnouncements);
      localStorage.setItem('school_announcements', JSON.stringify(defaultAnnouncements));
    }

    // 2. Scheduled Reports
    const savedScheduled = localStorage.getItem('school_reports_scheduled');
    if (savedScheduled) {
      setScheduledReports(JSON.parse(savedScheduled));
    } else {
      const defaultScheduled = [
        {
          id: '1',
          name: 'Weekly Attendance Summary',
          type: 'Attendance',
          frequency: 'Weekly - Every Monday',
          recipients: 'Admin, Academic Head',
          nextRun: '2024-02-26',
          status: 'active',
        },
        {
          id: '2',
          name: 'Monthly Fee Collection',
          type: 'Fee Collection',
          frequency: 'Monthly - 1st of month',
          recipients: 'Admin, Accountant',
          nextRun: '2024-03-01',
          status: 'active',
        }
      ];
      setScheduledReports(defaultScheduled);
      localStorage.setItem('school_reports_scheduled', JSON.stringify(defaultScheduled));
    }

    // 3. Recent Reports
    const savedRecent = localStorage.getItem('school_reports_recent');
    if (savedRecent) {
      setRecentReports(JSON.parse(savedRecent));
    } else {
      const defaultRecent = [
        {
          id: '1',
          name: 'January Attendance Summary',
          type: 'Attendance',
          generatedOn: '2024-02-01',
          format: 'PDF',
          size: '2.3 MB',
        }
      ];
      setRecentReports(defaultRecent);
      localStorage.setItem('school_reports_recent', JSON.stringify(defaultRecent));
    }
  }, []);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      scheduledFor: 'Immediate',
      status: 'sent',
      date: new Date().toISOString().split('T')[0],
      type: 'announcement'
    };

    const updated = [announcement, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('school_announcements', JSON.stringify(updated));
    setShowAnnouncementForm(false);
    setNewAnnouncement({ title: '', message: '', priority: 'medium', recipients: 'All Parents' });
  };

  const toggleReportStatus = (id: string) => {
    const updated = scheduledReports.map(r =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r
    );
    setScheduledReports(updated);
    localStorage.setItem('school_reports_scheduled', JSON.stringify(updated));
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('Report generated successfully! Download started.');
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Reports & Announcements</h2>
          <p className="text-gray-600">Generate reports and manage announcements</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button
            onClick={() => setShowAnnouncementForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Bell className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Scheduled Reports</h3>
          <p className="text-gray-600 text-sm">Automated report generation schedule</p>
        </div>
        <div className="divide-y divide-gray-200">
          {scheduledReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-gray-900">{report.name}</h4>
                    <button
                      onClick={() => toggleReportStatus(report.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${report.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {report.status.toUpperCase()}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>Type: {report.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Frequency: {report.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Send className="w-4 h-4" />
                      <span>Recipients: {report.recipients}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm mb-2">Next Run</p>
                  <p className="text-gray-900 font-medium">{report.nextRun}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Recent Reports</h3>
            <p className="text-gray-600 text-sm">Recently generated reports</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentReports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-900">{report.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{report.format}</span>
                        <span>•</span>
                        <span>{report.size}</span>
                        <span>•</span>
                        <span>{report.generatedOn}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-purple-600">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Announcements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Scheduled Announcements</h3>
            <p className="text-gray-600 text-sm">Upcoming and sent announcements</p>
          </div>
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-gray-900 flex-1">{announcement.title}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs border ${getPriorityColor(
                      announcement.priority
                    )}`}
                  >
                    {announcement.priority}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{announcement.message}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{announcement.scheduledFor}</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${announcement.status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}
                  >
                    {announcement.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Announcement Modal */}
      {showAnnouncementForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">New Announcement</h3>
              <button
                onClick={() => setShowAnnouncementForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                  placeholder="Sports Day Announcement..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none resize-none"
                  placeholder="Enter message details here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                  <select
                    value={newAnnouncement.recipients}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, recipients: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                  >
                    <option value="All Parents">All Parents</option>
                    <option value="All Students">All Students</option>
                    <option value="Teachers Only">Teachers Only</option>
                    <option value="Staff Only">Staff Only</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { FileText, Download, Calendar, Clock, Bell, Send, Target, TrendingUp } from 'lucide-react';

export function ReportsApprovalView() {
  const [isGenerating, setIsGenerating] = useState(false);

  const scheduledReports = [
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
    },
    {
      id: '3',
      name: 'Term Performance Report',
      type: 'Performance Analytics',
      frequency: 'Quarterly',
      recipients: 'All Teachers',
      nextRun: '2024-03-31',
      status: 'paused',
    },
  ];

  const announcements = [
    {
      id: '1',
      title: 'Annual Sports Day - March 15, 2024',
      message: 'All students are required to participate in the annual sports day. Parent attendance is encouraged.',
      priority: 'high',
      recipients: 'All Parents, All Students',
      scheduledFor: '2024-02-20 09:00 AM',
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'Parent-Teacher Meeting',
      message: "PTM scheduled for Feb 25. Please check your ward's progress report beforehand.",
      priority: 'medium',
      recipients: 'All Parents',
      scheduledFor: '2024-02-22 10:00 AM',
      status: 'scheduled',
    },
    {
      id: '3',
      title: 'Fee Payment Reminder',
      message: 'Last date for Q4 fee payment is Feb 28. Late fee will be applicable after this date.',
      priority: 'high',
      recipients: 'Parents with Pending Fees',
      scheduledFor: 'Immediate',
      status: 'sent',
    },
  ];

  const recentReports = [
    {
      id: '1',
      name: 'January Attendance Summary',
      type: 'Attendance',
      generatedOn: '2024-02-01',
      format: 'PDF',
      size: '2.3 MB',
    },
    {
      id: '2',
      name: 'Q3 Performance Analytics',
      type: 'Performance',
      generatedOn: '2024-01-31',
      format: 'Excel',
      size: '4.1 MB',
    },
    {
      id: '3',
      name: 'Class 10 Report Cards',
      type: 'Report Cards',
      generatedOn: '2024-01-28',
      format: 'PDF',
      size: '15.7 MB',
    },
  ];

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
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {report.status}
                    </span>
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
                  <button className="mt-3 px-3 py-1 text-purple-600 hover:bg-purple-50 rounded-lg text-sm">
                    Edit Schedule
                  </button>
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
                    className={`px-2 py-1 rounded-full text-xs ${
                      announcement.status === 'sent'
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
    </div>
  );
}

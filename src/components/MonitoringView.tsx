import { useState } from 'react';
import { Activity, Users, BookOpen, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function MonitoringView() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const realtimeStats = {
    activeUsers: 142,
    studentsPresent: 285,
    lessonsInProgress: 8,
    pendingPayments: 12,
  };

  const recentActivities = [
    { id: '1', type: 'attendance', user: 'Ms. Sarah Johnson', action: 'marked attendance for Nursery A', time: '2 mins ago', icon: CheckCircle, color: 'green' },
    { id: '2', type: 'lesson', user: 'Ms. Emily Davis', action: 'completed lesson "Introduction to Numbers"', time: '5 mins ago', icon: BookOpen, color: 'blue' },
    { id: '3', type: 'payment', user: 'Mr. Rajesh Patel', action: 'paid monthly fees ₹5,000', time: '10 mins ago', icon: DollarSign, color: 'purple' },
    { id: '4', type: 'admission', user: 'Admin', action: 'admitted new student Aarav Kumar', time: '15 mins ago', icon: Users, color: 'yellow' },
    { id: '5', type: 'alert', user: 'System', action: 'Low attendance alert for UKG B', time: '20 mins ago', icon: AlertCircle, color: 'red' },
  ];

  const classActivity = [
    { class: 'Nursery A', teacher: 'Ms. Sarah Johnson', status: 'In Progress', attendance: '25/28', lesson: 'Story Time' },
    { class: 'Nursery B', teacher: 'Ms. Anjali Verma', status: 'In Progress', attendance: '22/25', lesson: 'Art & Craft' },
    { class: 'LKG A', teacher: 'Ms. Emily Davis', status: 'Break', attendance: '28/30', lesson: 'Completed' },
    { class: 'LKG B', teacher: 'Ms. Sarah Johnson', status: 'In Progress', attendance: '26/28', lesson: 'Mathematics' },
    { class: 'UKG A', teacher: 'Ms. Emily Davis', status: 'In Progress', attendance: '30/30', lesson: 'Science' },
    { class: 'UKG B', teacher: 'Ms. Priya Sharma', status: 'Break', attendance: '27/29', lesson: 'Completed' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Real-Time Monitoring</h2>
          <p className="text-gray-600">Monitor ongoing activities across the school</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 'today'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg ${
              timeRange === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Active Users</p>
              <h3 className="text-gray-900">{realtimeStats.activeUsers}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 text-sm">+12%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Students Present</p>
              <h3 className="text-gray-900">{realtimeStats.studentsPresent}</h3>
              <p className="text-gray-500 text-sm mt-2">Out of 300 total</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Lessons in Progress</p>
              <h3 className="text-gray-900">{realtimeStats.lessonsInProgress}</h3>
              <p className="text-gray-500 text-sm mt-2">Across 6 classes</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Pending Payments</p>
              <h3 className="text-gray-900">{realtimeStats.pendingPayments}</h3>
              <p className="text-gray-500 text-sm mt-2">Requires attention</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Recent Activities</h3>
            <p className="text-gray-600 text-sm">Live feed of school activities</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              const colorClasses = {
                green: 'bg-green-100 text-green-600',
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                red: 'bg-red-100 text-red-600',
              }[activity.color];

              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500 text-sm">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Class Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Current Class Activity</h3>
            <p className="text-gray-600 text-sm">Live status of all classes</p>
          </div>
          <div className="divide-y divide-gray-200">
            {classActivity.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-gray-900">{item.class}</h4>
                    <p className="text-gray-600 text-sm">{item.teacher}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'In Progress'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Attendance: <span className="text-gray-900 font-medium">{item.attendance}</span>
                  </span>
                  <span className="text-gray-600">
                    Lesson: <span className="text-gray-900">{item.lesson}</span>
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

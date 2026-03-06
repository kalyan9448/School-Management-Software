import { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { Users, DollarSign, UserCheck, AlertCircle, TrendingUp, Calendar, Bell, BookOpen, Award, Clock } from 'lucide-react';

interface DashboardHomeProps {
  onNavigate?: (view: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { schoolName } = useTenant();
  const [stats, setStats] = useState({
    totalStudents: 248,
    totalRevenue: 1245000,
    presentToday: 235,
    pendingAdmissions: 12,
    feeDues: 45000,
    enquiries: 8,
  });

  const recentActivities = [
    { id: 1, type: 'admission', message: 'New admission: Rahul Kumar - Class 6', time: '10 mins ago' },
    { id: 2, type: 'fee', message: 'Fee payment received: ₹15,000 from Priya Sharma', time: '25 mins ago' },
    { id: 3, type: 'enquiry', message: 'New enquiry for Class 3 admission', time: '1 hour ago' },
    { id: 4, type: 'attendance', message: 'Attendance marked for Class 8-A', time: '2 hours ago' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Meeting', date: 'Feb 15, 2024', time: '10:00 AM', color: 'from-pink-400 to-pink-500' },
    { id: 2, title: 'Annual Sports Day', date: 'Mar 5, 2024', time: '9:00 AM', color: 'from-orange-400 to-orange-500' },
    { id: 3, title: 'Science Exhibition', date: 'Feb 20, 2024', time: '11:00 AM', color: 'from-teal-400 to-teal-500' },
  ];

  const classPerformance = [
    { class: 'Class 6-A', attendance: 96, color: 'bg-purple-500' },
    { class: 'Class 5-B', attendance: 94, color: 'bg-pink-500' },
    { class: 'Class 4-A', attendance: 92, color: 'bg-indigo-500' },
    { class: 'Class 7-C', attendance: 88, color: 'bg-blue-500' },
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at {schoolName || 'your school'} today.</p>
        </div>
      </div>

      {/* Main Stats Grid - Redesigned with playful cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Students - Purple Theme */}
        <button
          onClick={() => onNavigate?.('students')}
          className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-purple-200 hover:shadow-2xl transition-all hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-500 rounded-bl-full opacity-20"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1 bg-purple-100 rounded-full">
                <span className="text-purple-700">+12</span>
              </div>
            </div>
            <p className="text-gray-500 mb-1">Total Students</p>
            <h2 className="text-gray-900 mb-2">{stats.totalStudents}</h2>
            <div className="flex items-center gap-1 text-purple-600">
              <TrendingUp className="w-4 h-4" />
              <span>This month</span>
            </div>
          </div>
        </button>

        {/* Total Revenue - Yellow Theme */}
        <button
          onClick={() => onNavigate?.('fees')}
          className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-yellow-200 hover:shadow-2xl transition-all hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-bl-full opacity-20"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1 bg-yellow-100 rounded-full">
                <span className="text-yellow-700">+8%</span>
              </div>
            </div>
            <p className="text-gray-500 mb-1">Total Revenue</p>
            <h2 className="text-gray-900 mb-2">₹{(stats.totalRevenue / 100000).toFixed(1)}L</h2>
            <div className="flex items-center gap-1 text-yellow-600">
              <TrendingUp className="w-4 h-4" />
              <span>This year</span>
            </div>
          </div>
        </button>

        {/* Attendance - Pink Theme */}
        <button
          onClick={() => onNavigate?.('monitoring')}
          className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-pink-200 hover:shadow-2xl transition-all hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400 to-pink-500 rounded-bl-full opacity-20"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1 bg-pink-100 rounded-full">
                <span className="text-pink-700">{((stats.presentToday / stats.totalStudents) * 100).toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-gray-500 mb-1">Present Today</p>
            <h2 className="text-gray-900 mb-2">{stats.presentToday}</h2>
            <div className="flex items-center gap-1 text-pink-600">
              <Calendar className="w-4 h-4" />
              <span>Out of {stats.totalStudents}</span>
            </div>
          </div>
        </button>

        {/* Enquiries - Indigo Theme */}
        <button
          onClick={() => onNavigate?.('enquiry')}
          className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-indigo-200 hover:shadow-2xl transition-all hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-bl-full opacity-20"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1 bg-indigo-100 rounded-full">
                <span className="text-indigo-700">New</span>
              </div>
            </div>
            <p className="text-gray-500 mb-1">New Enquiries</p>
            <h2 className="text-gray-900 mb-2">{stats.enquiries}</h2>
            <div className="flex items-center gap-1 text-indigo-600">
              <AlertCircle className="w-4 h-4" />
              <span>Follow-up needed</span>
            </div>
          </div>
        </button>
      </div>

      {/* Secondary Stats Row - Refined with light colored backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Admissions */}
        <button
          onClick={() => onNavigate?.('admission')}
          className="relative overflow-hidden bg-orange-50 rounded-3xl p-6 shadow-md border-2 border-orange-200 hover:shadow-xl transition-all hover:-translate-y-1 text-left cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200 rounded-bl-full opacity-30 group-hover:scale-110 transition-transform"></div>
          <div className="relative flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-orange-700 font-semibold text-sm">Pending</p>
              </div>
              <h2 className="text-gray-900 mb-1 font-bold">{stats.pendingAdmissions}</h2>
              <p className="text-gray-600 font-medium">Admissions</p>
            </div>
            <div className="px-3 py-1 bg-white/60 backdrop-blur-sm border border-orange-200 rounded-full">
              <span className="text-orange-700 text-xs font-bold uppercase tracking-wider">Action needed</span>
            </div>
          </div>
        </button>

        {/* Outstanding Dues */}
        <button
          onClick={() => onNavigate?.('fees')}
          className="relative overflow-hidden bg-red-50 rounded-3xl p-6 shadow-md border-2 border-red-200 hover:shadow-xl transition-all hover:-translate-y-1 text-left cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-200 rounded-bl-full opacity-30 group-hover:scale-110 transition-transform"></div>
          <div className="relative flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <DollarSign className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-red-700 font-semibold text-sm">Outstanding</p>
              </div>
              <h2 className="text-gray-900 mb-1 font-bold">₹{(stats.feeDues / 1000).toFixed(0)}K</h2>
              <p className="text-gray-600 font-medium">15 students pending</p>
            </div>
            <div className="px-3 py-1 bg-white/60 backdrop-blur-sm border border-red-200 rounded-full">
              <span className="text-red-700 text-xs font-bold uppercase tracking-wider">Collect</span>
            </div>
          </div>
        </button>

        {/* Today's Highlights */}
        <button
          onClick={() => onNavigate?.('monitoring')}
          className="relative overflow-hidden bg-teal-50 rounded-3xl p-6 shadow-md border-2 border-teal-200 hover:shadow-xl transition-all hover:-translate-y-1 text-left cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-200 rounded-bl-full opacity-30 group-hover:scale-110 transition-transform"></div>
          <div className="relative flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Award className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-teal-700 font-semibold text-sm">Achievement</p>
              </div>
              <h2 className="text-gray-900 mb-1 font-bold">95.5%</h2>
              <p className="text-gray-600 font-medium">Avg Attendance</p>
            </div>
            <div className="px-3 py-1 bg-white/60 backdrop-blur-sm border border-teal-200 rounded-full">
              <span className="text-teal-700 text-xs font-bold uppercase tracking-wider">Excellent</span>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Recent Activities</h3>
            <button
              onClick={() => onNavigate?.('reports')}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${activity.type === 'admission' ? 'bg-gradient-to-br from-purple-400 to-purple-500' :
                    activity.type === 'fee' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                      activity.type === 'enquiry' ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                        'bg-gradient-to-br from-pink-400 to-pink-500'
                    }`}>
                    {activity.type === 'admission' && <Users className="w-5 h-5 text-white" />}
                    {activity.type === 'fee' && <DollarSign className="w-5 h-5 text-white" />}
                    {activity.type === 'enquiry' && <Bell className="w-5 h-5 text-white" />}
                    {activity.type === 'attendance' && <Calendar className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 mb-1">{activity.message}</p>
                    <p className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Upcoming Events</h3>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className={`bg-gradient-to-br ${event.color} rounded-3xl p-6 text-white shadow-lg hover:shadow-2xl transition-all`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white mb-1">{event.title}</h4>
                    <p className="text-white/80">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/80" />
                  <span className="text-white/80">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Performance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">Top Performing Classes</h3>
          <button
            onClick={() => onNavigate?.('students')}
            className="text-purple-600 hover:text-purple-700 transition-colors"
          >
            View All Classes
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {classPerformance.map((cls, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${cls.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                  <Award className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  #{index + 1}
                </span>
              </div>
              <h4 className="text-gray-900 mb-2">{cls.class}</h4>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Attendance</span>
                  <span className="text-gray-900">{cls.attendance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${cls.color} h-2 rounded-full transition-all`}
                    style={{ width: `${cls.attendance}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, DollarSign, Calendar, FileText, LogOut, Bell, Download, AlertCircle, PartyPopper, Megaphone, Award, Sparkles, Heart, Star, TrendingUp } from 'lucide-react';
import logoImage from '../assets/logo.jpeg';

export function ParentDashboard() {
  const { user, logout } = useAuth();

  // Demo data for parent's children
  const children = [
    {
      id: '1',
      name: 'Rahul Kumar',
      class: '6',
      section: 'A',
      rollNo: '15',
      admissionNo: 'ADM2024001',
      feeStatus: 'paid',
      attendance: 95,
    },
  ];

  const feeDetails = [
    { date: '2024-01-15', amount: 15000, category: 'Quarterly Fee', receipt: 'RCP001', status: 'Paid' },
    { date: '2023-12-10', amount: 5000, category: 'Activity Fee', receipt: 'RCP002', status: 'Paid' },
  ];

  // Fee Due Reminders
  const feeDueReminders = [
    {
      id: '1',
      title: 'Quarterly Fee Payment Due',
      message: 'Quarterly fee payment of ₹15,000 is due by January 31st. Please clear dues to avoid late fee charges.',
      dueDate: '2024-01-31',
      amount: 15000,
      date: '2024-01-25',
    },
    {
      id: '2',
      title: 'Transport Fee Reminder',
      message: 'Transport fee for the month of February is due. Amount: ₹2,000',
      dueDate: '2024-02-05',
      amount: 2000,
      date: '2024-01-26',
    },
  ];

  // Event Notifications
  const eventNotifications = [
    {
      id: '1',
      title: 'Parent-Teacher Meeting',
      message: 'PTM scheduled for all classes on February 15th at 10:00 AM. Please ensure your attendance.',
      eventDate: '2024-02-15',
      time: '10:00 AM',
      date: '2024-01-25',
    },
    {
      id: '2',
      title: 'Annual Sports Day',
      message: 'Annual Sports Day will be held on March 5th. Parents are invited to attend.',
      eventDate: '2024-03-05',
      time: '9:00 AM',
      date: '2024-01-24',
    },
    {
      id: '3',
      title: 'Science Exhibition',
      message: 'Inter-school Science Exhibition on February 20th. Students to prepare projects.',
      eventDate: '2024-02-20',
      time: '11:00 AM',
      date: '2024-01-23',
    },
  ];

  // General Announcements
  const announcements = [
    {
      id: '1',
      title: 'New Library Books Available',
      message: 'New collection of books has been added to the school library. Students can issue books from Monday.',
      date: '2024-01-25',
    },
    {
      id: '2',
      title: 'School Uniform Update',
      message: 'Updated school uniform policy. Please check the school website for details.',
      date: '2024-01-24',
    },
    {
      id: '3',
      title: 'Mid-term Examination Schedule',
      message: 'Mid-term examinations will begin from February 10th. Detailed schedule will be shared next week.',
      date: '2024-01-23',
    },
  ];

  // Holiday Messages
  const holidayMessages = [
    {
      id: '1',
      title: 'Republic Day Holiday',
      message: 'School will remain closed on January 26th for Republic Day celebration. Will reopen on January 27th.',
      holidayDate: '2024-01-26',
      date: '2024-01-23',
    },
    {
      id: '2',
      title: 'Maha Shivaratri Holiday',
      message: 'School closed on March 8th for Maha Shivaratri. Regular classes resume on March 9th.',
      holidayDate: '2024-03-08',
      date: '2024-01-22',
    },
  ];

  const attendanceData = [
    { month: 'January', percentage: 95 },
    { month: 'December', percentage: 92 },
    { month: 'November', percentage: 98 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Playful Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white p-8 shadow-2xl">
        {/* Decorative Background Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-32 translate-y-32 blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo with playful rotation */}
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <img src={logoImage} alt="Kidz Vision Logo" className="w-16 h-16" />
              </div>
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <div>
              <h1 className="text-white mb-1">Kidz Vision</h1>
              <p className="text-purple-100 text-sm opacity-90">School of Education</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="group flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-2xl transition-all border border-white/30 shadow-xl hover:scale-105"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Children Cards - Beautiful Redesign */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-gray-900">My Children</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <div key={child.id} className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border-4 border-purple-200 p-8 hover:shadow-2xl transition-all hover:-translate-y-2">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-bl-full opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-2xl opacity-50"></div>

                <div className="relative">
                  <div className="flex items-start gap-6 mb-6">
                    {/* Avatar with Star Badge */}
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl flex items-center justify-center text-white flex-shrink-0 shadow-2xl transform rotate-6 group-hover:rotate-0 transition-transform">
                        <User className="w-10 h-10" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-2">{child.name}</h3>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          Class {child.class}-{child.section} | Roll No: {child.rollNo}
                        </p>
                        <p className="text-gray-500 bg-purple-100 px-3 py-1 rounded-full inline-block">
                          {child.admissionNo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-4 border-2 border-emerald-200">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-green-300/30 rounded-bl-full"></div>
                      <div className="relative">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-green-700 mb-1">Fee Status</p>
                        <p className="text-green-900">✓ Paid</p>
                      </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 border-2 border-blue-200">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-300/30 rounded-bl-full"></div>
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-blue-700 mb-1">Attendance</p>
                        <p className="text-blue-900">{child.attendance}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded-2xl hover:shadow-2xl transition-all group-hover:scale-105 shadow-lg shadow-purple-500/40">
                    <Award className="w-5 h-5" />
                    <span>View Full Profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Fee Details - Beautiful Cards */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-gray-900">Fee History</h2>
            </div>

            <div className="space-y-4">
              {feeDetails.map((fee, index) => (
                <div key={index} className="relative overflow-hidden bg-white rounded-3xl shadow-xl border-3 border-green-200 p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-200 rounded-bl-full opacity-40"></div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 mb-2">{fee.category}</h3>
                          <p className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {fee.date}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-gray-900 mb-2">₹{fee.amount.toLocaleString()}</p>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs shadow-lg">
                          ✓ {fee.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-green-100">
                      <p className="text-gray-500 bg-green-50 px-3 py-1 rounded-full">Receipt: {fee.receipt}</p>
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Chart - Beautiful Design */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-gray-900">Attendance Overview</h2>
            </div>

            <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border-3 border-blue-200 p-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-bl-full opacity-40"></div>

              <div className="relative space-y-6">
                {attendanceData.map((data, index) => (
                  <div key={data.month} className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          {index + 1}
                        </div>
                        <span className="text-gray-900">{data.month}</span>
                      </div>
                      <span className="px-4 py-2 bg-white rounded-full text-gray-900 shadow-md border-2 border-blue-200">
                        {data.percentage}%
                      </span>
                    </div>
                    <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg transition-all duration-500"
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Messages Section */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-gray-900">Notifications & Messages</h2>
          </div>

          {/* Fee Due Reminders - Stunning Cards */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900">Fee Due Reminders</h3>
              <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full text-xs shadow-lg">
                {feeDueReminders.length} pending
              </span>
            </div>
            <div className="space-y-5">
              {feeDueReminders.map((reminder) => (
                <div key={reminder.id} className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border-l-8 border-red-500 p-7 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-100 to-rose-200 rounded-bl-full opacity-40"></div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-200 rounded-full blur-2xl opacity-30"></div>

                  <div className="relative flex items-start gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl transform rotate-3 group-hover:rotate-6 transition-transform">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-3">{reminder.title}</h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">{reminder.message}</p>
                      <div className="flex items-center gap-6 mb-5">
                        <span className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border-2 border-red-200">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <span className="text-gray-700">Due: {reminder.dueDate}</span>
                        </span>
                        <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-xl border-2 border-red-300 shadow-md">
                          ₹{reminder.amount.toLocaleString()}
                        </span>
                      </div>
                      <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl hover:shadow-xl transition-all shadow-lg shadow-red-500/40 hover:scale-105">
                        <DollarSign className="w-5 h-5" />
                        Pay Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Notifications - Playful Cards */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <PartyPopper className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900">Upcoming Events</h3>
              <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-xs shadow-lg">
                {eventNotifications.length} events
              </span>
            </div>
            <div className="space-y-5">
              {eventNotifications.map((event) => (
                <div key={event.id} className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border-l-8 border-purple-500 p-7 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100 to-pink-200 rounded-bl-full opacity-40"></div>

                  <div className="relative flex items-start gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-3">{event.title}</h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">{event.message}</p>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border-2 border-purple-200">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">{event.eventDate}</span>
                        </span>
                        <span className="px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 rounded-xl border-2 border-purple-300">
                          🕐 {event.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Announcements */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900">School Announcements</h3>
              <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-xs shadow-lg">
                {announcements.length} new
              </span>
            </div>
            <div className="space-y-5">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border-3 border-blue-200 p-7 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-bl-full opacity-40"></div>

                  <div className="relative flex items-start gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform">
                      <Bell className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-3">{announcement.title}</h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">{announcement.message}</p>
                      <p className="text-gray-500 flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full inline-flex border border-blue-200">
                        <Calendar className="w-4 h-4" />
                        {announcement.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Holiday Messages */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-900">Holiday Notices</h3>
              <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs shadow-lg">
                {holidayMessages.length} holidays
              </span>
            </div>
            <div className="space-y-5">
              {holidayMessages.map((holiday) => (
                <div key={holiday.id} className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border-l-8 border-green-500 p-7 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-200 rounded-bl-full opacity-40"></div>

                  <div className="relative flex items-start gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-3">{holiday.title}</h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">{holiday.message}</p>
                      <span className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border-2 border-green-200 inline-flex">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Holiday: {holiday.holidayDate}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions - Stunning Cards */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-gray-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="group relative overflow-hidden bg-white rounded-3xl p-8 text-left hover:shadow-2xl transition-all hover:-translate-y-2 border-4 border-green-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-300 rounded-bl-full opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-300 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-5 shadow-2xl transform -rotate-6 group-hover:rotate-0 transition-transform">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">Pay Fee</h3>
                <p className="text-gray-600 leading-relaxed">Make online fee payment securely</p>
              </div>
            </button>

            <button className="group relative overflow-hidden bg-white rounded-3xl p-8 text-left hover:shadow-2xl transition-all hover:-translate-y-2 border-4 border-blue-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-bl-full opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-300 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-5 shadow-2xl transform rotate-6 group-hover:rotate-0 transition-transform">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">View Calendar</h3>
                <p className="text-gray-600 leading-relaxed">Check school events & holidays</p>
              </div>
            </button>

            <button className="group relative overflow-hidden bg-white rounded-3xl p-8 text-left hover:shadow-2xl transition-all hover:-translate-y-2 border-4 border-purple-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-300 rounded-bl-full opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-300 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-5 shadow-2xl transform -rotate-6 group-hover:rotate-0 transition-transform">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">Download Reports</h3>
                <p className="text-gray-600 leading-relaxed">Get fee receipts & reports</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
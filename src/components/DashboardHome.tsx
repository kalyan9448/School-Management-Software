import { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { Users, DollarSign, UserCheck, AlertCircle, TrendingUp, Calendar, Bell, BookOpen, Award, Clock, MessageSquare } from 'lucide-react';
import { studentService, attendanceService, classService, eventService, enquiryService } from '../utils/centralDataService';

interface DashboardHomeProps {
  onNavigate?: (view: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { schoolName, schoolId } = useTenant();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    presentToday: 0,
    pendingAdmissions: 0,
    feeDues: 0,
    enquiries: 0,
    // Dynamic computed badges
    newStudentsThisMonth: 0,
    revenueGrowthPct: 0,
    studentsPendingFee: 0,
    avgAttendancePct: 0,
  });
  const [schoolCode, setSchoolCode] = useState<string>('');

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [overdueEnquiries, setOverdueEnquiries] = useState<any[]>([]);
  const [showOverdueBanner, setShowOverdueBanner] = useState(true);

  useEffect(() => {
    // Fetch School Code
    const savedSchools = localStorage.getItem('app_schools');
    if (savedSchools && schoolId) {
      const schools = JSON.parse(savedSchools);
      const school = schools.find((s: any) => s.id === schoolId);
      if (school?.schoolCode) {
        setSchoolCode(school.schoolCode);
      }
    }

    // 1. Fetch Students
    const allStudents = studentService.getAll();
    const totalStudentsCount = allStudents.length;

    // 2. Calculate Today's Attendance
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendanceService.getByDate(today);
    const presentTodayCount = todaysAttendance.filter((r: any) => r.status === 'present').length;

    // 3. Fetch Enquiries & Admissions (still from localStorage for now as they are in separate modules)
    const storedAdmissions = localStorage.getItem('admissions_demo_data');
    const allAdmissions = storedAdmissions ? JSON.parse(storedAdmissions) : [];
    const pendingAdmissionsCount = allAdmissions.filter((a: any) => a.status === 'pending' || a.status === 'enquiry').length;

    const allEnquiries = enquiryService.getAll();

    // 4. Fetch Fees & Revenue
    const storedPayments = localStorage.getItem('fee_payments_demo');
    const allPayments = storedPayments ? JSON.parse(storedPayments) : [];
    const totalRev = allPayments.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

    const storedLedgers = localStorage.getItem('student_ledgers_demo');
    const allLedgers = storedLedgers ? JSON.parse(storedLedgers) : [];
    const totalDues = allLedgers.reduce((sum: number, l: any) => sum + (l.dueAmount || 0), 0);

    // 4a. Compute dynamic badges
    // New students admitted this calendar month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const newThisMonth = allAdmissions.filter((a: any) => {
      if (!a.admissionDate && !a.appliedDate) return false;
      const d = new Date(a.admissionDate || a.appliedDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    // Revenue growth %: current month vs previous month
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const currentMonthRev = allPayments
      .filter((p: any) => { const d = new Date(p.paymentDate); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
      .reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const prevMonthRev = allPayments
      .filter((p: any) => { const d = new Date(p.paymentDate); return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear; })
      .reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const revGrowthPct = prevMonthRev > 0
      ? Math.round(((currentMonthRev - prevMonthRev) / prevMonthRev) * 100)
      : currentMonthRev > 0 ? 100 : 0;

    // Students with pending/partial fee from ledgers
    const pendingFeeCount = allLedgers.filter((l: any) => (l.dueAmount || 0) > 0).length;

    // Average attendance % from school_attendance_records (written by AttendanceMarking)
    const attRecordsRaw = localStorage.getItem('school_attendance_records');
    let avgAtt = 0;
    if (attRecordsRaw) {
      const attRecords = JSON.parse(attRecordsRaw);
      if (attRecords.length > 0) {
        const presentCount = attRecords.filter((r: any) => r.status === 'present').length;
        avgAtt = Math.round((presentCount / attRecords.length) * 100);
      }
    } else if (totalStudentsCount > 0) {
      // Fallback: compute from student attendance % field in demo data
      const allStu = studentService.getAll();
      const totalStuAtt = allStu.reduce((s: number, st: any) => s + (st.attendance || 0), 0);
      avgAtt = allStu.length > 0 ? Math.round(totalStuAtt / allStu.length) : 0;
    }

    // Update Stats
    setStats({
      totalStudents: totalStudentsCount,
      totalRevenue: totalRev,
      presentToday: presentTodayCount,
      pendingAdmissions: pendingAdmissionsCount,
      feeDues: totalDues,
      enquiries: allEnquiries.length,
      newStudentsThisMonth: newThisMonth,
      revenueGrowthPct: revGrowthPct,
      studentsPendingFee: pendingFeeCount,
      avgAttendancePct: avgAtt,
    });

    // 5. Map Upcoming Events from central service
    const events = eventService.getUpcoming().slice(0, 3).map((e: any, idx: number) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.startTime || 'All Day',
      color: idx === 0 ? 'from-pink-400 to-pink-500' : idx === 1 ? 'from-orange-400 to-orange-500' : 'from-teal-400 to-teal-500'
    }));
    setUpcomingEvents(events);

    // 6. Aggregate Recent Activities
    const activities: any[] = [];

    // Add Admissions
    allAdmissions.slice(-2).forEach((adm: any) => {
      activities.push({
        id: `adm-${adm.id}`,
        type: 'admission',
        message: `Admission ${adm.status}: ${adm.name}`,
        time: 'Today',
        timestamp: Date.now()
      });
    });

    // Add Payments
    allPayments.slice(-2).forEach((p: any) => {
      activities.push({
        id: `fee-${p.id}`,
        type: 'fee',
        message: `Payment received: ₹${p.totalAmount.toLocaleString()} from ${p.studentName}`,
        time: p.paymentDate,
        timestamp: Date.now() - 1000
      });
    });

    // Add Enquiries
    allEnquiries.slice(-2).forEach((e: any) => {
      activities.push({
        id: `enq-${e.id}`,
        type: 'enquiry',
        message: `New enquiry for ${e.studentName} (Class ${e.classApplied})`,
        time: e.enquiryDate,
        timestamp: Date.now() - 2000
      });
    });

    // Add Attendance Activity
    if (todaysAttendance.length > 0) {
      activities.push({
        id: `attendance-today`,
        type: 'attendance',
        message: `${todaysAttendance.length} students attendance marked for today`,
        time: 'Just now',
        timestamp: Date.now() + 1000
      });
    }

    setRecentActivities(activities.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 5));

    // 7. Calculate Class Performance based on historical attendance
    const classes = classService.getAll();
    const performance = classes.map((cls: any) => {
      const classStudents = studentService.getByClass(cls.className, cls.section);
      let totalPresence = 0;
      let totalRecords = 0;

      classStudents.forEach((s: any) => {
        const stats = attendanceService.getAttendanceStats(s.id);
        totalPresence += stats.present;
        totalRecords += stats.total;
      });

      const avgAttendance = totalRecords > 0 ? Math.round((totalPresence / totalRecords) * 100) : 0;

      return {
        class: `${cls.className}-${cls.section}`,
        attendance: avgAttendance,
        color: cls.className.includes('8') ? 'bg-purple-500' : cls.className.includes('7') ? 'bg-pink-500' : 'bg-blue-500'
      };
    }).sort((a, b) => b.attendance - a.attendance).slice(0, 4);

    if (performance.length > 0) {
      setClassPerformance(performance);
    } else {
      setClassPerformance([
        { class: 'Class 8-A', attendance: 0, color: 'bg-purple-500' },
      ]);
    }

    // 8. Feature 4: Enquiry overdue follow-up reminders
    const enquiryRaw = localStorage.getItem('enquiries_demo_data');
    const allEnquiriesLocal: any[] = enquiryRaw ? JSON.parse(enquiryRaw) : [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const overdue = allEnquiriesLocal.filter((e: any) => {
      if (!e.followUpDate || e.status === 'converted' || e.status === 'closed') return false;
      const d = new Date(e.followUpDate);
      d.setHours(0, 0, 0, 0);
      return d <= todayDate;
    });
    setOverdueEnquiries(overdue);
    setShowOverdueBanner(overdue.length > 0);
  }, []);


  return (
    <div className="p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Dashboard Overview</h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600">Welcome back! Here's what's happening at {schoolName || 'your school'} today.</p>
            {schoolCode && (
              <span className="px-3 py-1 bg-purple-100 border border-purple-200 rounded-full text-purple-700 text-sm font-bold shadow-sm">
                School Code: {schoolCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Feature 4: Overdue Enquiry Follow-up Reminder Banner */}
      {showOverdueBanner && overdueEnquiries.length > 0 && (
        <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800">
                {overdueEnquiries.length} Enquir{overdueEnquiries.length === 1 ? 'y' : 'ies'} Require Follow-up
              </p>
              <p className="text-amber-700 text-sm">
                {overdueEnquiries.slice(0, 2).map((e: any) => e.childName || e.parentName).join(', ')}
                {overdueEnquiries.length > 2 ? ` and ${overdueEnquiries.length - 2} more` : ''} — Follow-up date overdue
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate?.('enquiry')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              View Enquiries
            </button>
            <button
              onClick={() => setShowOverdueBanner(false)}
              className="px-3 py-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
                <span className="text-purple-700">
                  {stats.newStudentsThisMonth > 0 ? `+${stats.newStudentsThisMonth}` : 'Enrolled'}
                </span>
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
                <span className="text-yellow-700">
                  {stats.revenueGrowthPct >= 0 ? `+${stats.revenueGrowthPct}%` : `${stats.revenueGrowthPct}%`}
                </span>
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
          onClick={() => onNavigate?.('enquiry')}
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
              <p className="text-gray-600 font-medium">{stats.studentsPendingFee} student{stats.studentsPendingFee !== 1 ? 's' : ''} pending</p>
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
              <h2 className="text-gray-900 mb-1 font-bold">{stats.avgAttendancePct > 0 ? `${stats.avgAttendancePct}%` : 'N/A'}</h2>
              <p className="text-gray-600 font-medium">Avg Attendance</p>
            </div>
            <div className="px-3 py-1 bg-white/60 backdrop-blur-sm border border-teal-200 rounded-full">
              <span className="text-teal-700 text-xs font-bold uppercase tracking-wider">
                {stats.avgAttendancePct >= 90 ? 'Excellent' : stats.avgAttendancePct >= 75 ? 'Good' : stats.avgAttendancePct > 0 ? 'Needs Attention' : 'No Data'}
              </span>
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
              onClick={() => onNavigate?.('monitoring')}
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
                        activity.type === 'communication' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                          'bg-gradient-to-br from-pink-400 to-pink-500'
                    }`}>
                    {activity.type === 'admission' && <Users className="w-5 h-5 text-white" />}
                    {activity.type === 'fee' && <DollarSign className="w-5 h-5 text-white" />}
                    {activity.type === 'enquiry' && <Bell className="w-5 h-5 text-white" />}
                    {activity.type === 'attendance' && <Calendar className="w-5 h-5 text-white" />}
                    {activity.type === 'communication' && <MessageSquare className="w-5 h-5 text-white" />}
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
            <button
              onClick={() => onNavigate?.('communication')}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              View All
            </button>
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
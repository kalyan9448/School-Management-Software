import { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { Users, DollarSign, UserCheck, AlertCircle, TrendingUp, Calendar, Bell, BookOpen, Award, Clock, MessageSquare } from 'lucide-react';
import { studentService, attendanceService, classService, calendarService, enquiryService, schoolService, feeService } from '../utils/centralDataService';

interface DashboardHomeProps {
  onNavigate?: (view: string, options?: any) => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        // Fetch School Code
        if (schoolId) {
          try {
            const schools = await schoolService.getAll();
            const school = schools.find((s: any) => s.id === schoolId);
            if (school?.schoolCode) setSchoolCode(school.schoolCode);
          } catch (err) {
            console.warn('School code fetch failed:', err);
          }
        }

        // 1. Fetch Basic Data
        const [allStudents, allEnquiries, allPayments, allAttendance] = await Promise.all([
          studentService.getAll(),
          enquiryService.getAll(),
          feeService.getAllPayments(),
          attendanceService.getAll()
        ]);

        const totalStudentsCount = allStudents.length;

        // 2. Calculate Today's Attendance
        const today = new Date().toISOString().split('T')[0];
        const todaysAttendance = allAttendance.filter((r: any) => r.date === today);
        const presentTodayCount = todaysAttendance.filter((r: any) => r.status === 'present').length;

        // 3. Fetch Pending Admissions
        const pendingAdmissionsCount = allStudents.filter((s: any) => 
          s.status === 'enquiry' || s.status === 'in-process' || s.status === 'confirmed'
        ).length;

        // 4. Calculate Fees & Revenue
        const totalRev = allPayments.reduce((sum: number, p: any) => sum + (p.totalAmount || p.amount || 0), 0);
        const totalDues = allPayments.filter((p: any) => p.status === 'pending' || p.status === 'partial').reduce((sum: number, p: any) => sum + (p.dueAmount || 0), 0);

        // 4a. Compute dynamic stats
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const newThisMonth = allStudents.filter((s: any) => {
          if (!s.admissionDate) return false;
          const d = new Date(s.admissionDate);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length;

        const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const prevMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        const currentMonthRev = allPayments
          .filter((p: any) => { const d = new Date(p.paymentDate || p.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
          .reduce((s: number, p: any) => s + (p.totalAmount || p.amount || 0), 0);
        const prevMonthRev = allPayments
          .filter((p: any) => { const d = new Date(p.paymentDate || p.date); return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear; })
          .reduce((s: number, p: any) => s + (p.totalAmount || p.amount || 0), 0);
        const revGrowthPct = prevMonthRev > 0
          ? Math.round(((currentMonthRev - prevMonthRev) / prevMonthRev) * 100)
          : currentMonthRev > 0 ? 100 : 0;

        const pendingFeeCount = allPayments.filter((p: any) => (p.dueAmount || 0) > 0).length;

        // Average attendance
        let avgAtt = 0;
        if (allAttendance.length > 0) {
          const presentCount = allAttendance.filter((r: any) => r.status === 'present').length;
          avgAtt = Math.round((presentCount / allAttendance.length) * 100);
        }

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

        // 5. Upcoming Events
        try {
          const upcoming = await calendarService.getUpcoming(3);
          const events = upcoming.map((e: any, idx: number) => ({
            id: e.id,
            title: e.title,
            date: e.startDate,
            time: 'All Day',
            color: idx === 0 ? 'from-pink-400 to-pink-500' : idx === 1 ? 'from-orange-400 to-orange-500' : 'from-teal-400 to-teal-500'
          }));
          setUpcomingEvents(events);
        } catch (err) {
          console.error('Calendar load error:', err);
        }

        // 6. Recent Activities
        const activities: any[] = [];

        // Recent Admissions (Active/Admitted students)
        allStudents
          .filter((s: any) => s.status === 'active' || s.status === 'admitted')
          .sort((a, b) => new Date(b.admissionDate || '').getTime() - new Date(a.admissionDate || '').getTime())
          .slice(0, 2)
          .forEach((adm: any) => {
            activities.push({ 
              id: `adm-${adm.id}`, 
              type: 'admission', 
              message: `New student admitted: ${adm.name}`, 
              time: 'Recent', 
              timestamp: new Date(adm.admissionDate || '').getTime() 
            });
          });

        // Pending Admissions
        allStudents
          .filter((s: any) => s.status === 'enquiry' || s.status === 'in-process')
          .slice(-2)
          .forEach((adm: any) => {
            activities.push({ 
              id: `pend-${adm.id}`, 
              type: 'admission', 
              message: `Admission in process: ${adm.name}`, 
              time: 'Pending', 
              timestamp: Date.now() - 5000 
            });
          });

        allPayments.slice(-3).forEach((p: any) => {
          activities.push({ id: `fee-${p.id}`, type: 'fee', message: `Payment: ₹${(p.totalAmount || p.amount || 0).toLocaleString()} from ${p.studentName || 'Student'}`, time: p.paymentDate || p.date, timestamp: new Date(p.paymentDate || p.date).getTime() || Date.now() - 1000 });
        });

        allEnquiries.slice(-2).forEach((e: any) => {
          activities.push({ id: `enq-${e.id}`, type: 'enquiry', message: `New enquiry: ${e.studentName || e.childName}`, time: e.enquiryDate, timestamp: new Date(e.enquiryDate).getTime() || Date.now() - 2000 });
        });

        if (todaysAttendance.length > 0) {
          activities.push({ id: `attendance-today`, type: 'attendance', message: `${todaysAttendance.length} attendance records marked today`, time: 'Today', timestamp: Date.now() });
        }

        setRecentActivities(activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5));

        // 7. Class Performance (Optimized)
        try {
          const classes = await classService.getAll();
          const performance = classes.map(cls => {
            const classAtt = allAttendance.filter(r => r.class === cls.className && r.section === cls.section);
            const totalRecords = classAtt.length;
            const totalPresence = classAtt.filter(r => r.status === 'present').length;
            const avgAttendance = totalRecords > 0 ? Math.round((totalPresence / totalRecords) * 100) : 0;
            
            return {
              class: `${cls.className}-${cls.section}`,
              className: cls.className,
              section: cls.section,
              attendance: avgAttendance,
              color: cls.className.includes('8') ? 'bg-purple-500' : cls.className.includes('7') ? 'bg-pink-500' : 'bg-blue-500'
            };
          });

          const sorted = performance.sort((a, b) => b.attendance - a.attendance).slice(0, 4);
          setClassPerformance(sorted.length > 0 ? sorted : [{ class: 'No classes', attendance: 0, color: 'bg-gray-400' }]);
        } catch (err) {
          console.error('Class performance load error:', err);
        }

        // 8. Overdue enquiries
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const overdue = allEnquiries.filter((e: any) => {
          if (!e.followUpDate || e.status === 'converted' || e.status === 'closed') return false;
          const d = new Date(e.followUpDate);
          d.setHours(0, 0, 0, 0);
          return d <= todayDate;
        });
        setOverdueEnquiries(overdue);
        setShowOverdueBanner(overdue.length > 0);
        setIsLoading(false);
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    };
    loadDashboard();
  }, [schoolId]);


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
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 p-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500">No recent activities found.</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
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
                      <p className="text-gray-900 mb-1 font-medium">{activity.message}</p>
                      <p className="text-gray-500 flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
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
            onClick={() => onNavigate?.('monitoring')}
            className="text-purple-600 hover:text-purple-700 transition-colors"
          >
            View All Classes
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div className="w-10 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))
          ) : classPerformance.map((cls, index) => (
            <div 
              key={index} 
              className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-2xl transition-all cursor-pointer group"
              onClick={() => {
                if (cls.className && cls.section) {
                  onNavigate?.('students', { tab: 'attendance', class: cls.className, section: cls.section });
                } else {
                  onNavigate?.('monitoring');
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${cls.color} rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Award className="w-6 h-6" />
                </div>
                {cls.attendance > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    #{index + 1}
                  </span>
                )}
              </div>
              <h4 className="text-gray-900 mb-2 group-hover:text-purple-700 transition-colors font-bold">{cls.class}</h4>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-gray-500">Attendance</span>
                  <span className="text-gray-900 font-bold">{cls.attendance}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${cls.color} h-2 rounded-full transition-all duration-1000`}
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
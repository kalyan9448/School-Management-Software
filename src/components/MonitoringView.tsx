import { useState, useEffect, useMemo } from 'react';
import { Activity, Users, BookOpen, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, GraduationCap } from 'lucide-react';
import { studentService, attendanceService, classService, timetableService, userService } from '../utils/centralDataService';
import { DEFAULT_YEARS } from '../utils/classUtils';

interface MonitoringViewProps {
  onNavigate?: (view: string, options?: any) => void;
}

export function MonitoringView({ onNavigate }: MonitoringViewProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [stats, setStats] = useState({
    activeUsers: 0,
    studentsPresent: 0,
    totalStudentsCount: 0,
    lessonsInProgress: 0,
    pendingPayments: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Fetch Unified Users for Active Count & Feed
        const unifiedUsers = await userService.getAll();
        const activeU = unifiedUsers.filter((u: any) => u.status === 'Active').length;

        // 2. Fetch Students for Attendance & Payments
        const allStudents = await studentService.getAll();

        // Calculate pending payments (feeStatus is pending or partial)
        const pendingP = allStudents.filter((s: any) => s.feeStatus !== 'paid').length;

        const today = new Date().toISOString().split('T')[0];
        // Average attendance simulation for students present
        const totalS = allStudents.length;
        const avgAttendance = allStudents.reduce((acc: number, s: any) => acc + (s.attendance || 0), 0) / (totalS || 1);

        // Try to get today's actual present count from attendance records
        const attRecords = await attendanceService.getAll();
        let presentToday = 0;
        if (attRecords.length > 0) {
          presentToday = attRecords.filter((r: any) => r.date === today && r.status === 'present').length;
        } else {
          presentToday = Math.round((totalS * avgAttendance) / 100);
        }

        // 3. Fetch Academic Structure for Classes
        const academicYears = DEFAULT_YEARS;
        const activeYearId = academicYears.find((y: any) => y.status === 'active')?.id || '2024-2025';

        const activeClasses = await classService.getAll();

        // Lessons in progress simulation (based on current hour/day)
        const now = new Date();
        const isSchoolHours = now.getHours() >= 8 && now.getHours() <= 16;
        const currentLessons = isSchoolHours ? Math.ceil(activeClasses.length * 0.7) : 0;

        setStats({
          activeUsers: activeU,
          studentsPresent: presentToday,
          totalStudentsCount: totalS,
          lessonsInProgress: currentLessons,
          pendingPayments: pendingP,
        });

        // 4. Generate Dynamic Activity Feed
        const feed = [
          ...unifiedUsers.slice(-2).map((u: any) => ({
            id: `u-${u.id}`,
            type: 'user',
            user: u.name,
            action: `assigned as ${u.role}`,
            time: u.lastActive || 'Recently',
            icon: Users,
            color: 'purple'
          })),
          ...allStudents.slice(-3).map((s: any) => ({
            id: `s-${s.id}`,
            type: 'admission',
            user: 'Admin',
            action: `admitted new student ${s.name} to Class ${s.class}`,
            time: 'Today',
            icon: GraduationCap,
            color: 'yellow'
          }))
        ];
        setActivities(feed.length > 0 ? feed : [
          { id: 'default', type: 'alert', user: 'System', action: 'Monitoring system initialized', time: 'Just now', icon: Activity, color: 'blue' }
        ]);

        // 5. Get timetable for current period lookup
        const allTimetableSlots: any[] = await timetableService.getAll();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = dayNames[now.getDay()];
        const currentHH = now.getHours();
        const currentMM = now.getMinutes();
        const currentMinutes = currentHH * 60 + currentMM;

        const getLessonForClass = (className: string, section: string): string => {
          if (!isSchoolHours) return 'N/A';
          const slot = allTimetableSlots.find((s: any) => {
            if (s.class !== className || s.section !== section || s.day !== currentDay) return false;
            const [sh, sm] = (s.startTime || '').split(':').map(Number);
            const [eh, em] = (s.endTime || '').split(':').map(Number);
            const slotStart = sh * 60 + sm;
            const slotEnd = eh * 60 + em;
            return currentMinutes >= slotStart && currentMinutes < slotEnd;
          });
          return slot?.subject || 'Free Period';
        };

        const getAttendanceForClass = (className: string, section: string): string => {
          if (attRecords.length === 0) {
            const cls = activeClasses.find((c: any) => c.className === className && c.section === section);
            const cap = cls?.students || 0;
            return `${Math.round(cap * (avgAttendance / 100))}/${cap}`;
          }
          const today2 = new Date().toISOString().split('T')[0];
          const todayClassRecords = attRecords.filter((r: any) => r.date === today2 && r.class === className && r.section === section);
          const presentCount = todayClassRecords.filter((r: any) => r.status === 'present').length;
          const totalCount = todayClassRecords.length;
          const cls = activeClasses.find((c: any) => c.className === className && c.section === section);
          const capacity = totalCount > 0 ? totalCount : (cls?.students || 0);
          return `${presentCount}/${capacity}`;
        };

        // 6. Generate Class Activity
        const classData = activeClasses.map((cls: any) => {
          const currentLesson = getLessonForClass(cls.className, cls.section);
          const hasLesson = currentLesson !== 'N/A' && currentLesson !== 'Free Period';
          return {
            class: `${cls.className} ${cls.section}`,
            teacher: cls.classTeacher || 'Not Assigned',
            status: isSchoolHours ? (hasLesson ? 'In Progress' : 'Free Period') : 'School Closed',
            attendance: getAttendanceForClass(cls.className, cls.section),
            lesson: currentLesson,
          };
        });
        setClasses(classData);
      } catch (err) {
        console.error('MonitoringView load error:', err);
      }
    };
    loadData();
  }, []);

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
            className={`px-4 py-2 rounded-lg ${timeRange === 'today'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'week'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'month'
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
              <h3 className="text-gray-900">{stats.activeUsers}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 text-sm">Live</span>
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
              <h3 className="text-gray-900">{stats.studentsPresent}</h3>
              <p className="text-gray-500 text-sm mt-2">Out of {stats.totalStudentsCount} total</p>
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
              <h3 className="text-gray-900">{stats.lessonsInProgress}</h3>
              <p className="text-gray-500 text-sm mt-2">Across current classes</p>
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
              <h3 className="text-gray-900">{stats.pendingPayments}</h3>
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
            {activities.map((activity) => {
              const Icon = activity.icon;
              const colorClasses = ({
                green: 'bg-green-100 text-green-600',
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                red: 'bg-red-100 text-red-600',
              } as any)[activity.color];

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
            {classes.length > 0 ? (
              classes.map((item, index) => (
                <div 
                  key={index} 
                  className="p-4 hover:bg-purple-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-purple-600 group"
                  onClick={() => {
                    const classMatch = item.class.match(/(.*)\s(.*)/);
                    if (classMatch && onNavigate) {
                      onNavigate('students', {
                        tab: 'attendance',
                        class: classMatch[1],
                        section: classMatch[2]
                      });
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-gray-900 group-hover:text-purple-700 transition-colors">{item.class}</h4>
                      <p className="text-gray-600 text-sm">{item.teacher}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${item.status === 'In Progress'
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
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No active classes found for this year.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

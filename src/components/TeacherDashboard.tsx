import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Calendar, FileText, LogOut, Bell } from 'lucide-react';
import logoImage from '../assets/logo.jpeg';
import { AttendanceMarking } from './AttendanceMarking';
import { ClassView } from './ClassView';
import { classService, timetableService, notificationService } from '../utils/centralDataService';

type ViewType = 'dashboard' | 'attendance' | 'classView';

interface ClassInfo {
  class: string;
  section: string;
  subject: string;
  students: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [myClasses, setMyClasses] = useState<ClassInfo[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<{ time: string; class: string; subject: string }[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);


  useEffect(() => {
    const load = async () => {
      const [allClasses, allSlots, notifications] = await Promise.all([
        classService.getAll(),
        timetableService.getAll(),
        user?.id ? notificationService.getByUser(user.id) : Promise.resolve([]),
      ]);

      const classes: ClassInfo[] = allClasses.map((c: any) => ({
        class: c.name || c.class || '',
        section: c.section || '',
        subject: c.subject || '',
        students: c.studentCount || 0,
      }));
      setMyClasses(classes);

      const todayDay = DAYS[new Date().getDay()];
      const schedule = allSlots
        .filter((slot: any) => slot.day === todayDay)
        .map((slot: any) => ({
          time: slot.startTime || '',
          class: `${slot.class || ''}-${slot.section || ''}`.replace(/^-|-$/g, ''),
          subject: slot.subject || '',
        }));
      setTodaySchedule(schedule);

      const unread = (notifications as any[]).filter((n: any) => !n.isRead);
      setNotificationCount(unread.length);

      // Load upcoming events
      try {
        const events = await (timetableService as any).getUpcomingEvents ? await (timetableService as any).getUpcomingEvents(5) : [];
        // If not available on service, fallback to dataService
        if (events.length === 0) {
          const allEvents = await (timetableService as any).getAllEvents ? await (timetableService as any).getAllEvents() : [];
          setUpcomingEvents(allEvents.slice(0, 5));
        } else {
          setUpcomingEvents(events);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    load();
  }, [user?.id]);

  const handleMarkAttendance = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    setCurrentView('attendance');
  };

  const handleViewClass = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    setCurrentView('classView');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedClass(null);
  };

  // Show attendance marking view
  if (currentView === 'attendance' && selectedClass) {
    return <AttendanceMarking classInfo={selectedClass} onBack={handleBackToDashboard} />;
  }

  // Show class view
  if (currentView === 'classView' && selectedClass) {
    return <ClassView classInfo={selectedClass} onBack={handleBackToDashboard} />;
  }

  // Show dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="Kidz Vision Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-white mb-1">Teacher Portal</h1>
              <p className="text-purple-200 text-sm">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-purple-100 mb-1">My Classes</p>
                <h2 className="text-white">{myClasses.length}</h2>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="text-purple-100">Total students: {myClasses.reduce((sum, c) => sum + c.students, 0)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 mb-1">Classes Today</p>
                <h2 className="text-gray-900">{todaySchedule.length}</h2>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-purple-600">View schedule</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 mb-1">Notifications</p>
                <h2 className="text-gray-900">{notificationCount}</h2>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-red-600">New messages</p>
          </div>
        </div>

        {/* My Classes */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">My Classes</h2>
            <p className="text-gray-500 text-sm">{myClasses.length} Active Classes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myClasses.map((cls, index) => (
              <div key={index} className="group bg-white rounded-3xl shadow-lg border-2 border-transparent hover:border-purple-200 p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 mb-1">
                        Class {cls.class}-{cls.section}
                      </h3>
                      <p className="text-gray-600 font-medium">{cls.subject}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-100">
                    {cls.students} Students
                  </span>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleMarkAttendance(cls)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => handleViewClass(cls)}
                    className="px-6 py-3 border-2 border-gray-100 text-gray-700 rounded-xl hover:border-purple-200 hover:bg-purple-50 transition-all font-bold text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Today's Schedule</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                {DAYS[new Date().getDay()]}
              </span>
            </div>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-50 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {todaySchedule.length > 0 ? todaySchedule.map((schedule, index) => (
                  <div key={index} className="p-6 flex items-center gap-6 hover:bg-purple-50/50 transition-colors group">
                    <div className="w-20 text-center font-bold text-purple-900">
                      <p className="text-sm opacity-60">Time</p>
                      <p>{schedule.time}</p>
                    </div>
                    <div className="flex-1 border-l-4 border-purple-200 pl-6">
                      <h3 className="text-gray-900 mb-1">Class {schedule.class}</h3>
                      <p className="text-gray-600 font-medium">{schedule.subject}</p>
                    </div>
                    <button className="px-6 py-2.5 bg-white border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all font-bold text-sm shadow-sm hover:shadow-purple-500/30">
                      Record Lesson
                    </button>
                  </div>
                )) : (
                  <div className="p-12 text-center text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No classes scheduled for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">School Events</h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-50 p-6 space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex items-start gap-4 group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform ${
                    event.type === 'holiday' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    event.type === 'exam' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                    'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <span className="text-[10px] font-bold uppercase">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-none">{new Date(event.startDate).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors uppercase tracking-tight">{event.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{event.description || 'Upcoming school event'}</p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-gray-400">
                  <p className="text-sm">No upcoming events</p>
                </div>
              )}
              <button className="w-full mt-4 py-3 border-2 border-gray-100 rounded-2xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                View Full Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
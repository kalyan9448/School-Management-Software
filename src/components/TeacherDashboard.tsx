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
        <div className="mb-8">
          <h2 className="text-gray-900 mb-4">My Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myClasses.map((cls, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md border border-purple-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-900 mb-1">
                      Class {cls.class}-{cls.section}
                    </h3>
                    <p className="text-gray-600">{cls.subject}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700 mb-4">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{cls.students} students</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkAttendance(cls)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => handleViewClass(cls)}
                    className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <h2 className="text-gray-900 mb-4">Today's Schedule</h2>
          <div className="bg-white rounded-xl shadow-md border border-purple-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {todaySchedule.map((schedule, index) => (
                <div key={index} className="p-6 flex items-center gap-6 hover:bg-purple-50">
                  <div className="text-center">
                    <p className="text-gray-900">{schedule.time}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 mb-1">Class {schedule.class}</h3>
                    <p className="text-gray-600">{schedule.subject}</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Start Class
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  Calendar,
  FileText,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  MessageCircle,
  Bell,
  User,
  LogOut,
  Home,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DashboardNav } from './DashboardNav';
import { PageHeader } from './common/PageHeader';
import { LoadingSpinner } from './common/LoadingSpinner';
import { EmptyState } from './common/EmptyState';
import {
  useStudents,
  useAttendance,
  useAssignments,
  useAssignmentSubmissions,
  useExamResults,
  useLessons,
  useAnnouncements,
  useEvents,
  useNotifications,
  useStudentPerformance,
} from '../hooks/useDataService';
import logoImage from '../assets/logo.png';

type ViewType =
  | 'home'
  | 'classes'
  | 'assignments'
  | 'performance'
  | 'attendance'
  | 'timetable'
  | 'profile';

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('home');

  // Fetch student data - assuming student email matches student@school.com and ID is STU001
  const studentId = 'STU001'; // In real app, this would come from user.studentId

  const { students } = useStudents();
  const student = students.find(s => s.id === studentId);

  const { attendance, stats: attendanceStats } = useAttendance({
    studentId,
    startDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  });

  const { assignments } = useAssignments({
    class: student?.class,
    section: student?.section
  });

  const { submissions } = useAssignmentSubmissions({ studentId });
  const { results: examResults } = useExamResults({ studentId });
  const { performance } = useStudentPerformance(studentId);

  const { lessons } = useLessons({
    class: student?.class,
    section: student?.section
  });

  const { announcements } = useAnnouncements({
    role: 'student',
    class: student?.class,
    section: student?.section,
    activeOnly: true
  });

  const { events } = useEvents({ upcoming: true });
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Calculate pending assignments
  const pendingAssignments = assignments.filter(a => {
    const submission = submissions.find(s => s.assignmentId === a.id);
    return !submission;
  });

  // Render Home View
  const renderHome = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysLessons = lessons.filter(l => l.date === today);

    return (
      <div className="space-y-6">
        <PageHeader
          title={`Welcome back, ${student?.name || user?.name}!`}
          subtitle={student ? `${student.class} - Section ${student.section} • Roll No: ${student.rollNo}` : ''}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Overall Performance</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {performance?.overallPercentage || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Attendance</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {attendanceStats?.percentage || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Assignments</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {pendingAssignments.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Upcoming Events</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {events.slice(0, 5).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Today's Classes
            </h3>
          </div>
          <div className="p-6">
            {todaysLessons.length > 0 ? (
              <div className="space-y-3">
                {todaysLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lesson.subject}</p>
                        <p className="text-sm text-gray-600">{lesson.topic}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{lesson.teacherName}</p>
                      <p className="text-xs text-gray-500">Today</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No classes today"
                description="No lessons have been logged for today yet."
              />
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              Recent Announcements
            </h3>
          </div>
          <div className="p-6">
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{announcement.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {new Date(announcement.postedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Bell}
                title="No announcements"
                description="There are no active announcements at the moment."
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Assignments View
  const renderAssignments = () => {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assignments"
          subtitle="View and manage your assignments"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Assignments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingAssignments.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          {/* Submitted */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'submitted').length}
                </p>
                <p className="text-sm text-gray-600">Submitted</p>
              </div>
            </div>
          </div>

          {/* Graded */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'graded').length}
                </p>
                <p className="text-sm text-gray-600">Graded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">All Assignments</h3>
          </div>
          <div className="p-6">
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const submission = submissions.find(s => s.assignmentId === assignment.id);
                  const isPending = !submission;
                  const isSubmitted = submission?.status === 'submitted';
                  const isGraded = submission?.status === 'graded';

                  return (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                            {isPending && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                Pending
                              </span>
                            )}
                            {isSubmitted && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                Submitted
                              </span>
                            )}
                            {isGraded && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Graded
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {assignment.subject}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                            <span>Total Marks: {assignment.totalMarks}</span>
                          </div>
                          {isGraded && submission && (
                            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                              <p className="text-sm font-medium text-green-900">
                                Score: {submission.marksObtained}/{assignment.totalMarks}
                              </p>
                              {submission.feedback && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Feedback: {submission.feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No assignments"
                description="No assignments have been posted yet."
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Performance View
  const renderPerformance = () => {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Academic Performance"
          subtitle="Track your progress and grades"
        />

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <p className="text-purple-100 text-sm mb-2">Overall Percentage</p>
            <p className="text-4xl font-bold">{performance?.overallPercentage || 0}%</p>
            <p className="text-purple-100 text-sm mt-2">Keep up the good work!</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Exams</p>
            <p className="text-3xl font-bold text-gray-900">{performance?.totalExams || 0}</p>
            <p className="text-sm text-gray-500 mt-2">
              Exam Average: {performance?.examPercentage || 0}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Assignments</p>
            <p className="text-3xl font-bold text-gray-900">{performance?.totalAssignments || 0}</p>
            <p className="text-sm text-gray-500 mt-2">
              Graded: {performance?.gradedAssignments || 0}
            </p>
          </div>
        </div>

        {/* Exam Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Exam Results</h3>
          </div>
          <div className="p-6">
            {examResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Exam</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Marks</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Percentage</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Grade</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examResults.map((result, index) => (
                      <tr key={result.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 text-sm text-gray-900">Exam {index + 1}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {result.marksObtained}/{result.totalMarks}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{result.percentage}%</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${result.grade === 'A+' || result.grade === 'A'
                            ? 'bg-green-100 text-green-700'
                            : result.grade === 'B+' || result.grade === 'B'
                              ? 'bg-blue-100 text-blue-700'
                              : result.grade === 'C'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {result.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {result.rank ? `#${result.rank}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No exam results"
                description="Your exam results will appear here once exams are graded."
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Attendance View
  const renderAttendance = () => {
    const currentMonth = new Date().toISOString().substring(0, 7);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Attendance Record"
          subtitle="View your attendance history"
        />

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Days</p>
            <p className="text-3xl font-bold text-gray-900">{attendanceStats?.total || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Present</p>
            <p className="text-3xl font-bold text-green-600">{attendanceStats?.present || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Absent</p>
            <p className="text-3xl font-bold text-red-600">{attendanceStats?.absent || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Percentage</p>
            <p className={`text-3xl font-bold ${(attendanceStats?.percentage || 0) >= 90
              ? 'text-green-600'
              : (attendanceStats?.percentage || 0) >= 75
                ? 'text-amber-600'
                : 'text-red-600'
              }`}>
              {attendanceStats?.percentage || 0}%
            </p>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Attendance History</h3>
          </div>
          <div className="p-6">
            {attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${record.status === 'present'
                        ? 'bg-green-500'
                        : record.status === 'absent'
                          ? 'bg-red-500'
                          : record.status === 'late'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {record.remarks && (
                          <p className="text-sm text-gray-500">{record.remarks}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${record.status === 'present'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'absent'
                          ? 'bg-red-100 text-red-700'
                          : record.status === 'late'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{record.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="No attendance records"
                description="Your attendance records will appear here."
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Profile View
  const renderProfile = () => {
    if (!student) {
      return <LoadingSpinner />;
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          subtitle="View and manage your profile information"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                <p className="text-gray-600">{student.admissionNo}</p>
                <div className="mt-4 w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Class:</span>
                    <span className="font-medium">{student.class} - {student.section}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Roll No:</span>
                    <span className="font-medium">{student.rollNo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Date of Birth</label>
                  <p className="font-medium">
                    {new Date(student.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Gender</label>
                  <p className="font-medium capitalize">{student.gender}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Blood Group</label>
                  <p className="font-medium">{student.bloodGroup || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Admission Date</label>
                  <p className="font-medium">
                    {new Date(student.admissionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Parent Email</label>
                  <p className="font-medium">{student.parentEmail}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Parent Phone</label>
                  <p className="font-medium">{student.parentPhone}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Address</label>
                  <p className="font-medium">{student.address}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-4">Parent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Father's Name</label>
                  <p className="font-medium">{student.fatherName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mother's Name</label>
                  <p className="font-medium">{student.motherName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return renderHome();
      case 'assignments':
        return renderAssignments();
      case 'performance':
        return renderPerformance();
      case 'attendance':
        return renderAttendance();
      case 'profile':
        return renderProfile();
      default:
        return renderHome();
    }
  };

  if (!student) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-purple-700">
          <div className="flex flex-col items-center gap-3">
            <img src={logoImage} alt="School Logo" className="w-20 h-20" />
            <div className="text-center">
              <p className="text-yellow-300 font-semibold">Student Portal</p>
              <p className="text-purple-200 text-sm">{student.class} - {student.section}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === item.id
                  ? 'bg-purple-700 text-white'
                  : 'text-purple-100 hover:bg-purple-800'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-purple-700">
          <div className="mb-3">
            <p className="text-purple-100 mb-1">{student.name}</p>
            <p className="text-purple-300 text-sm">{student.admissionNo}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

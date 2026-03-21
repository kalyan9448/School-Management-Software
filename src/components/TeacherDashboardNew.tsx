import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Calendar,
  FileText,
  LogOut,
  Bell,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Eye,
  Plus,
  Edit,
  Save,
  ChevronRight,
  BarChart3,
  Sparkles,
  Brain,
  Zap,
  Target,
  Award,
  MessageSquare,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import {
  studentService,
  attendanceService,
  lessonService,
  teacherService,
  timetableService,
  notificationService,
  Notification,
} from '../utils/centralDataService';
import {
  studentNotesStore,
} from '../utils/dataStore';
import { TeachingFlowScreen } from './TeachingFlowScreen';
import { DashboardNav, teacherNavItems } from './DashboardNav';
import { getUniqueClasses, getSectionsForClass } from '../utils/classUtils';
import { 
  performanceAnalyticsService, 
  TimeSeriesPoint, 
  InsightTrigger, 
  ClassDelta 
} from '../utils/performanceAnalytics';
import { TeacherPerformanceAnalytics } from './TeacherPerformanceAnalytics';

type ViewType =
  | 'dashboard'
  | 'my-classes'
  | 'attendance'
  | 'lesson-log'
  | 'teaching-flow'
  | 'student-notes'
  | 'performance'
  | 'notifications';

interface ClassInfo {
  id: string;
  class: string;
  section: string;
  subject: string;
  students: number;
  time: string;
}

interface LocalStudent {
  id: string;
  name: string;
  rollNo: string;
  attendance: 'present' | 'absent' | 'late' | 'half-day' | 'leave' | null;
  photo?: string;
  class?: string;
  section?: string;
}

interface LessonLog {
  id: string;
  date: string;
  class: string;
  section: string;
  subject: string;
  topic: string;
  objectives: string[];
  studentsNeedingAttention: string[];
  notes: string;
}

export function TeacherDashboardNew() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Attendance filter state
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('');
  const [attendanceSectionFilter, setAttendanceSectionFilter] = useState('');
  const [attendanceSubjectFilter, setAttendanceSubjectFilter] = useState('');

  // Lesson Log state
  const [selectedLessonClass, setSelectedLessonClass] = useState<ClassInfo | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);

  // State for dynamic data
  const [myClasses, setMyClasses] = useState<ClassInfo[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<{ time: string, class: string, subject: string, status: string }[]>([]);
  const [allStudents, setAllStudents] = useState<LocalStudent[]>([]);
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // SaaS Performance State
  const [trends, setTrends] = useState<TimeSeriesPoint[]>([]);
  const [insightTriggers, setInsightTriggers] = useState<InsightTrigger[]>([]);
  const [classDelta, setClassDelta] = useState<ClassDelta | null>(null);

  useEffect(() => {
    if (user?.email) {
      const loadNotifications = () => {
        const userNotifications = notificationService.getByUser(user.email);
        setNotifications(userNotifications);
        setUnreadCount(notificationService.getUnreadCount(user.email));
      };

      loadNotifications();

      // Refresh notifications every 60 seconds
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    if (user?.email) {
      setNotifications(notificationService.getByUser(user.email));
      setUnreadCount(notificationService.getUnreadCount(user.email));
    }
  };

  const handleMarkAllAsRead = () => {
    if (user?.email) {
      notificationService.markAllAsRead(user.email);
      setNotifications(notificationService.getByUser(user.email));
      setUnreadCount(notificationService.getUnreadCount(user.email));
    }
  };

  useEffect(() => {
    if (user?.email) {
      let teacher = teacherService.getByEmail(user.email);
      if (!teacher) {
        // Fallback for demo teacher if not found by email but is a teacher role
        if (user.role === 'teacher') {
          const allTeachers = teacherService.getAll();
          if (allTeachers.length > 0) teacher = allTeachers[0];
        }
      }

      if (teacher) {
        // Populate myClasses dynamically
        const classesInfo: ClassInfo[] = teacher.classes.map((c: any, i: number) => {
          const studentsInClass = studentService.getByClass(c.class, c.section);
          return {
            id: `${c.class}-${c.section}-${c.subject}-${i}`,
            class: c.class,
            section: c.section,
            subject: c.subject,
            students: studentsInClass.length,
            time: '09:00 AM - 10:00 AM', // Placeholder times as we don't have timetable yet
          };
        });
        setMyClasses(classesInfo);

        // Populate todaySchedule dynamically based on real timetable data
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const teacherSlots = timetableService.getByTeacher(user.email);
        const todaySlots = teacherSlots.filter(s => s.day === today);

        if (todaySlots.length > 0) {
          const schedules = todaySlots.map(slot => ({
            time: slot.startTime,
            class: `${slot.class}-${slot.section}`,
            subject: slot.subject,
            status: 'upcoming'
          }));
          setTodaySchedule(schedules);
        } else {
          // Fallback or empty state if no slots for today
          setTodaySchedule([]);
        }

        // Populate allStudents dynamically
        let allStds: LocalStudent[] = [];
        // Use a set to avoid duplicate students if they take multiple subjects from same teacher
        const studentIds = new Set();

        teacher.classes.forEach((c: any) => {
          const stds = studentService.getByClass(c.class, c.section);
          stds.forEach((s: any) => {
            if (!studentIds.has(s.id)) {
              studentIds.add(s.id);
              allStds.push({
                id: s.id,
                name: s.name,
                rollNo: s.rollNo,
                attendance: null,
                class: s.class,
                section: s.section
              });
            }
          });
        });
        setAllStudents(allStds);
      }
      
      // Load SaaS Performance Data
      setTrends(performanceAnalyticsService.getMonthlyTrends(user.email));
      setInsightTriggers(performanceAnalyticsService.getInsightTriggers(user.email));
      if (selectedClass) {
        setClassDelta(performanceAnalyticsService.calculateClassDelta(selectedClass.id));
      }
    }
  }, [user, selectedClass]);

  const [lessonForm, setLessonForm] = useState({
    topic: '',
    objectives: [] as string[],
    studentsNeedingAttention: [] as string[],
    notes: '',
    teachingDepth: 'Moderate' as 'Basic' | 'Moderate' | 'Advanced',
    aiSuggestions: [] as string[],
  });

  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);

  useEffect(() => {
    if (attendanceClassFilter && attendanceSectionFilter && attendanceDate) {
      // ... existing attendance logic ...
      const classStudents = allStudents.filter(
        student =>
          student.class === attendanceClassFilter &&
          student.section === attendanceSectionFilter
      );
      const previouslyMarked = attendanceService.getByDate(attendanceDate);
      const studentsWithAttendance: LocalStudent[] = classStudents.map(student => {
        const existingRecord = previouslyMarked.find((r: any) => r.studentId === student.id);
        return {
          ...student,
          attendance: (existingRecord ? existingRecord.status : null) as any,
        };
      });
      setStudents(studentsWithAttendance);
    }
  }, [attendanceDate, attendanceClassFilter, attendanceSectionFilter]);

  // Reset objectives when subject changes to avoid cross-subject leftovers
  useEffect(() => {
    setLessonForm(prev => ({ ...prev, objectives: [] }));
  }, [selectedSubject]);

  const subjectSpecificObjectives: { [key: string]: string[] } = {
    'Mathematics': [
      'Solve linear equations with one variable',
      'Apply Pythagorean theorem to right triangles',
      'Calculate area and perimeter of complex shapes',
      'Understand and apply algebraic identities',
      'Interpret statistical data through graphs',
      'Solve word problems using ratio and proportion',
    ],
    'Science': [
      'Explain the process of photosynthesis',
      'Identify parts of the human digestive system',
      'Differentiate between physical and chemical changes',
      'Apply Newton\'s second law to calculate force',
      'Describe the structure of an atom',
      'Analyze the impact of climate change on biodiversity',
    ],
    'English': [
      'Analyze themes and motif in literature',
      'Construct complex sentences using appropriate conjunctions',
      'Identify and use poetic devices (metaphor, simile, etc.)',
      'Write a formal letter with correct structure',
      'Demonstrate understanding of verb tenses',
      'Summarize a text accurately and concisely',
    ],
    'Social Studies': [
      'Compare different types of government systems',
      'Identify major landmarks of the Indian freedom struggle',
      'Analyze the impact of industrialization on society',
      'Locate major rivers and mountain ranges on a map',
      'Understand the role of the judiciary in a democracy',
      'Discuss the importance of sustainable development',
    ],
    'Computer': [
      'Write simple algorithms using pseudocode',
      'Create basic web pages using HTML tags',
      'Implement loops and conditionals in a program',
      'Understand the principles of data security',
      'Use spreadsheets for data analysis and visualization',
      'Explain the components of a computer network',
    ],
    'Default': [
      'Understand fundamental concepts and definitions',
      'Apply formulas and solve numerical problems',
      'Analyze and interpret data or text',
      'Develop critical thinking and reasoning skills',
      'Comprehend and explain key theories',
      'Demonstrate practical application of concepts',
      'Evaluate and compare different approaches',
      'Create solutions to complex problems',
    ]
  };

  const getActiveObjectives = () => {
    return subjectSpecificObjectives[selectedSubject] || subjectSpecificObjectives['Default'];
  };

  const aiTopicSuggestions: { [key: string]: string[] } = {
    'Mathematics': [
      'Linear Equations in One Variable',
      'Rational Numbers and Properties',
      'Geometry: Triangles and Quadrilaterals',
      'Algebraic Expressions and Identities',
      'Mensuration: Area and Volume',
      'Data Handling and Statistics',
    ],
    'Science': [
      'Chemical Reactions and Equations',
      'Electricity and Magnetism',
      'Light: Reflection and Refraction',
      'Human Body Systems',
      'Periodic Classification of Elements',
      'Force and Laws of Motion',
    ],
    'English': [
      'Grammar: Active and Passive Voice',
      'Comprehension and Critical Analysis',
      'Writing Skills: Essay and Letter Writing',
      'Poetry Analysis and Interpretation',
      'Vocabulary Building and Usage',
      'Literature: Character Analysis',
    ],
    'Social Studies': [
      'Democracy and Constitutional Rights',
      'Indian Freedom Struggle',
      'Geography: Climate and Natural Resources',
      'Economic Development and Planning',
      'Cultural Heritage and Diversity',
      'Political Systems and Governance',
    ],
    'Computer': [
      'Introduction to Programming Concepts',
      'HTML and Web Development Basics',
      'Spreadsheet Applications and Formulas',
      'Database Management Fundamentals',
      'Internet Safety and Digital Citizenship',
      'Problem Solving with Algorithms',
    ],
  };

  const subjects = [
    'All Subjects',
    'English',
    'Mathematics',
    'Science',
    'Social Studies',
    'Hindi',
    'Art & Craft',
    'Physical Education',
    'Music',
    'Computer',
  ];

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAllStudents((prevStudents) =>
      prevStudents.map((s) => {
        if (s.id === studentId) {
          // Toggle: if clicking the same status, unmark it
          if (s.attendance === status) {
            return { ...s, attendance: null };
          }
          return { ...s, attendance: status };
        }
        return s;
      })
    );
  };

  const handleSaveAttendance = () => {
    if (!attendanceClassFilter || !attendanceSectionFilter) {
      alert('Please select class and section');
      return;
    }

    // Get filtered students for the selected class/section
    const filteredStudents = allStudents.filter(
      student =>
        student.class === attendanceClassFilter &&
        student.section === attendanceSectionFilter
    );

    // Prepare attendance records
    const attendanceRecords = filteredStudents
      .filter(s => s.attendance !== null)
      .map(s => ({
        studentId: s.id,
        studentName: s.name,
        class: attendanceClassFilter,
        section: attendanceSectionFilter,
        date: attendanceDate,
        status: s.attendance!,
        markedBy: user?.email || 'teacher',
      }));

    if (attendanceRecords.length === 0) {
      alert('Please mark attendance for at least one student');
      return;
    }

    // Save to data store
    attendanceService.markAttendance(attendanceRecords as any);

    alert(`✅ Attendance saved successfully!\n${attendanceRecords.length} students marked for ${attendanceClassFilter} - Section ${attendanceSectionFilter}`);

    // Reset attendance status for the saved students
    setAllStudents(prevStudents =>
      prevStudents.map(s => {
        if (s.class === attendanceClassFilter && s.section === attendanceSectionFilter) {
          return { ...s, attendance: null };
        }
        return s;
      })
    );

    // Reset filters
    setAttendanceClassFilter('');
    setAttendanceSectionFilter('');
    setAttendanceSubjectFilter('');

    setCurrentView('dashboard');
  };

  const handleSaveLessonLog = () => {
    if (!selectedClass) return;

    // Save lesson to data store
    const lesson = lessonService.create({
      date: new Date().toISOString().split('T')[0],
      classId: selectedClass.id,
      class: selectedClass.class,
      section: selectedClass.section,
      subject: lessonForm.topic.split('-')[0] || 'General',
      topic: lessonForm.topic,
      objectives: lessonForm.objectives,
      studentsNeedingAttention: lessonForm.studentsNeedingAttention,
      notes: lessonForm.notes,
      teacherId: user?.email || 'teacher',
      teacherName: user?.name || 'Teacher',
    });

    alert('Lesson logged successfully!');

    // Reset form
    setLessonForm({
      topic: '',
      objectives: [],
      studentsNeedingAttention: [],
      notes: '',
      teachingDepth: 'Moderate',
      aiSuggestions: [],
    });

    setCurrentView('dashboard');
  };

  const renderDashboard = () => {
    // Calculate real stats from dataStore with safe defaults
    let presentCount = 0;
    let weekLessons: any[] = [];


    try {
      const todayString = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceService.getByDate(today);
      presentCount = todayAttendance.filter((a) => a.status === 'present').length;

      // Get lessons logged TODAY by this teacher
      const allLessons = lessonService.getAll();
      const teacherEmail = user?.email || 'teacher';

      const todayLessons = allLessons.filter((lesson: any) => {
        return lesson.date === today && lesson.teacherId === teacherEmail;
      });
      presentCount = todayAttendance.filter((a) => a.status === 'present').length;

      weekLessons = todayLessons; // Re-purposing weekLessons variable to todayLessons for stats
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Continue with default values
    }

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-md p-6 text-white">
          <h2 className="text-2xl mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-purple-100">
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Stats - Matching the Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* My Classes Card */}
          <div className="bg-white rounded-xl border-2 border-purple-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              setCurrentView('my-classes');
            }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-1">My Classes</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{myClasses.length}</h3>
                <p className="text-gray-600 text-sm">Active classes</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Present Today Card */}
          <div className="bg-white rounded-xl border-2 border-green-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              setCurrentView('attendance');
            }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-1">Present Today</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{presentCount}</h3>
                <p className="text-gray-600 text-sm">Students</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Lessons Logged Card */}
          <div className="bg-white rounded-xl border-2 border-orange-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              setSelectedClass(myClasses[0]);
              setSelectedLessonClass(myClasses[0]);
              setShowLessonForm(false);
              setCurrentView('lesson-log');
            }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-1">Lessons Logged</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{weekLessons.length}</h3>
                <p className="text-gray-600 text-sm">Today</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            {todaySchedule.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 text-center">
                    <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">{item.time}</p>
                  </div>
                  <div>
                    <p className="text-gray-900">{item.subject}</p>
                    <p className="text-gray-600 text-sm">{item.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Parse class name to extract class and section
                      // Format: "Class 6-A" -> class: "Class 6", section: "A"
                      const classMatch = item.class.match(/^(Class \d+)-([A-Z])$/);
                      if (classMatch) {
                        // Find the matching ClassInfo object
                        const matchingClass = myClasses.find(
                          c => c.class === classMatch[1] &&
                            c.section === classMatch[2] &&
                            c.subject === item.subject
                        );
                        if (matchingClass) {
                          setSelectedLessonClass(matchingClass);
                        }
                        setSelectedSubject(item.subject);
                      }
                      setShowLessonForm(false);
                      setCurrentView('lesson-log');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Log Lesson
                  </button>
                  <button
                    onClick={() => {
                      // Parse class name to extract class and section
                      // Format: "Class 6-A" -> class: "Class 6", section: "A"
                      const classMatch = item.class.match(/^(Class \d+)-([A-Z])$/);
                      if (classMatch) {
                        setAttendanceClassFilter(classMatch[1]); // "Class 6"
                        setAttendanceSectionFilter(classMatch[2]); // "A"
                        setAttendanceSubjectFilter(item.subject); // Set subject if needed
                      }
                      setCurrentView('attendance');
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Classes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">My Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClasses.map((cls) => (
              <div key={cls.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-gray-900">
                      {cls.class} - Section {cls.section}
                    </h4>
                    <p className="text-gray-600">{cls.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900">{cls.students}</p>
                    <p className="text-gray-600 text-sm">students</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setCurrentView('attendance');
                    }}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Logged Lessons */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Today's Logged Lessons</h3>
            <button
              onClick={() => {
                setShowLessonForm(false);
                setCurrentView('lesson-log');
              }}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log New Lesson
            </button>
          </div>
          <div className="space-y-3">
            {weekLessons.length > 0 ? (
              weekLessons.map((lesson: any) => (
                <div
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setCurrentView('teaching-flow');
                  }}
                  className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{lesson.topic}</h4>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {lesson.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(lesson.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {lesson.class} - Sec {lesson.section}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {lesson.objectives?.length || 0} Objectives
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No lessons logged yet</p>
                <p className="text-sm">Click "Log New Lesson" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setCurrentView('student-notes')}
              className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
            >
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <span className="text-gray-700">Add Student Note</span>
            </button>
            <button
              onClick={() => setCurrentView('performance')}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">View Performance</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">Learning Objectives</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">Student Achievements</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper functions for attendance filters
  const getAvailableSections = (selectedClass: string) => {
    if (!selectedClass) return [];
    const sections = myClasses
      .filter(c => c.class === selectedClass)
      .map(c => c.section);
    return [...new Set(sections)].sort();
  };

  const getAvailableSubjects = () => {
    const subjects = [...new Set(myClasses.map(c => c.subject))];
    return subjects.sort();
  };


  // Update students list when filters change
  const getFilteredStudents = () => {
    if (!attendanceClassFilter || !attendanceSectionFilter) {
      return [];
    }
    return allStudents.filter(
      student =>
        student.class === attendanceClassFilter &&
        student.section === attendanceSectionFilter
    );
  };

  const renderAttendance = () => {
    const filteredStudents = getFilteredStudents();

    const presentCount = filteredStudents.filter((s) => s.attendance === 'present').length;
    const absentCount = filteredStudents.filter((s) => s.attendance === 'absent').length;
    const lateCount = filteredStudents.filter((s) => s.attendance === 'late').length;
    const notMarkedCount = filteredStudents.filter((s) => s.attendance === null).length;

    // Check if attendance was already completed
    const isAttendanceCompleted = filteredStudents.length > 0 && notMarkedCount === 0;

    return (
      <div className="space-y-6">
        {/* Header with Class Info */}
        {attendanceClassFilter && attendanceSectionFilter ? (
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl">Mark Attendance</h2>
                  {isAttendanceCompleted && (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Already Completed
                    </span>
                  )}
                </div>
                <p className="text-purple-100 text-lg">
                  {attendanceClassFilter} - Section {attendanceSectionFilter}
                  {attendanceSubjectFilter && ` | ${attendanceSubjectFilter}`}
                </p>
                <p className="text-purple-100 text-sm mt-1">
                  {new Date(attendanceDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  // Reset filters and go back
                  setAttendanceClassFilter('');
                  setAttendanceSectionFilter('');
                  setAttendanceSubjectFilter('');
                  setCurrentView('dashboard');
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Show Dropdowns if no pre-selection */
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-gray-900 mb-3">Mark Attendance</h2>

              {/* Dynamic Dropdown Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                {/* Class Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={attendanceClassFilter}
                    onChange={(e) => {
                      setAttendanceClassFilter(e.target.value);
                      setAttendanceSectionFilter(''); // Reset section when class changes
                      setStudents([]); // Clear students until both class and section are selected
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select Class</option>
                    {getUniqueClasses().map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={attendanceSectionFilter}
                    onChange={(e) => {
                      setAttendanceSectionFilter(e.target.value);
                      // Update students list when section is selected
                      if (attendanceClassFilter && e.target.value) {
                        const filtered = allStudents.filter(
                          student =>
                            student.class === attendanceClassFilter &&
                            student.section === e.target.value
                        );
                        setStudents(filtered);
                      }
                    }}
                    disabled={!attendanceClassFilter}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Section</option>
                    {getAvailableSections(attendanceClassFilter).map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Dropdown (Optional filter based on teacher assignment) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={attendanceSubjectFilter}
                    onChange={(e) => setAttendanceSubjectFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Subjects</option>
                    {getAvailableSubjects().map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Display Text */}
              {attendanceClassFilter && attendanceSectionFilter && (
                <div className="mt-3 text-gray-600">
                  <span className="font-medium">
                    {attendanceClassFilter} | Section {attendanceSectionFilter}
                    {attendanceSubjectFilter && ` | ${attendanceSubjectFilter}`}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Already Completed Info Banner */}
        {isAttendanceCompleted && attendanceClassFilter && attendanceSectionFilter && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-md p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-green-900 mb-2 font-semibold">Attendance Already Completed</h3>
                <p className="text-green-800 mb-3">
                  Attendance for {attendanceClassFilter} - Section {attendanceSectionFilter} on{' '}
                  {new Date(attendanceDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })} has already been marked.
                </p>
                <p className="text-green-700 text-sm">
                  You can review and update the attendance records below if needed. Any changes will overwrite the previous records for this date.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats - Only show when class and section are selected */}
        {attendanceClassFilter && attendanceSectionFilter && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-600">
              <p className="text-gray-600 mb-1">Present</p>
              <p className="text-2xl text-gray-900">{presentCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-600">
              <p className="text-gray-600 mb-1">Absent</p>
              <p className="text-2xl text-gray-900">{absentCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-600">
              <p className="text-gray-600 mb-1">Late</p>
              <p className="text-2xl text-gray-900">{lateCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-600">
              <p className="text-gray-600 mb-1">Not Marked</p>
              <p className="text-2xl text-gray-900">{notMarkedCount}</p>
            </div>
          </div>
        )}

        {/* Date Selection - Only show if manually selecting class */}
        {!attendanceClassFilter || !attendanceSectionFilter ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="block text-gray-700 mb-2">Attendance Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        ) : null}

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Students ({filteredStudents.length})</h3>
              {attendanceClassFilter && attendanceSectionFilter && filteredStudents.length > 0 && (
                <button
                  onClick={() => {
                    // Mark all students as present
                    setAllStudents((prevStudents) =>
                      prevStudents.map((s) => {
                        if (s.class === attendanceClassFilter && s.section === attendanceSectionFilter) {
                          return { ...s, attendance: 'present' };
                        }
                        return s;
                      })
                    );
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark All Present
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {!attendanceClassFilter || !attendanceSectionFilter ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Please select Class and Section</p>
                <p className="text-sm">Choose a class and section from the dropdowns above to view students</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No students found</p>
                <p className="text-sm">There are no students in {attendanceClassFilter} - Section {attendanceSectionFilter}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${student.attendance === 'present'
                      ? 'bg-green-50 border-green-600'
                      : student.attendance === 'absent'
                        ? 'bg-red-50 border-red-600'
                        : student.attendance === 'late'
                          ? 'bg-orange-50 border-orange-600'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-gray-900 font-medium">{student.name}</p>
                        <p className="text-gray-600 text-sm">Roll No: {student.rollNo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'present')}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors ${student.attendance === 'present'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                          }`}
                      >
                        <CheckCircle className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors ${student.attendance === 'absent'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                          }`}
                      >
                        <XCircle className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.id, 'late')}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors ${student.attendance === 'late'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
                          }`}
                      >
                        <Clock className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              // Reset filters and go back
              setAttendanceClassFilter('');
              setAttendanceSectionFilter('');
              setAttendanceSubjectFilter('');
              setCurrentView('dashboard');
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={
              !attendanceClassFilter ||
              !attendanceSectionFilter ||
              filteredStudents.length === 0 ||
              filteredStudents.filter(s => s.attendance !== null).length === 0
            }
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isAttendanceCompleted ? 'Update Attendance' : 'Save Attendance'}
            {filteredStudents.filter(s => s.attendance !== null).length > 0 && (
              <span className="ml-1 bg-purple-500 px-2 py-0.5 rounded-full text-xs">
                {filteredStudents.filter(s => s.attendance !== null).length}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Save lesson function
  const saveLessonLog = () => {
    if (!selectedLessonClass) {
      alert('Please select a class');
      return;
    }
    if (!lessonForm.topic) {
      alert('Please enter a topic');
      return;
    }
    if (lessonForm.objectives.length === 0) {
      alert('Please select at least one learning objective');
      return;
    }

    // Save lesson to data store
    const lesson = lessonService.create({
      date: lessonDate,
      classId: selectedLessonClass.id,
      class: selectedLessonClass.class,
      section: selectedLessonClass.section,
      subject: selectedSubject,
      topic: lessonForm.topic,
      objectives: lessonForm.objectives,
      studentsNeedingAttention: lessonForm.studentsNeedingAttention,
      notes: lessonForm.notes,
      teacherId: user?.email || 'teacher',
      teacherName: user?.name || 'Teacher',
    });

    alert('✅ Lesson logged successfully!');

    // Reset form
    setLessonForm({
      topic: '',
      objectives: [],
      studentsNeedingAttention: [],
      notes: '',
      teachingDepth: 'Moderate',
      aiSuggestions: [],
    });

    setShowLessonForm(false);
  };

  const renderLessonLog = () => {
    // If form is not shown, display the list of logged lessons
    if (!showLessonForm) {
      // Get stored lessons
      const allLessonsData = lessonService.getAll();

      // Filter lessons by teacher, class and subject
      const teacherEmail = user?.email || 'teacher';
      const filteredLessons = allLessonsData.filter((lesson: any) => {
        const teacherMatch = lesson.teacherId === teacherEmail;
        const classMatch = !selectedLessonClass ||
          (lesson.class === selectedLessonClass.class && lesson.section === selectedLessonClass.section);
        const subjectMatch = selectedSubject === 'All Subjects' || lesson.subject === selectedSubject;
        return teacherMatch && classMatch && subjectMatch;
      });

      // Sort by date (most recent first) and then by creation if date is same (assuming id is temporal or just use stable sort)
      const sortedLessons = filteredLessons.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return 0; // Maintain order within same day
      });

      return (
        <div className="space-y-6">
          {/* Header with Class Info */}
          {selectedLessonClass ? (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl mb-2">📚 Lesson Overview</h2>
                  <p className="text-blue-100 text-lg">
                    {selectedLessonClass.class} - Section {selectedLessonClass.section} | {selectedSubject}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">
                    {sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''} logged
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLessonForm(true)}
                    className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Log New Lesson
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLessonClass(null);
                      setSelectedSubject('All Subjects');
                      setCurrentView('dashboard');
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 mb-1">📚 Log Today's Lesson</h2>
                <p className="text-gray-600">
                  Create and log lesson details manually for your class
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLessonForm(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Log Lesson
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Lesson Logs List */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4 font-semibold">
              {selectedLessonClass && selectedSubject !== 'All Subjects'
                ? `${selectedSubject} Lessons`
                : 'Logged Lessons'}
            </h3>

            {sortedLessons.length > 0 ? (
              <div className="space-y-6">
                {(() => {
                  let lastDate = '';
                  return sortedLessons.map((lesson: any) => {
                    const lessonDateObj = new Date(lesson.date);
                    const dateString = lessonDateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    const showHeader = dateString !== lastDate;
                    lastDate = dateString;

                    return (
                      <div key={lesson.id} className="space-y-3">
                        {showHeader && (
                          <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {dateString}
                            </span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                          </div>
                        )}
                        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-semibold text-gray-900 text-lg">{lesson.topic}</h4>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                                  {lesson.subject}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4 text-purple-600" />
                                  <span>{lessonDateObj.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <BookOpen className="w-4 h-4 text-purple-600" />
                                  <span>{lesson.class} - Sec {lesson.section}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Target className="w-4 h-4 text-purple-600" />
                                  <span>{lesson.objectives?.length || 0} Objectives</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Users className="w-4 h-4 text-purple-600" />
                                  <span>By {lesson.teacherName || user?.name || 'Teacher'}</span>
                                </div>
                              </div>

                              {lesson.objectives && lesson.objectives.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-600 mb-2">Learning Objectives:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {lesson.objectives.slice(0, 3).map((obj: string, idx: number) => (
                                      <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                        {obj}
                                      </span>
                                    ))}
                                    {lesson.objectives.length > 3 && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        +{lesson.objectives.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {lesson.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Notes:</p>
                                  <p className="text-sm text-gray-700 italic">{lesson.notes}</p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedLesson(lesson);
                                setCurrentView('teaching-flow');
                              }}
                              className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                            >
                              View Teaching Flow
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No lessons logged yet</p>
                <p className="text-sm mb-4">
                  {selectedLessonClass
                    ? `No lessons found for ${selectedLessonClass.class} - Section ${selectedLessonClass.section} | ${selectedSubject}`
                    : 'Start by creating your first lesson log'}
                </p>
                <button
                  onClick={() => setShowLessonForm(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Log Lesson
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Show the lesson creation form
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 mb-1">📚 Create Lesson Log</h2>
            <p className="text-gray-600">
              {selectedLessonClass
                ? `Logging lesson for ${selectedLessonClass.class} - Section ${selectedLessonClass.section} | ${selectedSubject}`
                : 'Create and log lesson details manually for your class'}
            </p>
          </div>
          <button
            onClick={() => setShowLessonForm(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Lesson Logs
          </button>
        </div>

        {/* Class Context Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Class Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">📋 Class *</label>
              <select
                value={selectedLessonClass?.id || ''}
                onChange={(e) => {
                  const cls = myClasses.find(c => c.id === e.target.value);
                  setSelectedLessonClass(cls || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Select class...</option>
                {myClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class} - Sec {cls.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">📖 Subject *</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {subjects.filter(s => s !== 'All Subjects').map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">📅 Date *</label>
              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">⏰ Time</label>
              <input
                type="time"
                defaultValue="09:00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Topic Input with Suggestions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-gray-700 font-semibold mb-3">🎯 Topic Covered *</label>
          <div className="relative">
            <input
              type="text"
              value={lessonForm.topic}
              onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
              placeholder="e.g., Linear Equations in One Variable"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            {lessonForm.topic.length > 0 && aiTopicSuggestions[selectedSubject]?.some(t => t.toLowerCase().includes(lessonForm.topic.toLowerCase())) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {aiTopicSuggestions[selectedSubject]
                  .filter(t => t.toLowerCase().includes(lessonForm.topic.toLowerCase()) && t !== lessonForm.topic)
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50 text-gray-700 text-sm"
                      onClick={() => setLessonForm({ ...lessonForm, topic: suggestion })}
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 w-full mb-1">Quick Suggestions:</span>
            {aiTopicSuggestions[selectedSubject]?.slice(0, 3).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setLessonForm({ ...lessonForm, topic: suggestion })}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-purple-100 hover:text-purple-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Curriculum Objectives */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="space-y-4">

            <label className="block text-gray-700 font-semibold mb-3">🎯 Learning Objectives *</label>
            <p className="text-gray-600 text-sm mb-4">
              Select the learning objectives covered in this lesson
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getActiveObjectives().map((objective, index) => {
                const isRecommended = lessonForm.topic && objective.toLowerCase().includes(lessonForm.topic.toLowerCase().split(' ')[0]);
                return (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${lessonForm.objectives.includes(objective)
                      ? 'bg-purple-50 border-purple-400 shadow-sm'
                      : isRecommended
                        ? 'bg-yellow-50 border-yellow-300 border-dashed'
                        : 'bg-gray-50 border-gray-200 hover:bg-purple-50 hover:border-purple-200'
                      }`}
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={lessonForm.objectives.includes(objective)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLessonForm({
                                ...lessonForm,
                                objectives: [...lessonForm.objectives, objective],
                              });
                            } else {
                              setLessonForm({
                                ...lessonForm,
                                objectives: lessonForm.objectives.filter((o) => o !== objective),
                              });
                            }
                          }}
                          className="w-5 h-5 text-purple-600"
                        />
                        <span className={`text-sm ${lessonForm.objectives.includes(objective) ? 'text-purple-900 font-medium' : 'text-gray-700'}`}>
                          {objective}
                        </span>
                      </div>
                      {isRecommended && !lessonForm.objectives.includes(objective) && (
                        <span className="text-[10px] text-yellow-700 font-semibold mt-1 ml-8">✨ Recommended for this topic</span>
                      )}
                    </div>
                  </label>
                );
              })}

              {/* Custom Objective Field */}
              <div className="col-span-full mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="custom-objective-input"
                    placeholder="Add a custom learning objective..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (val && !lessonForm.objectives.includes(val)) {
                          setLessonForm({
                            ...lessonForm,
                            objectives: [...lessonForm.objectives, val],
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('custom-objective-input') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val && !lessonForm.objectives.includes(val)) {
                        setLessonForm({
                          ...lessonForm,
                          objectives: [...lessonForm.objectives, val],
                        });
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Performance Tagging */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="space-y-4">

            <label className="block text-gray-700 font-semibold mb-3">
              👥 Student Performance Tracking
            </label>
            <p className="text-gray-600 text-sm mb-4">
              Tag students who need extra attention or support
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {students.slice(0, 8).map((student) => (
                <label
                  key={student.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${lessonForm.studentsNeedingAttention.includes(student.name)
                    ? 'bg-orange-50 border-orange-400 shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={lessonForm.studentsNeedingAttention.includes(student.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLessonForm({
                          ...lessonForm,
                          studentsNeedingAttention: [
                            ...lessonForm.studentsNeedingAttention,
                            student.name,
                          ],
                        });
                      } else {
                        setLessonForm({
                          ...lessonForm,
                          studentsNeedingAttention:
                            lessonForm.studentsNeedingAttention.filter(
                              (n) => n !== student.name
                            ),
                        });
                      }
                    }}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className={`text-sm ${lessonForm.studentsNeedingAttention.includes(student.name) ? 'text-orange-900 font-medium' : 'text-gray-700'}`}>
                    {student.name.split(' ')[0]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Teacher Notes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-gray-700 font-semibold mb-3">📝 Additional Notes (Optional)</label>
          <textarea
            value={lessonForm.notes}
            onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
            rows={3}
            placeholder="Add any additional notes about the lesson, teaching methods, or observations..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setShowLessonForm(false);
              // Reset form
              setLessonForm({
                topic: '',
                objectives: [],
                studentsNeedingAttention: [],
                notes: '',
                teachingDepth: 'Moderate',
                aiSuggestions: [],
              });
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={saveLessonLog}
            disabled={!lessonForm.topic || lessonForm.objectives.length === 0 || !selectedLessonClass}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Save Lesson
          </button>
        </div>
      </div>
    );
  };



  const renderStudentNotes = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">Student Notes & Observations</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Add Note Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Add New Note</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Select Student</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Note Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer">
                  <input type="radio" name="noteType" className="w-4 h-4" />
                  <span className="text-gray-700">Achievement</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer">
                  <input type="radio" name="noteType" className="w-4 h-4" />
                  <span className="text-gray-700">Concern</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer">
                  <input type="radio" name="noteType" className="w-4 h-4" />
                  <span className="text-gray-700">Behavior</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Note</label>
              <textarea
                rows={4}
                placeholder="Enter your observation or note..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            </div>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Save Note
            </button>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Recent Notes</h3>
          <div className="space-y-3">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-900">Aarav Patel</p>
                <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                  Achievement
                </span>
              </div>
              <p className="text-gray-700 mb-2">
                Excellent participation in today's circle time. Answered all questions correctly.
              </p>
              <p className="text-gray-600 text-sm">Today, 10:30 AM</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-900">Arjun Singh</p>
                <span className="px-2 py-1 bg-orange-600 text-white rounded text-xs">Concern</span>
              </div>
              <p className="text-gray-700 mb-2">
                Struggling with color recognition. Needs additional practice and attention.
              </p>
              <p className="text-gray-600 text-sm">Today, 11:45 AM</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Student Performance <span className="text-purple-600">&</span> Analytics
            </h2>
            <p className="text-sm text-gray-400 font-medium max-w-md">
              Real-time insights and progress tracking for your assigned classes.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold border-2 border-gray-100 shadow-sm hover:shadow-md active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </button>
        </div>
        
        <TeacherPerformanceAnalytics 
          teacherEmail={user?.email || ''} 
          selectedClass={myClasses[0] ? { class: myClasses[0].class, section: myClasses[0].section, subject: myClasses[0].subject } : undefined}
        />
      </div>
    );
  };

  const renderTeachingFlow = () => {
    return (
      <TeachingFlowScreen
        lesson={selectedLesson}
        onBack={() => {
          setSelectedLesson(null);
          setCurrentView('lesson-log');
        }}
        onMarkAttendance={() => {
          // Set attendance filters from the lesson data
          if (selectedLesson) {
            setAttendanceClassFilter(selectedLesson.class);
            setAttendanceSectionFilter(selectedLesson.section);
            setAttendanceSubjectFilter(selectedLesson.subject);
          }
          setCurrentView('attendance');
        }}
      />
    );
  };

  const renderMyClasses = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl mb-2">My Classes</h2>
              <p className="text-purple-100 text-lg">
                {myClasses.length} active class{myClasses.length !== 1 ? 'es' : ''} assigned
              </p>
            </div>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300"
            >
              {/* Class Header */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-5 rounded-t-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white text-xl font-semibold mb-1">
                      {cls.class}
                    </h3>
                    <p className="text-purple-100">Section {cls.section}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <p className="text-white text-sm font-medium">{cls.students} Students</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-100" />
                  <p className="text-white font-medium">{cls.subject}</p>
                </div>
              </div>

              {/* Class Actions */}
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      // Parse and set filters for attendance
                      setAttendanceClassFilter(cls.class);
                      setAttendanceSectionFilter(cls.section);
                      setAttendanceSubjectFilter(cls.subject);
                      setCurrentView('attendance');
                    }}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Attendance
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLessonClass(cls);
                      setSelectedSubject(cls.subject);
                      setShowLessonForm(false);
                      setCurrentView('lesson-log');
                    }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <BookOpen className="w-4 h-4" />
                    Lessons
                  </button>
                </div>

                {/* Additional Quick Actions */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setCurrentView('performance');
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm w-full"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Stats
                    </button>
                  </div>
                </div>

                {/* Class Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Students</span>
                    <span className="font-semibold text-gray-900">{cls.students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subject</span>
                    <span className="font-semibold text-gray-900">{cls.subject}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Class Room</span>
                    <span className="font-semibold text-gray-900">Room {cls.section}0{cls.id}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {myClasses.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12">
            <div className="text-center text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No Classes Assigned</p>
              <p className="text-sm">You don't have any classes assigned yet.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAllNotifications = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">All Notifications</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-semibold"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all as read
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {notifications.map((notification) => {
                const getTypeConfig = (type: string) => {
                  switch (type) {
                    case 'attendance': return { icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' };
                    case 'assignment': return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' };
                    case 'exam': return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
                    case 'fee': return { icon: Award, color: 'text-green-500', bg: 'bg-green-50' };
                    case 'announcement': return { icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50' };
                    default: return { icon: MessageSquare, color: 'text-gray-500', bg: 'bg-gray-100' };
                  }
                };
                const config = getTypeConfig(notification.type);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={`p-6 flex items-start gap-4 transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-purple-50/20' : ''}`}
                  >
                    <div className={`p-3 rounded-xl ${config.bg} ${config.color} shrink-0 shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h4 className={`text-lg ${!notification.read ? 'text-gray-900 font-bold' : 'text-gray-700 font-semibold'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-sm text-gray-500 font-medium">
                          {new Date(notification.date).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed max-w-3xl">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="mt-4 text-sm text-purple-600 font-bold hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-3 h-3 bg-purple-600 rounded-full mt-2 shrink-0 shadow-sm"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 shadow-inner">
                <Bell className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-500">When you receive notifications, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'my-classes':
        return renderMyClasses();
      case 'attendance':
        return renderAttendance();
      case 'lesson-log':
        return renderLessonLog();
      case 'teaching-flow':
        return renderTeachingFlow();
      case 'student-notes':
        return renderStudentNotes();
      case 'performance':
        return renderPerformance();
      case 'notifications':
        return renderAllNotifications();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-purple-800 text-white py-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="Kidz Vision Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-white mb-1">Teacher Portal</h1>
              <p className="text-purple-200 text-sm">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-purple-700 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ transformOrigin: 'top right' }}
                >
                  {/* Caret/Triangle */}
                  <div className="absolute top-0 right-3.5 -mt-2 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45 z-[-1]"></div>

                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 font-bold text-lg">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAllAsRead();
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => {
                        // Helper to get type-specific styles and icons
                        const getTypeConfig = (type: string) => {
                          switch (type) {
                            case 'attendance': return { icon: Users, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
                            case 'assignment': return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
                            case 'exam': return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
                            case 'fee': return { icon: Award, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
                            case 'announcement': return { icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
                            default: return { icon: MessageSquare, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' };
                          }
                        };
                        const config = getTypeConfig(notification.type);
                        const Icon = config.icon;

                        return (
                          <div
                            key={notification.id}
                            onClick={() => {
                              if (!notification.read) handleMarkAsRead(notification.id);
                              setShowNotifications(false);
                            }}
                            className={`group relative p-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${!notification.read ? 'bg-purple-50/30' : ''}`}
                          >
                            {!notification.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600"></div>
                            )}

                            <div className="flex items-start gap-4">
                              <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className={`text-sm truncate ${!notification.read ? 'text-gray-900 font-bold' : 'text-gray-700 font-medium'}`}>
                                    {notification.title}
                                  </p>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    {new Date(notification.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                  {notification.message}
                                </p>
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    className="mt-2 text-[10px] text-purple-600 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                  >
                                    Mark as read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Bell className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-semibold mb-1">Stay updated!</p>
                        <p className="text-gray-500 text-sm">No new notifications at the moment.</p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-4 bg-white border-t border-gray-50 text-center">
                      <button
                        onClick={() => {
                          setCurrentView('notifications');
                          setShowNotifications(false);
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 font-bold transition-colors"
                      >
                        View All Activity
                      </button>
                    </div>
                  )}
                </div>
              )}
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
      </header>

      {/* Navigation */}
      <DashboardNav
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view as ViewType)}
        items={teacherNavItems}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">{renderContent()}</main>
    </div>
  );
}
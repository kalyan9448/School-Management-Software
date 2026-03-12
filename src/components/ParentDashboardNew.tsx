import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardNav, parentNavItems } from './DashboardNav';
import {
  Users,
  Calendar,
  LogOut,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
  DollarSign,
  Download,
  CreditCard,
  AlertCircle,
  Eye,
  Brain,
  Star,
  Home,
  BarChart3,
  Receipt,
  MessageSquare,
  ChevronRight,
  Target,
  Activity,
  FileText,
  TrendingDown,
  Minus,
  Lightbulb,
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import { useStudents, useAttendance, useLessons, useNotifications } from '../hooks/useDataService';

type ViewType = 'dashboard' | 'timeline' | 'progress' | 'fees' | 'notifications' | 'reports' | 'ai-suggestions';
type ReportPeriod = 'weekly' | 'monthly';

interface Child {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNo: string;
  photo?: string;
}

interface AIDiscussionSuggestion {
  id: string;
  subject: string;
  topic: string;
  recentLesson: string;
  conversationStarter: string;
  keyQuestions: string[];
  realLifeConnection: string;
  encouragementTip: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

interface DailyActivity {
  id: string;
  date: string;
  subject: string;
  topic: string;
  objectives: string[];
  teacherNote?: string;
  quizAssigned: boolean;
  quizCompleted: boolean;
  quizScore?: number;
  quizTotal?: number;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  time?: string;
}

interface ProgressData {
  subject: string;
  averageScore: number;
  totalQuizzes: number;
  trend: 'improving' | 'steady' | 'needs-attention';
  lastScore: number;
}

interface FeeRecord {
  id: string;
  feeHead: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  receiptNo?: string;
}

interface Notification {
  id: string;
  type: 'attendance' | 'progress' | 'fee' | 'announcement';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export function ParentDashboardNew() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // 1. Fetch children for this parent
  const { students: children } = useStudents({ parentId: user?.id });

  // 2. State for selected child
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Initialize selected child if not set
  useMemo(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0] || {
    id: '1',
    name: 'Aarav Sharma',
    class: '8th',
    section: 'A',
    rollNo: '001',
  };

  // 3. Fetch dynamic data for selected child
  const { attendance: studentAttendance, stats: attendanceStats } = useAttendance({
    studentId: selectedChild?.id,
    startDate: new Date().toISOString().substring(0, 7) + '-01'
  });

  const { lessons } = useLessons({
    class: selectedChild?.class,
    section: selectedChild?.section
  });

  const { notifications: dynamicNotifications } = useNotifications(user?.id);

  // Demo data fallback / merging
  const todayDate = new Date().toISOString().split('T')[0];

  const todayRecord = studentAttendance.find(a => a.date === todayDate);
  const todayAttendance: AttendanceRecord = {
    date: todayDate,
    status: (todayRecord?.status as any) || 'absent',
    time: todayRecord?.time || '--:--',
  };

  // Convert lessons to daily activities
  const todayActivities: DailyActivity[] = lessons
    .filter(l => l.date === todayDate)
    .map(l => ({
      id: l.id,
      date: l.date,
      subject: l.subject,
      topic: l.topic,
      objectives: l.objectives,
      teacherNote: l.notes,
      quizAssigned: false, // Quizzes logic would go here
      quizCompleted: false,
    }));

  // Fallback to demo if no activities logged yet for a better UI experience in demo mode
  const effectiveActivities = todayActivities.length > 0 ? todayActivities : [
    {
      id: '1',
      date: todayDate,
      subject: 'Mathematics',
      topic: 'Quadratic Equations - Solving by Factorization',
      objectives: ['Understand quadratic equations', 'Apply factorization method to solve equations', 'Verify solutions by substitution'],
      teacherNote: 'Aarav showed excellent understanding of the concept and solved all practice problems correctly!',
      quizAssigned: true,
      quizCompleted: true,
      quizScore: 9,
      quizTotal: 10,
    }
  ];

  const weekTimeline: DailyActivity[] = lessons
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(l => ({
      id: l.id,
      date: l.date,
      subject: l.subject,
      topic: l.topic,
      objectives: l.objectives,
      teacherNote: l.notes,
      quizAssigned: false,
      quizCompleted: false,
    }));

  const progressData: ProgressData[] = [
    {
      subject: 'Mathematics',
      averageScore: 88,
      totalQuizzes: 15,
      trend: 'improving',
      lastScore: 90,
    },
    {
      subject: 'Science',
      averageScore: 82,
      totalQuizzes: 14,
      trend: 'improving',
      lastScore: 85,
    },
    {
      subject: 'English',
      averageScore: 85,
      totalQuizzes: 12,
      trend: 'steady',
      lastScore: 85,
    },
    {
      subject: 'Social Studies',
      averageScore: 78,
      totalQuizzes: 11,
      trend: 'steady',
      lastScore: 80,
    },
    {
      subject: 'Hindi',
      averageScore: 72,
      totalQuizzes: 10,
      trend: 'needs-attention',
      lastScore: 70,
    },
    {
      subject: 'Computer Science',
      averageScore: 92,
      totalQuizzes: 8,
      trend: 'improving',
      lastScore: 95,
    },
  ];

  const feeRecords: FeeRecord[] = [
    {
      id: '1',
      feeHead: 'Tuition Fee - March 2024',
      amount: 5000,
      dueDate: '2024-03-05',
      status: 'pending',
    },
    {
      id: '2',
      feeHead: 'Transport Fee - March 2024',
      amount: 2000,
      dueDate: '2024-03-05',
      status: 'pending',
    },
    {
      id: '3',
      feeHead: 'Tuition Fee - February 2024',
      amount: 5000,
      dueDate: '2024-02-05',
      status: 'paid',
      paidDate: '2024-02-03',
      receiptNo: 'REC2024001',
    },
    {
      id: '4',
      feeHead: 'Transport Fee - February 2024',
      amount: 2000,
      dueDate: '2024-02-05',
      status: 'paid',
      paidDate: '2024-02-03',
      receiptNo: 'REC2024002',
    },
  ];

  const notifications = dynamicNotifications.length > 0 ? dynamicNotifications : [
    {
      id: 'demo-1',
      type: 'announcement',
      title: 'Welcome to the New Dashboard',
      message: 'Explore your childs daily learning and progress in real-time.',
      date: todayDate,
      read: true,
    }
  ];

  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const pendingFees = feeRecords.filter((f) => f.status === 'pending');
  const totalDue = pendingFees.reduce((sum, f) => sum + f.amount, 0);

  const [selectedReportPeriod, setSelectedReportPeriod] = useState<ReportPeriod>('weekly');

  // Weekly Report Data (Last 7 days)
  const weeklyReportData = {
    period: 'Feb 12 - Feb 18, 2024',
    attendanceSummary: {
      present: 5,
      absent: 0,
      late: 0,
      total: 5,
    },
    homeworkSummary: {
      assigned: 12,
      completed: 11,
      onTime: 10,
      late: 1,
      pending: 1,
      completionRate: 92,
    },
    performanceBySubject: [
      { subject: 'Mathematics', quizzes: 2, avgScore: 90, trend: 'improving' as const },
      { subject: 'Science', quizzes: 2, avgScore: 85, trend: 'improving' as const },
      { subject: 'English', quizzes: 2, avgScore: 88, trend: 'steady' as const },
      { subject: 'Social Studies', quizzes: 1, avgScore: 80, trend: 'steady' as const },
      { subject: 'Hindi', quizzes: 1, avgScore: 70, trend: 'needs-attention' as const },
    ],
    skillGrowth: [
      { skill: 'Problem Solving', currentLevel: 85, change: 7, subject: 'Mathematics' },
      { skill: 'Critical Thinking', currentLevel: 80, change: 5, subject: 'Science' },
      { skill: 'Reading Comprehension', currentLevel: 88, change: 0, subject: 'English' },
      { skill: 'Written Expression', currentLevel: 82, change: -3, subject: 'English' },
    ],
    highlights: [
      'Excellent performance in Mathematics - scored 90% average',
      'Perfect attendance this week',
      'Showing improvement in Science concepts',
      'Need to focus on Hindi grammar exercises',
    ],
    teacherComments: [
      { subject: 'Mathematics', comment: 'Aarav shows strong understanding of quadratic equations' },
      { subject: 'English', comment: 'Great participation in literature discussions' },
    ],
  };

  // Monthly Report Data (Last 30 days)
  const monthlyReportData = {
    period: 'February 2024',
    attendanceSummary: {
      present: 18,
      absent: 1,
      late: 1,
      total: 20,
    },
    homeworkSummary: {
      assigned: 45,
      completed: 42,
      onTime: 38,
      late: 4,
      pending: 3,
      completionRate: 93,
    },
    performanceBySubject: [
      { subject: 'Mathematics', quizzes: 8, avgScore: 88, trend: 'improving' as const },
      { subject: 'Science', quizzes: 7, avgScore: 82, trend: 'improving' as const },
      { subject: 'English', quizzes: 6, avgScore: 85, trend: 'steady' as const },
      { subject: 'Social Studies', quizzes: 5, avgScore: 78, trend: 'steady' as const },
      { subject: 'Hindi', quizzes: 4, avgScore: 72, trend: 'needs-attention' as const },
      { subject: 'Computer Science', quizzes: 3, avgScore: 92, trend: 'improving' as const },
    ],
    skillGrowth: [
      { skill: 'Problem Solving', currentLevel: 85, change: 12, subject: 'Mathematics' },
      { skill: 'Critical Thinking', currentLevel: 80, change: 8, subject: 'Science' },
      { skill: 'Reading Comprehension', currentLevel: 88, change: 2, subject: 'English' },
      { skill: 'Written Expression', currentLevel: 82, change: -5, subject: 'English' },
      { skill: 'Analytical Skills', currentLevel: 76, change: 6, subject: 'Social Studies' },
      { skill: 'Grammar & Syntax', currentLevel: 68, change: -3, subject: 'Hindi' },
    ],
    highlights: [
      'Strong month overall with 90% attendance',
      'Consistent improvement in Mathematics and Science',
      'Computer Science remains strongest subject',
      'Need additional support in Hindi',
      'Homework completion rate is excellent at 93%',
    ],
    teacherComments: [
      { subject: 'Mathematics', comment: 'Excellent progress in algebra. Keep up the good work!' },
      { subject: 'Science', comment: 'Shows curiosity and asks thoughtful questions' },
      { subject: 'Hindi', comment: 'Needs regular practice in grammar. Please encourage reading Hindi books at home.' },
    ],
    areasOfImprovement: [
      {
        subject: 'Hindi',
        currentScore: 72,
        suggestions: [
          'Practice grammar exercises daily for 15 minutes',
          'Read one Hindi story book per week',
          'Watch Hindi educational videos to improve vocabulary',
        ],
      },
      {
        subject: 'Written Expression',
        currentScore: 82,
        suggestions: [
          'Maintain a daily journal',
          'Practice essay writing on diverse topics',
          'Review and edit written work before submission',
        ],
      },
    ],
  };

  // AI Discussion Suggestions
  // AI Discussion Suggestions derived from todays lessons
  const aiDiscussionSuggestions: AIDiscussionSuggestion[] = lessons
    .filter(l => l.date === todayDate)
    .map(l => ({
      id: `ai-${l.id}`,
      subject: l.subject,
      topic: l.topic,
      recentLesson: l.topic,
      conversationStarter: `I heard you learned about ${l.topic} in ${l.subject} today! Can you explain what you found most interesting?`,
      keyQuestions: [
        `What were the key objectives of the ${l.subject} lesson?`,
        `How can you apply what you learned about ${l.topic} in real life?`,
      ],
      realLifeConnection: `Connect the concepts of ${l.topic} to daily experiences.`,
      encouragementTip: `Excellent work participating in the ${l.subject} class!`,
      difficulty: 'moderate' as const,
    }));

  // Fallback to static suggestions if no lessons today
  if (aiDiscussionSuggestions.length === 0) {
    aiDiscussionSuggestions.push({
      id: 'demo-ai-1',
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      recentLesson: 'Solving quadratic equations by factorization',
      conversationStarter: 'I heard you learned about quadratic equations today! Can you explain what makes an equation "quadratic"?',
      keyQuestions: ['Can you show me how to solve a simple quadratic equation?'],
      realLifeConnection: 'Quadratic equations are used in calculating areas of land and video game physics.',
      encouragementTip: 'Praise his understanding and encourage him to keep practicing.',
      difficulty: 'moderate',
    });
  }

  const renderReports = () => {
    const reportData = selectedReportPeriod === 'weekly' ? weeklyReportData : monthlyReportData;
    const attendancePercentage = Math.round(
      (reportData.attendanceSummary.present / reportData.attendanceSummary.total) * 100
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">Student Progress Reports</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Report Period Selector */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Select Report Period</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedReportPeriod('weekly')}
                className={`px-4 py-2 rounded-lg transition-colors ${selectedReportPeriod === 'weekly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Weekly Report
              </button>
              <button
                onClick={() => setSelectedReportPeriod('monthly')}
                className={`px-4 py-2 rounded-lg transition-colors ${selectedReportPeriod === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Monthly Report
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-700">
              Report Period: <strong>{reportData.period}</strong>
            </p>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Student Overview */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Student Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-gray-700 mb-1">Student Name</p>
              <p className="text-gray-900">{selectedChild.name}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-gray-700 mb-1">Class</p>
              <p className="text-gray-900">
                {selectedChild.class} - {selectedChild.section}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-gray-700 mb-1">Roll Number</p>
              <p className="text-gray-900">{selectedChild.rollNo}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-gray-700 mb-1">Report Period</p>
              <p className="text-gray-900 capitalize">{selectedReportPeriod}</p>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Attendance Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-1">Total Days</p>
              <p className="text-2xl text-gray-900">{reportData.attendanceSummary.total}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-600 mb-1">Present</p>
              <p className="text-2xl text-green-600">{reportData.attendanceSummary.present}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-gray-600 mb-1">Absent</p>
              <p className="text-2xl text-red-600">{reportData.attendanceSummary.absent}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-gray-600 mb-1">Late</p>
              <p className="text-2xl text-orange-600">{reportData.attendanceSummary.late}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-gray-600 mb-1">Attendance %</p>
              <p className="text-2xl text-purple-600">{attendancePercentage}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full"
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Homework Completion */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Homework Completion
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-1">Assigned</p>
              <p className="text-2xl text-gray-900">{reportData.homeworkSummary.assigned}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-600 mb-1">Completed</p>
              <p className="text-2xl text-green-600">{reportData.homeworkSummary.completed}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-600 mb-1">On Time</p>
              <p className="text-2xl text-blue-600">{reportData.homeworkSummary.onTime}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-gray-600 mb-1">Late</p>
              <p className="text-2xl text-orange-600">{reportData.homeworkSummary.late}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-gray-600 mb-1">Pending</p>
              <p className="text-2xl text-red-600">{reportData.homeworkSummary.pending}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-gray-600 mb-1">Rate</p>
              <p className="text-2xl text-purple-600">{reportData.homeworkSummary.completionRate}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${reportData.homeworkSummary.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Performance Trends by Subject */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Performance Trends by Subject
          </h3>
          <div className="space-y-4">
            {reportData.performanceBySubject.map((subject) => (
              <div key={subject.subject} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-gray-900">{subject.subject}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${subject.trend === 'improving'
                        ? 'bg-green-100 text-green-700'
                        : subject.trend === 'steady'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                        }`}
                    >
                      {subject.trend === 'improving' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : subject.trend === 'steady' ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {subject.trend === 'improving'
                        ? 'Improving'
                        : subject.trend === 'steady'
                          ? 'Steady'
                          : 'Needs Attention'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-gray-900">{subject.avgScore}%</p>
                    <p className="text-gray-600 text-sm">{subject.quizzes} quizzes</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${subject.avgScore >= 80
                      ? 'bg-green-600'
                      : subject.avgScore >= 60
                        ? 'bg-blue-600'
                        : 'bg-orange-600'
                      }`}
                    style={{ width: `${subject.avgScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Growth Analysis */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Skill Growth Analysis
          </h3>
          <div className="space-y-4">
            {reportData.skillGrowth.map((skill) => (
              <div key={skill.skill} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-gray-900 mb-1">{skill.skill}</h4>
                    <p className="text-gray-600 text-sm">{skill.subject}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl text-gray-900">{skill.currentLevel}%</p>
                      <div className="flex items-center gap-1">
                        {skill.change > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 text-sm">+{skill.change}%</span>
                          </>
                        ) : skill.change < 0 ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 text-sm">{skill.change}%</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-600 text-sm">No change</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${skill.change > 0
                      ? 'bg-green-600'
                      : skill.change < 0
                        ? 'bg-orange-600'
                        : 'bg-blue-600'
                      }`}
                    style={{ width: `${skill.currentLevel}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            Key Highlights
          </h3>
          <ul className="space-y-2">
            {reportData.highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Star className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-900">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Teacher Comments */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Teacher Comments
          </h3>
          <div className="space-y-3">
            {reportData.teacherComments.map((comment, idx) => (
              <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-blue-900 font-medium mb-1">{comment.subject}</p>
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Areas of Improvement (Monthly only) */}
        {selectedReportPeriod === 'monthly' && monthlyReportData.areasOfImprovement && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-600" />
              Areas of Improvement & Suggestions
            </h3>
            <div className="space-y-4">
              {monthlyReportData.areasOfImprovement.map((area, idx) => (
                <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900">{area.subject}</h4>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      Current: {area.currentScore}%
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2 font-medium">Recommended Actions:</p>
                  <ul className="space-y-2">
                    {area.suggestions.map((suggestion, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 text-gray-700">
                        <Target className="w-4 h-4 text-orange-600 flex-shrink-0 mt-1" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Button */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white mb-2">Download Complete Report</h3>
              <p className="text-purple-100">
                Get a comprehensive PDF report with all details and insights
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
              <FileText className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const completedQuizzes = effectiveActivities.filter((a) => a.quizCompleted).length;
    const pendingQuizzes = effectiveActivities.filter(
      (a) => a.quizAssigned && !a.quizCompleted
    ).length;
    const averageScore =
      effectiveActivities
        .filter((a) => a.quizScore)
        .reduce((sum, a) => sum + (a.quizScore || 0), 0) /
      (effectiveActivities.filter((a) => a.quizScore).length || 1);

    return (
      <div className="space-y-6">
        {/* Child Info Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white mb-1">{selectedChild.name}</h2>
              <p className="text-purple-100">
                Class {selectedChild.class} - Section {selectedChild.section} • Roll No:{' '}
                {selectedChild.rollNo}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Quick Summary */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Today's Summary</h3>
            <p className="text-gray-600">{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Attendance */}
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-gray-700">Attendance</p>
              </div>
              <p className="text-2xl text-green-600 capitalize">{todayAttendance.status}</p>
              {todayAttendance.time && (
                <p className="text-gray-600 text-sm">at {todayAttendance.time}</p>
              )}
            </div>

            {/* Lessons */}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <p className="text-gray-700">Lessons Today</p>
              </div>
              <p className="text-2xl text-blue-600">{effectiveActivities.length}</p>
              <p className="text-gray-600 text-sm">topics covered</p>
            </div>

            {/* Quizzes */}
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <p className="text-gray-700">Quizzes</p>
              </div>
              <p className="text-2xl text-purple-600">
                {completedQuizzes}/{effectiveActivities.filter((a) => a.quizAssigned).length}
              </p>
              <p className="text-gray-600 text-sm">completed</p>
            </div>

            {/* Performance */}
            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <p className="text-gray-700">Avg Score</p>
              </div>
              <p className="text-2xl text-yellow-600">
                {averageScore ? Math.round(averageScore) : '—'}%
              </p>
              <p className="text-gray-600 text-sm">today</p>
            </div>
          </div>
        </div>

        {/* AI Suggestions Feature Highlight */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <Brain className="w-12 h-12 text-purple-200 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-white mb-2 flex items-center gap-2">
                ✨ New Feature: AI Discussion Suggestions
              </h3>
              <p className="text-purple-100 mb-3">
                Get personalized conversation starters for today's lessons! Our AI analyzes what {selectedChild.name} learned
                and suggests meaningful ways to discuss it at home.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setCurrentView('ai-suggestions')}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                >
                  View {aiDiscussionSuggestions.length} Suggestions
                </button>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Based on today's {todayActivities.length} lessons</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Learning */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">What My Child Learned Today</h3>
          <div className="space-y-4">
            {effectiveActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {activity.subject}
                      </span>
                      {activity.quizAssigned && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${activity.quizCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                            }`}
                        >
                          {activity.quizCompleted ? 'Quiz Completed' : 'Quiz Pending'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-gray-900 mb-2">{activity.topic}</h4>
                    <ul className="space-y-1">
                      {activity.objectives.map((objective, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <Target className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {activity.quizScore !== undefined && (
                    <div className="ml-4 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex flex-col items-center justify-center text-white">
                        <span className="text-2xl font-bold">{activity.quizScore}</span>
                        <span className="text-xs">/ {activity.quizTotal}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {Math.round((activity.quizScore / (activity.quizTotal || 1)) * 100)}%
                      </p>
                    </div>
                  )}
                </div>

                {activity.teacherNote && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-blue-900 text-sm font-medium mb-1">Teacher's Note</p>
                        <p className="text-gray-700">{activity.teacherNote}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Suggestions */}
        {pendingQuizzes > 0 && (
          <div className="bg-orange-50 rounded-xl shadow-md p-6 border-l-4 border-orange-600">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-orange-900 mb-2">Action Required</h3>
                <p className="text-gray-700">
                  {pendingQuizzes} quiz{pendingQuizzes > 1 ? 'zes are' : ' is'} pending completion.
                  Please encourage your child to complete {pendingQuizzes > 1 ? 'them' : 'it'}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setCurrentView('timeline')}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-gray-900">View Timeline</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setCurrentView('progress')}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-gray-900">Progress Tracking</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setCurrentView('ai-suggestions')}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-purple-200"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <span className="text-gray-900 block font-medium">AI Suggestions</span>
                <span className="text-gray-600 text-xs">{aiDiscussionSuggestions.length} tips available</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setCurrentView('reports')}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-orange-600" />
              <span className="text-gray-900">View Reports</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setCurrentView('fees')}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-gray-900">Pay Fees</span>
              {totalDue > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                  ₹{totalDue} due
                </span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    const groupedByDate = weekTimeline.reduce((acc, activity) => {
      if (!acc[activity.date]) {
        acc[activity.date] = [];
      }
      acc[activity.date].push(activity);
      return acc;
    }, {} as Record<string, DailyActivity[]>);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">Learning Timeline</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, activities]) => (
              <div key={date} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h3 className="text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                </div>

                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              {activity.subject}
                            </span>
                            {activity.quizCompleted && activity.quizScore && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                Score: {activity.quizScore}/{activity.quizTotal}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 mb-2">{activity.topic}</p>
                          {activity.teacherNote && (
                            <p className="text-gray-600 text-sm italic">
                              Note: {activity.teacherNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">Progress Tracking</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Overall Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Overall Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-gray-700 mb-1">Average Score</p>
              <p className="text-3xl text-green-600">
                {Math.round(
                  progressData.reduce((sum, p) => sum + p.averageScore, 0) / progressData.length
                )}
                %
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-700 mb-1">Total Quizzes</p>
              <p className="text-3xl text-blue-600">
                {progressData.reduce((sum, p) => sum + p.totalQuizzes, 0)}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-gray-700 mb-1">Strong Subjects</p>
              <p className="text-3xl text-yellow-600">
                {progressData.filter((p) => p.averageScore >= 80).length}
              </p>
            </div>
          </div>
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Subject-wise Performance</h3>
          <div className="space-y-4">
            {progressData.map((subject) => (
              <div key={subject.subject} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-gray-900">{subject.subject}</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${subject.trend === 'improving'
                        ? 'bg-green-100 text-green-700'
                        : subject.trend === 'steady'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                        }`}
                    >
                      {subject.trend === 'improving'
                        ? '📈 Improving'
                        : subject.trend === 'steady'
                          ? '➡️ Steady'
                          : '⚠️ Needs Attention'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-gray-600 text-sm">Average Score</p>
                    <p className="text-gray-900">{subject.averageScore}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Last Score</p>
                    <p className="text-gray-900">{subject.lastScore}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Quizzes</p>
                    <p className="text-gray-900">{subject.totalQuizzes}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${subject.averageScore >= 80
                      ? 'bg-green-600'
                      : subject.averageScore >= 60
                        ? 'bg-blue-600'
                        : 'bg-orange-600'
                      }`}
                    style={{ width: `${subject.averageScore}%` }}
                  ></div>
                </div>

                {subject.trend === 'needs-attention' && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-gray-700 text-sm">
                      💡 <strong>Suggestion:</strong> Encourage practice in {subject.subject}.
                      Consider reviewing recent topics together.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Strengths and Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Strengths
            </h3>
            <div className="space-y-2">
              {progressData
                .filter((p) => p.averageScore >= 80)
                .map((subject) => (
                  <div
                    key={subject.subject}
                    className="p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <p className="text-gray-900">{subject.subject}</p>
                    <p className="text-gray-600 text-sm">{subject.averageScore}% average</p>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Areas to Focus
            </h3>
            <div className="space-y-2">
              {progressData
                .filter((p) => p.averageScore < 80)
                .map((subject) => (
                  <div
                    key={subject.subject}
                    className="p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <p className="text-gray-900">{subject.subject}</p>
                    <p className="text-gray-600 text-sm">{subject.averageScore}% average</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFees = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">Fee Management</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Fee Summary */}
        {totalDue > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 mb-1">Total Amount Due</p>
                <h2 className="text-white mb-2">₹{totalDue.toLocaleString()}</h2>
                <p className="text-red-100">
                  {pendingFees.length} pending payment{pendingFees.length > 1 ? 's' : ''}
                </p>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <CreditCard className="w-5 h-5" />
                Pay Now
              </button>
            </div>
          </div>
        )}

        {/* Pending Fees */}
        {pendingFees.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4">Pending Payments</h3>
            <div className="space-y-3">
              {pendingFees.map((fee) => (
                <div
                  key={fee.id}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1">{fee.feeHead}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">Due: {fee.dueDate}</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                          {fee.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl text-gray-900">₹{fee.amount.toLocaleString()}</p>
                      <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                        Pay Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600">Fee Head</th>
                  <th className="px-6 py-3 text-left text-gray-600">Amount</th>
                  <th className="px-6 py-3 text-left text-gray-600">Paid Date</th>
                  <th className="px-6 py-3 text-left text-gray-600">Receipt No</th>
                  <th className="px-6 py-3 text-left text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feeRecords
                  .filter((f) => f.status === 'paid')
                  .map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{fee.feeHead}</td>
                      <td className="px-6 py-4 text-gray-900">₹{fee.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-700">{fee.paidDate}</td>
                      <td className="px-6 py-4 text-gray-700">{fee.receiptNo}</td>
                      <td className="px-6 py-4">
                        <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">Notifications</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${notification.read
                ? 'bg-white border-gray-200'
                : 'bg-blue-50 border-blue-300'
                }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${notification.type === 'attendance'
                    ? 'bg-green-100'
                    : notification.type === 'progress'
                      ? 'bg-blue-100'
                      : notification.type === 'fee'
                        ? 'bg-orange-100'
                        : 'bg-purple-100'
                    }`}
                >
                  {notification.type === 'attendance' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : notification.type === 'progress' ? (
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  ) : notification.type === 'fee' ? (
                    <DollarSign className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-gray-900 mb-1">{notification.title}</h4>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  <p className="text-gray-600 text-sm">{notification.date}</p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAISuggestions = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">AI Discussion Suggestions</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <Brain className="w-12 h-12 text-purple-200 flex-shrink-0" />
            <div>
              <h3 className="text-white mb-2">AI-Powered Parent Guidance</h3>
              <p className="text-purple-100 mb-3">
                Get personalized conversation starters and discussion topics based on what your child is learning in school.
                These AI-generated suggestions help you engage meaningfully with your child's education.
              </p>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Based on recent lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Real-life connections</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Personalized for {selectedChild.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Suggestions */}
        <div className="space-y-6">
          {aiDiscussionSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white rounded-xl shadow-md p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {suggestion.subject}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${suggestion.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : suggestion.difficulty === 'moderate'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                        }`}
                    >
                      {suggestion.difficulty === 'easy'
                        ? '✅ Easy to discuss'
                        : suggestion.difficulty === 'moderate'
                          ? '📖 Moderate depth'
                          : '🎯 Challenging topic'}
                    </span>
                  </div>
                  <h3 className="text-gray-900 mb-1">{suggestion.topic}</h3>
                  <p className="text-gray-600 text-sm">Recent Lesson: {suggestion.recentLesson}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-600 flex-shrink-0" />
              </div>

              {/* Conversation Starter */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-purple-600">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-purple-900 font-medium mb-2">💬 Start the conversation:</p>
                    <p className="text-gray-700 italic">"{suggestion.conversationStarter}"</p>
                  </div>
                </div>
              </div>

              {/* Key Questions */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-blue-900 font-medium mb-3">❓ Key Questions to Ask:</p>
                    <ul className="space-y-2">
                      {suggestion.keyQuestions.map((question, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Real-Life Connection */}
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-green-900 font-medium mb-2">🌍 Real-Life Connection:</p>
                    <p className="text-gray-700">{suggestion.realLifeConnection}</p>
                  </div>
                </div>
              </div>

              {/* Encouragement Tip */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-yellow-900 font-medium mb-2">⭐ Encouragement Tip:</p>
                    <p className="text-gray-700">{suggestion.encouragementTip}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips for Effective Discussions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            Tips for Effective Parent-Child Discussions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-900 font-medium mb-2">✅ Do:</p>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li>• Listen actively without interrupting</li>
                <li>• Ask open-ended questions</li>
                <li>• Show genuine interest in their learning</li>
                <li>• Celebrate small achievements</li>
                <li>• Make connections to real life</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-orange-900 font-medium mb-2">❌ Don't:</p>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li>• Compare with other children</li>
                <li>• Criticize for not knowing answers</li>
                <li>• Rush through conversations</li>
                <li>• Make it feel like a test</li>
                <li>• Ignore their perspective</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'timeline':
        return renderTimeline();
      case 'progress':
        return renderProgress();
      case 'fees':
        return renderFees();
      case 'notifications':
        return renderNotifications();
      case 'reports':
        return renderReports();
      case 'ai-suggestions':
        return renderAISuggestions();
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
              <h1 className="text-white mb-1">Parent Portal</h1>
              <p className="text-purple-200 text-sm">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('notifications')}
              className="p-2 hover:bg-purple-700 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
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
        items={parentNavItems}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">{renderContent()}</main>
    </div>
  );
}
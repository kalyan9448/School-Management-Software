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
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import {
  studentsStore,
  attendanceStore,
  lessonsStore,
  quizzesStore,
  quizResultsStore,
  studentNotesStore,
} from '../utils/dataStore';
import { TeachingFlowScreen } from './TeachingFlowScreen';
import { DashboardNav, teacherNavItems } from './DashboardNav';

type ViewType =
  | 'dashboard'
  | 'my-classes'
  | 'attendance'
  | 'lesson-log'
  | 'teaching-flow'
  | 'quiz-creation'
  | 'quiz-review'
  | 'student-notes'
  | 'performance';

interface ClassInfo {
  id: string;
  class: string;
  section: string;
  subject: string;
  students: number;
  time: string;
}

interface Student {
  id: string;
  name: string;
  rollNo: string;
  attendance: 'present' | 'absent' | 'late' | null;
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

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResult {
  studentName: string;
  score: number;
  total: number;
  attempted: boolean;
  weakAreas: string[];
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

  // Demo data
  const myClasses: ClassInfo[] = [
    {
      id: '1',
      class: 'Class 6',
      section: 'A',
      subject: 'Mathematics',
      students: 35,
      time: '09:00 AM - 10:00 AM',
    },
    {
      id: '2',
      class: 'Class 6',
      section: 'B',
      subject: 'Mathematics',
      students: 33,
      time: '10:00 AM - 11:00 AM',
    },
    {
      id: '3',
      class: 'Class 7',
      section: 'A',
      subject: 'Science',
      students: 30,
      time: '09:00 AM - 10:00 AM',
    },
    {
      id: '4',
      class: 'Class 7',
      section: 'B',
      subject: 'Science',
      students: 32,
      time: '10:00 AM - 11:00 AM',
    },
    {
      id: '5',
      class: 'Class 8',
      section: 'A',
      subject: 'English',
      students: 30,
      time: '11:00 AM - 12:00 PM',
    },
    {
      id: '6',
      class: 'Class 8',
      section: 'B',
      subject: 'English',
      students: 28,
      time: '01:00 PM - 02:00 PM',
    },
  ];

  const todaySchedule = [
    { time: '09:00 AM', class: 'Class 6-A', subject: 'Mathematics', status: 'upcoming' },
    { time: '10:00 AM', class: 'Class 7-B', subject: 'Science', status: 'upcoming' },
    { time: '11:00 AM', class: 'Class 8-A', subject: 'English', status: 'upcoming' },
    { time: '01:00 PM', class: 'Class 6-A', subject: 'Social Studies', status: 'upcoming' },
    { time: '02:00 PM', class: 'Class 7-B', subject: 'Computer', status: 'upcoming' },
  ];

  const [allStudents, setAllStudents] = useState<Student[]>([
    // Class 6 - Section A
    { id: '1', name: 'Aarav Patel', rollNo: '001', attendance: null, class: 'Class 6', section: 'A' },
    { id: '2', name: 'Diya Sharma', rollNo: '002', attendance: null, class: 'Class 6', section: 'A' },
    { id: '3', name: 'Arjun Singh', rollNo: '003', attendance: null, class: 'Class 6', section: 'A' },
    { id: '4', name: 'Anaya Gupta', rollNo: '004', attendance: null, class: 'Class 6', section: 'A' },
    // Class 6 - Section B
    { id: '5', name: 'Vivaan Kumar', rollNo: '005', attendance: null, class: 'Class 6', section: 'B' },
    { id: '6', name: 'Saanvi Reddy', rollNo: '006', attendance: null, class: 'Class 6', section: 'B' },
    { id: '7', name: 'Ishaan Verma', rollNo: '007', attendance: null, class: 'Class 6', section: 'B' },
    { id: '8', name: 'Aanya Rao', rollNo: '008', attendance: null, class: 'Class 6', section: 'B' },
    // Class 7 - Section A
    { id: '9', name: 'Reyansh Khanna', rollNo: '009', attendance: null, class: 'Class 7', section: 'A' },
    { id: '10', name: 'Myra Joshi', rollNo: '010', attendance: null, class: 'Class 7', section: 'A' },
    { id: '11', name: 'Kabir Mehta', rollNo: '011', attendance: null, class: 'Class 7', section: 'A' },
    { id: '12', name: 'Aadhya Desai', rollNo: '012', attendance: null, class: 'Class 7', section: 'A' },
    // Class 7 - Section B
    { id: '13', name: 'Vihaan Chopra', rollNo: '013', attendance: null, class: 'Class 7', section: 'B' },
    { id: '14', name: 'Ira Malhotra', rollNo: '014', attendance: null, class: 'Class 7', section: 'B' },
    { id: '15', name: 'Atharv Shah', rollNo: '015', attendance: null, class: 'Class 7', section: 'B' },
    { id: '16', name: 'Navya Kapoor', rollNo: '016', attendance: null, class: 'Class 7', section: 'B' },
    // Class 8 - Section A
    { id: '17', name: 'Aditya Rao', rollNo: '017', attendance: null, class: 'Class 8', section: 'A' },
    { id: '18', name: 'Kiara Nair', rollNo: '018', attendance: null, class: 'Class 8', section: 'A' },
    { id: '19', name: 'Dhruv Iyer', rollNo: '019', attendance: null, class: 'Class 8', section: 'A' },
    { id: '20', name: 'Pihu Agarwal', rollNo: '020', attendance: null, class: 'Class 8', section: 'A' },
    // Class 8 - Section B
    { id: '21', name: 'Ayaan Bose', rollNo: '021', attendance: null, class: 'Class 8', section: 'B' },
    { id: '22', name: 'Anvi Sinha', rollNo: '022', attendance: null, class: 'Class 8', section: 'B' },
    { id: '23', name: 'Rudra Pillai', rollNo: '023', attendance: null, class: 'Class 8', section: 'B' },
    { id: '24', name: 'Prisha Bansal', rollNo: '024', attendance: null, class: 'Class 8', section: 'B' },
  ]);

  const [students, setStudents] = useState<Student[]>([]);

  const [lessonForm, setLessonForm] = useState({
    topic: '',
    objectives: [] as string[],
    studentsNeedingAttention: [] as string[],
    notes: '',
    teachingDepth: 'Moderate' as 'Basic' | 'Moderate' | 'Advanced',
    aiSuggestions: [] as string[],
  });

  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [generatingHomework, setGeneratingHomework] = useState(false);
  const [homeworkPreview, setHomeworkPreview] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);

  // Load previously marked attendance when date/class/section changes
  useEffect(() => {
    if (attendanceClassFilter && attendanceSectionFilter && attendanceDate) {
      // Get students for the selected class and section
      const classStudents = allStudents.filter(
        student =>
          student.class === attendanceClassFilter &&
          student.section === attendanceSectionFilter
      );

      // Load previously marked attendance for this date
      const previouslyMarked = attendanceStore.getByDate(attendanceDate);

      // Check if attendance already exists for this class/section/date
      const hasExistingAttendance = previouslyMarked.some(record => {
        const student = allStudents.find(s => s.id === record.studentId);
        return student &&
          student.class === attendanceClassFilter &&
          student.section === attendanceSectionFilter;
      });

      // Merge students with previously marked attendance
      const studentsWithAttendance = classStudents.map(student => {
        const existingRecord = previouslyMarked.find(r => r.studentId === student.id);
        return {
          ...student,
          attendance: existingRecord ? existingRecord.status : null,
        };
      });

      setStudents(studentsWithAttendance);
    }
  }, [attendanceDate, attendanceClassFilter, attendanceSectionFilter]);

  const predefinedObjectives = [
    'Understand fundamental concepts and definitions',
    'Apply formulas and solve numerical problems',
    'Analyze and interpret data or text',
    'Develop critical thinking and reasoning skills',
    'Comprehend and explain key theories',
    'Demonstrate practical application of concepts',
    'Evaluate and compare different approaches',
    'Create solutions to complex problems',
  ];

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

  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([
    {
      id: '1',
      question: 'What color is the sun?',
      options: ['Red', 'Yellow', 'Blue', 'Green'],
      correctAnswer: 1,
      difficulty: 'easy',
    },
    {
      id: '2',
      question: 'How many fingers do you have on one hand?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 2,
      difficulty: 'easy',
    },
    {
      id: '3',
      question: 'Which shape has 3 sides?',
      options: ['Circle', 'Square', 'Triangle', 'Rectangle'],
      correctAnswer: 2,
      difficulty: 'medium',
    },
  ]);

  const quizResults: QuizResult[] = [
    { studentName: 'Aarav Patel', score: 8, total: 10, attempted: true, weakAreas: ['Shapes'] },
    { studentName: 'Diya Sharma', score: 10, total: 10, attempted: true, weakAreas: [] },
    { studentName: 'Arjun Singh', score: 6, total: 10, attempted: true, weakAreas: ['Colors', 'Numbers'] },
    { studentName: 'Ananya Gupta', score: 0, total: 10, attempted: false, weakAreas: [] },
  ];

  // Demo logged lessons data
  const [demoLessons] = useState<LessonLog[]>([
    {
      id: '1',
      date: '2026-02-24',
      class: 'Class 6',
      section: 'A',
      subject: 'Mathematics',
      topic: 'Linear Equations in One Variable',
      objectives: [
        'Understand the concept of variables and constants',
        'Solve simple linear equations',
        'Apply equations to real-world problems'
      ],
      studentsNeedingAttention: ['Arjun Singh', 'Anaya Gupta'],
      notes: 'Students showed good understanding. Need more practice with word problems.',
    },
    {
      id: '2',
      date: '2026-02-23',
      class: 'Class 6',
      section: 'A',
      subject: 'Mathematics',
      topic: 'Rational Numbers and Properties',
      objectives: [
        'Identify rational numbers',
        'Understand properties of rational numbers',
        'Perform operations on rational numbers'
      ],
      studentsNeedingAttention: [],
      notes: 'Excellent participation. Quiz assigned.',
    },
    {
      id: '3',
      date: '2026-02-24',
      class: 'Class 7',
      section: 'B',
      subject: 'Science',
      topic: 'Chemical Reactions and Equations',
      objectives: [
        'Understand types of chemical reactions',
        'Write and balance chemical equations',
        'Identify reactants and products'
      ],
      studentsNeedingAttention: ['Vihaan Chopra'],
      notes: 'Lab demonstration was effective. Students enjoyed the practical session.',
    },
    {
      id: '4',
      date: '2026-02-23',
      class: 'Class 7',
      section: 'B',
      subject: 'Science',
      topic: 'Electricity and Magnetism',
      objectives: [
        'Understand basic concepts of electricity',
        'Explain magnetic fields and forces',
        'Relate electricity and magnetism'
      ],
      studentsNeedingAttention: [],
      notes: 'Used circuit diagrams effectively. Students understood the concepts well.',
    },
    {
      id: '5',
      date: '2026-02-25',
      class: 'Class 8',
      section: 'A',
      subject: 'English',
      topic: 'Grammar: Active and Passive Voice',
      objectives: [
        'Identify active and passive voice',
        'Convert sentences between voices',
        'Use appropriate voice in writing'
      ],
      studentsNeedingAttention: ['Dhruv Iyer'],
      notes: 'Practice exercises completed. Students need more examples.',
    },
    {
      id: '6',
      date: '2026-02-21',
      class: 'Class 6',
      section: 'A',
      subject: 'Social Studies',
      topic: 'Democracy and Constitutional Rights',
      objectives: [
        'Understand the concept of democracy',
        'Learn about fundamental rights',
        'Discuss constitutional values'
      ],
      studentsNeedingAttention: [],
      notes: 'Group discussion was very engaging. Students showed great interest.',
    },
  ]);

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
    attendanceStore.save(attendanceRecords);

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
    const lesson = lessonsStore.create({
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

    // Create quiz for this lesson
    const quiz = quizzesStore.create({
      lessonId: lesson.id,
      classId: selectedClass.id,
      class: selectedClass.class,
      section: selectedClass.section,
      subject: lesson.subject,
      topic: lesson.topic,
      questions: generatedQuestions,
      assignedBy: user?.name || 'Teacher',
    });

    alert('Lesson logged and quiz created successfully!');

    // Reset form
    setLessonForm({
      topic: '',
      objectives: [],
      studentsNeedingAttention: [],
      notes: '',
    });

    setCurrentView('quiz-creation');
  };

  const handleAssignQuiz = () => {
    alert('Quiz assigned to class successfully! Parents will be notified when students complete it.');
    setCurrentView('dashboard');
  };

  const renderDashboard = () => {
    // Calculate real stats from dataStore with safe defaults
    let presentCount = 0;
    let weekLessons = [];
    let quizzesNeedingReview = [];

    try {
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceStore.getByDate(today);
      presentCount = todayAttendance.filter((a) => a.status === 'present').length;

      // Get lessons logged this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekLessons = lessonsStore.getAll().filter(lesson => {
        const lessonDate = new Date(lesson.date);
        return lessonDate >= weekStart;
      });

      // Get quizzes pending review
      const allQuizzes = quizzesStore.getAll();
      quizzesNeedingReview = allQuizzes.filter(quiz => {
        const results = quizResultsStore.getByQuiz(quiz.id);
        const totalStudents = studentsStore.getByClass(quiz.class, quiz.section).length;
        return results.length < totalStudents; // Not all students completed
      });
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
                <p className="text-gray-600 text-sm">This week</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Quizzes Active Card */}
          <div className="bg-white rounded-xl border-2 border-blue-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              setSelectedClass(myClasses[0]);
              setCurrentView('quiz-review');
            }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-1">Quizzes Active</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{quizzesNeedingReview.length}</h3>
                <p className="text-gray-600 text-sm">Pending review</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
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
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setCurrentView('quiz-review');
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Review Quiz
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setCurrentView('performance');
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logged Lessons */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Recent Logged Lessons</h3>
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
            {lessonsStore.getAll().slice(0, 5).length > 0 ? (
              lessonsStore.getAll().slice(0, 5).map((lesson: any) => (
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
  const getUniqueClasses = () => {
    const classes = [...new Set(myClasses.map(c => c.class))];
    return classes.sort();
  };

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
    const lesson = lessonsStore.create({
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
      // Combine demo lessons with stored lessons
      const storedLessons = lessonsStore.getAll();
      const allLessonsData = [...demoLessons, ...storedLessons];

      // Filter lessons by selected class and subject
      const filteredLessons = allLessonsData.filter(lesson => {
        const classMatch = !selectedLessonClass ||
          (lesson.class === selectedLessonClass.class && lesson.section === selectedLessonClass.section);
        const subjectMatch = selectedSubject === 'All Subjects' || lesson.subject === selectedSubject;
        return classMatch && subjectMatch;
      });

      // Sort by date (most recent first)
      const sortedLessons = filteredLessons.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

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
              <div className="space-y-3">
                {sortedLessons.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                  >
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
                            <span>{new Date(lesson.date).toLocaleDateString()}</span>
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
                ))}
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

        {/* Topic Input */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-gray-700 font-semibold mb-3">🎯 Topic Covered *</label>
          <input
            type="text"
            value={lessonForm.topic}
            onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
            placeholder="e.g., Linear Equations in One Variable"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Curriculum Objectives */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="space-y-4">

            <label className="block text-gray-700 font-semibold mb-3">🎯 Learning Objectives *</label>
            <p className="text-gray-600 text-sm mb-4">
              Select the learning objectives covered in this lesson
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predefinedObjectives.map((objective, index) => (
                <label
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${lessonForm.objectives.includes(objective)
                    ? 'bg-purple-50 border-purple-400 shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:bg-purple-50 hover:border-purple-200'
                    }`}
                >
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
                </label>
              ))}
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

  const renderQuizCreation = () => {
    if (!selectedClass) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 mb-1">Review & Assign Quiz</h2>
            <p className="text-gray-600">
              Auto-generated quiz based on today's lesson
            </p>
          </div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Skip Quiz
          </button>
        </div>

        {/* Quiz Preview */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Quiz Questions</h3>
          <div className="space-y-4">
            {generatedQuestions.map((q, index) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">
                      <span className="font-medium">Q{index + 1}.</span> {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded ${optIndex === q.correctAnswer
                            ? 'bg-green-100 border border-green-600'
                            : 'bg-white border border-gray-300'
                            }`}
                        >
                          <span className="text-gray-700">
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {optIndex === q.correctAnswer && (
                              <span className="ml-2 text-green-600 text-sm">(Correct)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${q.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : q.difficulty === 'medium'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {q.difficulty}
                    </span>
                    <button className="p-2 hover:bg-gray-200 rounded-lg">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Options */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Assignment Options</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="radio" name="assignTo" defaultChecked className="w-4 h-4" />
              <span className="text-gray-700">Assign to entire class</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="assignTo" className="w-4 h-4" />
              <span className="text-gray-700">Assign to selected students</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={handleAssignQuiz}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Assign Quiz Now
          </button>
        </div>
      </div>
    );
  };

  const renderQuizReview = () => {
    if (!selectedClass) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 mb-1">Quiz Results</h2>
            <p className="text-gray-600">
              {selectedClass.class} - Section {selectedClass.section}
            </p>
          </div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-600">
            <p className="text-gray-600 mb-1">Attempted</p>
            <p className="text-2xl text-gray-900">
              {quizResults.filter((r) => r.attempted).length}/{quizResults.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-600">
            <p className="text-gray-600 mb-1">Average Score</p>
            <p className="text-2xl text-gray-900">
              {Math.round(
                quizResults.reduce((acc, r) => acc + (r.attempted ? r.score : 0), 0) /
                quizResults.filter((r) => r.attempted).length
              )}
              /10
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-600">
            <p className="text-gray-600 mb-1">Passed</p>
            <p className="text-2xl text-gray-900">
              {quizResults.filter((r) => r.score >= 6).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-600">
            <p className="text-gray-600 mb-1">Need Attention</p>
            <p className="text-2xl text-gray-900">
              {quizResults.filter((r) => r.weakAreas.length > 0).length}
            </p>
          </div>
        </div>

        {/* Student Results */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Student Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600">Student Name</th>
                  <th className="px-6 py-3 text-left text-gray-600">Score</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600">Weak Areas</th>
                  <th className="px-6 py-3 text-left text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quizResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{result.studentName}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${result.score >= 8
                          ? 'bg-green-100 text-green-700'
                          : result.score >= 6
                            ? 'bg-blue-100 text-blue-700'
                            : result.score > 0
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {result.attempted ? `${result.score}/${result.total}` : 'Not Attempted'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {result.attempted ? (
                        result.score >= 6 ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        )
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {result.weakAreas.length > 0 ? (
                        <div className="flex gap-1">
                          {result.weakAreas.map((area, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setCurrentView('student-notes')}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        Add Note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Insights & Recommendations</h3>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-900 mb-1">💡 Focus Area: Shapes</p>
              <p className="text-gray-600 text-sm">
                2 students struggled with shape identification. Consider re-teaching this concept.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-900 mb-1">✅ Strong Performance: Colors</p>
              <p className="text-gray-600 text-sm">
                All students who attempted answered color questions correctly.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-gray-900 mb-1">⚠️ Action Required</p>
              <p className="text-gray-600 text-sm">
                1 student hasn't attempted the quiz. Consider following up.
              </p>
            </div>
          </div>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">My Performance & Analytics</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4">Consistency Score</h3>
            <div className="text-center">
              <div className="text-5xl text-purple-600 mb-2">92%</div>
              <p className="text-gray-600">Excellent attendance logging</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4">Class Participation</h3>
            <div className="text-center">
              <div className="text-5xl text-green-600 mb-2">88%</div>
              <p className="text-gray-600">Students actively engaged</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4">Student Improvement</h3>
            <div className="text-center">
              <div className="text-5xl text-blue-600 mb-2">+15%</div>
              <p className="text-gray-600">Average score increase</p>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">This Week's Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Attendance Marked</span>
              <span className="text-gray-900">10/10 classes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Lessons Logged</span>
              <span className="text-gray-900">8 lessons</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Quizzes Created</span>
              <span className="text-gray-900">5 quizzes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Student Notes</span>
              <span className="text-gray-900">12 notes</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Insights</h3>
          <div className="space-y-3">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-900 mb-1">🎉 Great Job!</p>
              <p className="text-gray-600 text-sm">
                You've maintained 100% attendance logging for 3 consecutive weeks.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-900 mb-1">📈 Improving Trend</p>
              <p className="text-gray-600 text-sm">
                Student quiz scores have improved by 15% compared to last month.
              </p>
            </div>
          </div>
        </div>
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
                        // Navigate to quiz creation for this class
                        setSelectedClass(cls);
                        setCurrentView('quiz-creation');
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Brain className="w-4 h-4" />
                      Quiz
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('performance');
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
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
      case 'quiz-creation':
        return renderQuizCreation();
      case 'quiz-review':
        return renderQuizReview();
      case 'student-notes':
        return renderStudentNotes();
      case 'performance':
        return renderPerformance();
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
            <button className="p-2 hover:bg-purple-700 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
        items={teacherNavItems}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">{renderContent()}</main>
    </div>
  );
}
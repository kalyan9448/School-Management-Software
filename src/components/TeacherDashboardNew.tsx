import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

import { useAuth } from '../contexts/AuthContext';
import { useAIFeatureEnabled } from '../hooks/useAIFeatureEnabled';
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
  ChevronLeft,
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
  Star,
  Upload,
} from 'lucide-react';
import logoImage from '../assets/logo.jpeg';
import {
  studentService,
  attendanceService,
  lessonService,
  teacherService,
  timetableService,
  calendarService,
  notificationService,
  studentNoteService,
  subjectMappingService,
  Notification,
  CalendarEvent,
  TimetableSlot,
  StudentNote,
  CurriculumTag,
} from '../utils/centralDataService';
import { AttendanceOverview } from './AttendanceOverview';
import { TeachingFlowScreen } from './TeachingFlowScreen';
import { CalendarModule } from './CalendarModule';
import { TeacherMarksUpload } from './TeacherMarksUpload';
import { DashboardNav, teacherNavItems } from './DashboardNav';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { 
  performanceAnalyticsService, 
  TimeSeriesPoint, 
  InsightTrigger, 
  ClassDelta 
} from '../utils/performanceAnalytics';
import { TeacherPerformanceAnalytics } from './TeacherPerformanceAnalytics';
import { aiService } from '../services/aiService';
import { AILessonPlan } from '../types';

type ViewType =
  | 'dashboard'
  | 'my-classes'
  | 'attendance'
  | 'attendance-overview'
  | 'lesson-log'
  | 'teaching-flow'
  | 'student-notes'
  | 'performance'
  | 'marks-upload'
  | 'notifications'
  | 'calendar';

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
  aiPlan?: AILessonPlan;
}

export function TeacherDashboardNew() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as ViewType) || 'dashboard';
  
  const { user, logout } = useAuth();
  const { isEnabled: isAIEnabled, getDisabledMessage } = useAIFeatureEnabled();
  const { uniqueClasses } = useAcademicClasses();
  const [currentView, setCurrentView] = useState<ViewType>(initialView);

  // Weekly View State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const navigateWeek = (offset: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + offset * 7);
    setCurrentWeekStart(newDate);
  };

  const jumpToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const jumpToDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatDateForQuery = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sync view state to URL
  useEffect(() => {
    if (searchParams.get('view') !== currentView) {
      setSearchParams({ view: currentView });
    }
  }, [currentView, searchParams, setSearchParams]);

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
  const [todaySchedule, setTodaySchedule] = useState<{ startTime: string, endTime: string, class: string, subject: string }[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleDebug, setScheduleDebug] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allStudents, setAllStudents] = useState<LocalStudent[]>([]);
  const [todayStudents, setTodayStudents] = useState<LocalStudent[]>([]);
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // SaaS Performance State
  const [trends, setTrends] = useState<TimeSeriesPoint[]>([]);
  const [insightTriggers, setInsightTriggers] = useState<InsightTrigger[]>([]);
  const [classDelta, setClassDelta] = useState<ClassDelta | null>(null);

  // Dashboard stats state
  const [dashboardPresentCount, setDashboardPresentCount] = useState(0);
  const [dashboardWeekLessons, setDashboardWeekLessons] = useState<any[]>([]);
  const [lessonLogs, setLessonLogs] = useState<any[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [allTimetableSlots, setAllTimetableSlots] = useState<TimetableSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [availableCurriculumTags, setAvailableCurriculumTags] = useState<CurriculumTag[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Student Notes state
  const [selectedNoteStudentId, setSelectedNoteStudentId] = useState<string>('');
  const [selectedNoteType, setSelectedNoteType] = useState<'Achievement' | 'Concern' | 'Behavior'>('Behavior');
  const [noteContent, setNoteContent] = useState<string>('');
  const [recentNotes, setRecentNotes] = useState<StudentNote[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isHolidayToday, setIsHolidayToday] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState<CalendarEvent | null>(null);

  // Update currentTime every minute for period highlighting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.email) {
      const loadNotifications = async () => {
        const teacherClasses = user.classes?.filter((c): c is { class: string; section: string; subject: string } => typeof c !== 'string') || [];
        const userNotifications = await notificationService.getByUser(user.email, 'teacher', undefined, undefined, teacherClasses);
        setNotifications(userNotifications);
        setUnreadCount(await notificationService.getUnreadCount(user.email, 'teacher', undefined, undefined, teacherClasses));
      };

      loadNotifications();

      // Refresh notifications every 60 seconds
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadLessonLogs = async () => {
      if (!user?.email) {
        if (isMounted) {
          setLessonLogs([]);
          setLessonsLoading(false);
        }
        return;
      }

      setLessonsLoading(true);
      try {
        const endDate = new Date(currentWeekStart);
        endDate.setDate(currentWeekStart.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        const teacherLessons = await lessonService.getByDateRange(
          user.email,
          formatDateForQuery(currentWeekStart),
          formatDateForQuery(endDate)
        );
        if (isMounted) {
          setLessonLogs(teacherLessons);
        }
      } catch (error) {
        console.error('Error loading lesson logs:', error);
        if (isMounted) {
          setLessonLogs([]);
        }
      } finally {
        if (isMounted) {
          setLessonsLoading(false);
        }
      }
    };

    loadLessonLogs();

    const loadRecentNotes = async () => {
      if (!user?.email) return;
      try {
        const notes = await studentNoteService.getByTeacher(user.email);
        if (isMounted) setRecentNotes(notes);
      } catch (error) {
        console.error('Error loading recent notes:', error);
      }
    };
    loadRecentNotes();

    const loadCalendarInfo = async () => {
      try {
        const events = await calendarService.getUpcoming(3);
        if (isMounted) setUpcomingEvents(events);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const allEvents = await calendarService.getAll();
        const todayHoliday = allEvents.find(e => 
            e.type === 'holiday' && 
            todayStr >= e.startDate && 
            todayStr <= e.endDate
        );
        
        if (isMounted) {
            setIsHolidayToday(!!todayHoliday);
            setHolidayInfo(todayHoliday || null);
        }
      } catch (error) {
        console.error('Error loading calendar data:', error);
      }
    };
    loadCalendarInfo();

    return () => {
      isMounted = false;
    };
  }, [user?.email, currentWeekStart]);

  const handleSaveNote = async () => {
    if (!selectedNoteStudentId || !noteContent) {
      alert('Please select a student and enter note content.');
      return;
    }

    setIsSavingNote(true);
    try {
      const student = allStudents.find(s => s.id === selectedNoteStudentId);
      if (!student) throw new Error('Student not found');

      const newNote = await studentNoteService.create({
        studentId: selectedNoteStudentId,
        studentName: student.name,
        teacherId: user?.email || '',
        teacherName: user?.name || '',
        type: selectedNoteType,
        content: noteContent,
        date: new Date().toISOString(),
      });

      // Send notification to parent
      const parentUser = await studentService.getParentByStudentId(selectedNoteStudentId);
      if (parentUser && parentUser.email) {
        await notificationService.create({
          userId: parentUser.email,
          type: 'announcement',
          title: `New Teacher Note for ${student.name}`,
          message: `${user?.name} has added a new ${selectedNoteType.toLowerCase()} note for ${student.name}: ${noteContent}`,
          date: new Date().toISOString(),
          read: false,
        });
      }

      setRecentNotes(prev => [newNote, ...prev]);
      setNoteContent('');
      setSelectedNoteStudentId('');
      alert('✅ Note saved and parent notified!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('❌ Failed to save note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    if (user?.email) {
      setNotifications(await notificationService.getByUser(user.email));
      setUnreadCount(await notificationService.getUnreadCount(user.email));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user?.email) {
      await notificationService.markAllAsRead(user.email);
      setNotifications(await notificationService.getByUser(user.email));
      setUnreadCount(await notificationService.getUnreadCount(user.email));
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!user?.email) return;

      // Ensure school_id is in sessionStorage before ANY Firestore call.
      // AuthContext sets it on login but may race with React rendering.
      if (user.school_id && !sessionStorage.getItem('active_school_id')) {
        sessionStorage.setItem('active_school_id', user.school_id);
      }

      // ── 1. Load today's timetable (independent of teacher record) ──────────
      setScheduleLoading(true);
      let todaySlots: any[] = [];
      try {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const schoolId = sessionStorage.getItem('active_school_id');
        console.log('[Timetable] teacher email:', user.email, '| today:', today, '| school_id:', schoolId);

        if (!schoolId) {
          setScheduleDebug(`ERROR: No school_id in session. user.school_id=${user.school_id || 'EMPTY'}`);
          setTodaySchedule([]);
          setScheduleLoading(false);
          return;
        }

        // Also get teacher name for matching old data where teacherId = teacher name
        let teacherName = user.name || '';
        try {
          const teacherDoc = await teacherService.getByEmail(user.email);
          if (teacherDoc) teacherName = teacherDoc.name || teacherName;
        } catch { /* ignore */ }
        console.log('[Timetable] teacher name:', teacherName);

        // Fetch ALL timetable docs for this school (avoids composite index issues).
        const allSchoolSlots = await timetableService.getAll();
        console.log('[Timetable] ALL school timetable docs:', allSchoolSlots.length, allSchoolSlots);

        const uniqueTeacherIds = [...new Set(allSchoolSlots.map(s => s.teacherId))];
        const uniqueTeacherNames = [...new Set(allSchoolSlots.map(s => s.teacherName))];
        console.log('[Timetable] Unique teacherIds in timetable:', uniqueTeacherIds);
        console.log('[Timetable] Unique teacherNames in timetable:', uniqueTeacherNames);

        if (allSchoolSlots.length === 0) {
          setScheduleDebug(`No timetable data found for school_id="${schoolId}". Go to Admin → Academic Structure → Timetable and save a timetable first.`);
          setTodaySchedule([]);
          setScheduleLoading(false);
          return;
        }

        // Match by teacherId (email) OR teacherName OR teacherId contains name
        // This handles both correct data (teacherId=email) and old data (teacherId=name)
        const emailLower = user.email.toLowerCase();
        const nameLower = teacherName.toLowerCase();
        const teacherSlots = allSchoolSlots.filter(s => {
          const tid = (s.teacherId || '').toLowerCase();
          const tname = (s.teacherName || '').toLowerCase();
          return tid === emailLower           // correct: teacherId has email
              || tname === emailLower          // edge case: name field has the email
              || tid === nameLower             // old data: teacherId has name instead of email
              || tname === nameLower;          // fallback: match by teacherName
        });
        console.log('[Timetable] Slots for this teacher:', teacherSlots.length, teacherSlots);

        if (teacherSlots.length === 0) {
          setScheduleDebug(
            `Found ${allSchoolSlots.length} timetable slots but NONE match your email "${user.email}" or name "${teacherName}". ` +
            `TeacherIds in DB: [${uniqueTeacherIds.join(', ')}]. TeacherNames: [${uniqueTeacherNames.join(', ')}]. ` +
            `Admin needs to re-save the timetable with correct subject-teacher mappings.`
          );
          setTodaySchedule([]);
          setScheduleLoading(false);
          return;
        }

        todaySlots = teacherSlots.filter(s => s.day === today);
        console.log('[Timetable] Slots for today (' + today + '):', todaySlots.length, todaySlots);

        if (todaySlots.length === 0) {
          setScheduleDebug(
            `You have ${teacherSlots.length} total slots but none on ${today}. ` +
            `Your scheduled days: [${[...new Set(teacherSlots.map(s => s.day))].join(', ')}]`
          );
        } else {
          setScheduleDebug('');
        }

        todaySlots.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        setTodaySchedule(todaySlots.map(slot => ({
          id: slot.id, // Include slot ID
          startTime: slot.startTime || '',
          endTime: slot.endTime || '',
          class: `${slot.class}-${slot.section}`,
          subject: slot.subject || '',
        })));

        // Store all slots for dynamic population in Lesson Log form
        setAllTimetableSlots(teacherSlots);
      } catch (schedErr: any) {
        console.error('[Timetable] FAILED to load schedule:', schedErr);
        setScheduleDebug(`ERROR: ${schedErr?.message || schedErr}`);
        setTodaySchedule([]);
      } finally {
        setScheduleLoading(false);
      }

      // ── 2. Load teacher record, classes, and students ──────────────────────
      try {
        let teacher = await teacherService.getByEmail(user.email);
        if (!teacher && user.role === 'teacher') {
          const allTeachers = await teacherService.getAll();
          if (allTeachers.length > 0) teacher = allTeachers[0];
        }

        if (teacher) {
          // Deduplicate classes to avoid redundant student fetching and list items
          const seenClasses = new Set<string>();
          const uniqueTeacherClasses = teacher.classes.filter((c: any) => {
            const key = `${c.class}-${c.section}-${c.subject}`;
            if (seenClasses.has(key)) return false;
            seenClasses.add(key);
            return true;
          });

          const classesInfo: ClassInfo[] = await Promise.all(uniqueTeacherClasses.map(async (c: any, i: number) => {
            const studentsInClass = await studentService.getByClass(c.class, c.section);
            return {
              id: `${c.class}-${c.section}-${c.subject}-${i}`,
              class: c.class,
              section: c.section,
              subject: c.subject,
              students: studentsInClass.length,
              time: '',
            };
          }));
          setMyClasses(classesInfo);

          const allStds: LocalStudent[] = [];
          const studentIds = new Set<string>();
          
          // Deduplicate by class-section for student aggregation to prevent double-counting students in same class with different subjects
          const seenClassSections = new Set<string>();
          for (const c of uniqueTeacherClasses) {
            const classKey = `${c.class}-${c.section}`;
            if (seenClassSections.has(classKey)) continue;
            seenClassSections.add(classKey);

            const stds = await studentService.getByClass(c.class, c.section);
            stds.forEach((s: any) => {
              if (!studentIds.has(s.id)) {
                studentIds.add(s.id);
                allStds.push({ id: s.id, name: s.name, rollNo: s.rollNo, attendance: null, class: s.class, section: s.section });
              }
            });
          }
          setAllStudents(allStds);

          // ── Determine Students for TODAY ──────────────────────────────────
          // Use todaySchedule (already populated in step 1) to filter students
          const todayStds: LocalStudent[] = [];
          const seenTodayStudentIds = new Set<string>();
          const todayClassSections = new Set<string>();
          
          todaySlots.forEach(slot => {
            todayClassSections.add(`${slot.class}-${slot.section}`);
          });

          for (const classSection of todayClassSections) {
            const [cls, sec] = classSection.split('-');
            const stds = await studentService.getByClass(cls, sec);
            stds.forEach((s: any) => {
              if (!seenTodayStudentIds.has(s.id)) {
                seenTodayStudentIds.add(s.id);
                todayStds.push({ 
                  id: s.id, 
                  name: s.name, 
                  rollNo: s.rollNo, 
                  attendance: null, 
                  class: s.class, 
                  section: s.section 
                });
              }
            });
          }
          setTodayStudents(todayStds);
        }
      } catch (teacherErr) {
        console.error('Failed to load teacher data:', teacherErr);
      }

      // ── 3. Load SaaS Performance Data ─────────────────────────────────────
      try {
        setTrends(await performanceAnalyticsService.getMonthlyTrends(user.email));
        setInsightTriggers(await performanceAnalyticsService.getInsightTriggers(user.email));
        if (selectedClass) {
          setClassDelta(await performanceAnalyticsService.calculateClassDelta(selectedClass.id));
        }
      } catch (perfErr) {
        console.error('Failed to load performance data:', perfErr);
      }
    }
    loadData();
  }, [user, selectedClass]);

  const [lessonForm, setLessonForm] = useState({
    topic: '',
    objectives: [] as string[],
    studentsNeedingAttention: [] as string[],
    notes: '',
    teachingDepth: 'Moderate' as 'Basic' | 'Moderate' | 'Advanced',
    aiSuggestions: [] as string[],
    time: '09:00',
    curriculumTag: undefined as CurriculumTag | undefined,
    aiPlan: undefined as AILessonPlan | undefined,
  });

  // Effect to load curriculum tags when class/subject changes
  useEffect(() => {
    async function loadCurriculumTags() {
      if (selectedLessonClass && selectedSubject && selectedSubject !== 'All Subjects') {
        try {
          const schoolId = sessionStorage.getItem('active_school_id') || user?.school_id;
          if (schoolId) {
            const mapping = await subjectMappingService.getByClassAndSubject(
              schoolId,
              selectedLessonClass.class,
              selectedLessonClass.section,
              selectedSubject
            );
            if (mapping && mapping.curriculumTags && mapping.curriculumTags.length > 0) {
              setAvailableCurriculumTags(mapping.curriculumTags as CurriculumTag[]);
              // If there's only one tag, pre-select it
              if (mapping.curriculumTags.length === 1) {
                setLessonForm(prev => ({ ...prev, curriculumTag: mapping.curriculumTags![0] as CurriculumTag }));
              }
            } else {
              setAvailableCurriculumTags([]);
              setLessonForm(prev => ({ ...prev, curriculumTag: undefined }));
            }
          }
        } catch (error) {
          console.error('Error fetching curriculum tags:', error);
          setAvailableCurriculumTags([]);
        }
      } else {
        setAvailableCurriculumTags([]);
      }
    }
    loadCurriculumTags();
  }, [selectedLessonClass, selectedSubject, user?.school_id]);

  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);

  useEffect(() => {
    async function loadAttendance() {
      try {
        if (attendanceClassFilter && attendanceSectionFilter && attendanceDate) {
          // Fetch previously saved attendance for this date
          const previouslyMarked = await attendanceService.getByDate(attendanceDate);
          // Update allStudents with saved attendance status so the UI shows it
          setAllStudents(prev => prev.map(student => {
            if (student.class !== attendanceClassFilter || student.section !== attendanceSectionFilter) {
              return student;
            }
            const existingRecord = previouslyMarked.find((r: any) => r.studentId === student.id);
            return {
              ...student,
              attendance: existingRecord ? existingRecord.status as any : null,
            };
          }));
        }
      } catch (err) {  // Reset slot selection when lesson date changes
  useEffect(() => {
    setSelectedSlotId('');
    setSelectedLessonClass(null);
    setSelectedSubject('');
    setLessonForm(prev => ({ ...prev, time: '09:00' }));
  }, [lessonDate]);
        console.error('Error loading attendance:', err);
      }
    }
    loadAttendance();
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

  const handleSaveAttendance = async () => {
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

    try {
      // Save to Firestore (handles dedup + parent notifications inside)
      await attendanceService.markAttendance(attendanceRecords as any);

      alert(`✅ Attendance saved successfully!\n${attendanceRecords.length} students marked for ${attendanceClassFilter} - Section ${attendanceSectionFilter}`);

      // Reload saved attendance from Firestore so UI reflects the persisted state.
      // This proves data was saved correctly and prevents re-prompting.
      const freshRecords = await attendanceService.getByDate(attendanceDate);
      setAllStudents(prev => prev.map(s => {
        if (s.class !== attendanceClassFilter || s.section !== attendanceSectionFilter) return s;
        const saved = freshRecords.find(r => r.studentId === s.id);
        return { ...s, attendance: saved ? saved.status as any : s.attendance };
      }));

      // Update dashboard present count
      const todayDate = new Date().toISOString().split('T')[0];
      if (attendanceDate === todayDate) {
        const todayRecords = await attendanceService.getByDate(todayDate);
        const teacherTodayStdIds = new Set(todayStudents.map(s => s.id));
        const presentStudentIds = new Set(
          todayRecords
            .filter(a => a.status === 'present' && teacherTodayStdIds.has(a.studentId))
            .map(a => a.studentId)
        );
        setDashboardPresentCount(presentStudentIds.size);
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('❌ Failed to save attendance. Please try again.');
    }
  };

  // Load dashboard stats asynchronously
  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = await attendanceService.getByDate(today);
        
        // Filter by students who SHOULD be in class today for this teacher and count once per student
        const teacherTodayStdIds = new Set(todayStudents.map(s => s.id));
        const presentStudentIds = new Set(
          todayAttendance
            .filter(a => a.status === 'present' && teacherTodayStdIds.has(a.studentId))
            .map(a => a.studentId)
        );
        setDashboardPresentCount(presentStudentIds.size);

        // Get lessons logged TODAY by this teacher
        const allLessons = await lessonService.getAll();
        const teacherEmail = user?.email || 'teacher';
        const todayLessons = allLessons.filter((lesson: any) => {
          return lesson.date === today && lesson.teacherId === teacherEmail;
        });
        setDashboardWeekLessons(todayLessons);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    }
    loadDashboardStats();
  }, [user, todayStudents]);

  const renderDashboard = () => {
    const presentCount = dashboardPresentCount;
    const weekLessons = dashboardWeekLessons;
    const totalStudentsCount = allStudents.length;
    const todayStudentsCount = todayStudents.length;
    const attendancePercentage = todayStudents.length > 0 ? ((presentCount / todayStudents.length) * 100).toFixed(0) : '0';
    const lessonsRemaining = todaySchedule.length - weekLessons.length;

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-md p-6 text-white">
          <h2 className="text-2xl mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-purple-100">
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Holiday Banner */}
        {isHolidayToday && holidayInfo && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-red-600">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-red-900 font-bold text-lg">{holidayInfo.title}</h3>
              <p className="text-red-700">{holidayInfo.description || 'School is closed today for a public holiday.'}</p>
            </div>
          </div>
        )}

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
                <p className="text-gray-600 text-sm">{todayStudentsCount} Students Today</p>
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
                <div className="flex items-baseline gap-1">
                  <h3 className="text-3xl font-bold text-gray-900">{presentCount}</h3>
                  <span className="text-gray-500 font-medium">/ {todayStudentsCount}</span>
                </div>
                <p className="text-green-600 text-sm font-medium mt-1">
                  {presentCount} students are present out of {todayStudentsCount}
                </p>
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
                <p className="text-orange-600 text-sm font-medium">
                  {lessonsRemaining > 0 ? `${lessonsRemaining} Remaining for today` : 'All caught up!'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Today's Schedule</h3>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          {/* Debug banner — shows diagnostic info when schedule fails to load */}
          {scheduleDebug && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
              <p className="font-semibold mb-1">⚠ Schedule Debug Info:</p>
              <p>{scheduleDebug}</p>
            </div>
          )}
          {isHolidayToday ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Star className="w-16 h-16 mx-auto mb-4 text-red-300" />
              <p className="text-xl font-bold text-gray-700">No Classes - Holiday</p>
              <p className="text-gray-500">The regular timetable is suspended for {holidayInfo?.title}.</p>
            </div>
          ) : scheduleLoading ? (
            <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
              <Clock className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading schedule…</span>
            </div>
          ) : todaySchedule.length > 0 ? (
            <div className="space-y-3">
              {todaySchedule.map((item, index) => {
                const nowHHMM = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
                const isOngoing = nowHHMM >= item.startTime && nowHHMM < item.endTime;
                const isPast = nowHHMM >= item.endTime;
                return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    isOngoing
                      ? 'bg-green-50 border-green-400 ring-2 ring-green-200'
                      : isPast
                        ? 'bg-gray-100 border-gray-200 opacity-70'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-28 text-center">
                      <Clock className={`w-5 h-5 mx-auto mb-1 ${isOngoing ? 'text-green-600 animate-pulse' : 'text-purple-600'}`} />
                      <p className={`text-sm font-medium ${isOngoing ? 'text-green-700' : 'text-gray-600'}`}>
                        {item.startTime} – {item.endTime}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${isOngoing ? 'text-green-800' : 'text-gray-900'}`}>{item.subject}</p>
                        {isOngoing && (
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">ONGOING</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{item.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const slotId = (item as any).id;
                        setSelectedSlotId(slotId);
                        const slot = allTimetableSlots.find(s => s.id === slotId);
                        if (slot) {
                          const cls = myClasses.find(c => c.class === slot.class && c.section === slot.section);
                          setSelectedLessonClass(cls || {
                            id: `${slot.class}-${slot.section}-${slot.subject}`,
                            class: slot.class,
                            section: slot.section,
                            subject: slot.subject,
                            students: 0,
                            time: `${slot.startTime} - ${slot.endTime}`
                          });
                          setSelectedSubject(slot.subject);
                          setLessonForm(prev => ({ ...prev, time: slot.startTime }));
                        }
                        setShowLessonForm(false);
                        setCurrentView('lesson-log');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Log Lesson
                    </button>
                    <button
                      onClick={() => {
                        const classMatch = item.class.match(/^(.+)-([A-Za-z0-9]+)$/);
                        if (classMatch) {
                          setAttendanceClassFilter(classMatch[1]);
                          setAttendanceSectionFilter(classMatch[2]);
                          setAttendanceSubjectFilter(item.subject);
                        }
                        setCurrentView('attendance');
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Mark Attendance
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-semibold text-lg">No schedule today</p>
              <p className="text-sm">You have no classes scheduled for today.</p>
            </div>
          )}
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

        {/* Quick Actions & Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 h-full">
                <h3 className="text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setCurrentView('student-notes')}
                        className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                    >
                        <MessageSquare className="w-5 h-5 text-orange-600" />
                        <span className="text-gray-700">Add Student Note</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('marks-upload')}
                        className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                    >
                        <Upload className="w-5 h-5 text-indigo-600" />
                        <span className="text-gray-700">Upload Exam Scores</span>
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

          <div>
              <div className="bg-white rounded-xl shadow-md p-6 h-full">
                  <h3 className="text-gray-900 mb-4">Academic Calendar</h3>
                  <div className="space-y-4">
                      {upcomingEvents.length > 0 ? (
                          upcomingEvents.map(event => (
                              <div key={event.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white ${
                                      event.type === 'holiday' ? 'bg-red-500' : 
                                      event.type === 'exam' ? 'bg-orange-500' :
                                      event.type === 'cultural' ? 'bg-blue-500' : 
                                      'bg-purple-500'
                                  }`}>
                                      <span className="text-[10px] font-bold uppercase">{format(new Date(event.startDate), 'MMM')}</span>
                                      <span className="text-lg font-black leading-none">{format(new Date(event.startDate), 'd')}</span>
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                      <h4 className="text-sm font-bold text-gray-900 truncate">{event.title}</h4>
                                      <p className="text-xs text-gray-500 capitalize">{event.type}</p>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-8 text-gray-400">
                              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                              <p className="text-xs">No upcoming events</p>
                          </div>
                      )}
                      <button 
                        onClick={() => setCurrentView('calendar')}
                        className="w-full py-2 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors mt-2"
                      >
                          View Full Calendar
                      </button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper functions for attendance filters
  const getAvailableClasses = () => {
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
                    {getAvailableClasses().map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Dropdown */}
                {attendanceClassFilter && (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select Section</option>
                      {getAvailableSections(attendanceClassFilter).map((section) => (
                        <option key={section} value={section}>
                          Section {section}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject Dropdown (Optional filter based on teacher assignment) */}
                {attendanceClassFilter && attendanceSectionFilter && (
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
                )}
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

  /**
   * Triggers the AI lesson plan generation workflow.
   * Aggregates class performance, student ages, and curriculum tags.
   */
  const handleGenerateAILessonPlan = async () => {
    if (!isAIEnabled) {
      alert(getDisabledMessage());
      return;
    }

    if (!selectedLessonClass || !selectedSubject || selectedSubject === 'All Subjects') {
      alert('Please select a timetable slot or a specific class and subject first.');
      return;
    }
    if (!lessonForm.topic) {
      alert('Please enter a topic to generate a plan for.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      // 1. Fetch Performance Analysis
      const performanceAnalysis = await performanceAnalyticsService.getClassPerformanceAnalysis(
        selectedLessonClass.class,
        selectedLessonClass.section,
        selectedSubject
      );

      // 2. Fetch Student Age Profile
      const ageProfile = await performanceAnalyticsService.getStudentAgeProfile(
        selectedLessonClass.class,
        selectedLessonClass.section
      );

      // 3. Collect tags
      const currentTags = lessonForm.curriculumTag ? [lessonForm.curriculumTag] : [];

      // 4. Generate AI Plan
      const aiPlan = await aiService.generateAILessonPlan(
        selectedSubject,
        lessonForm.topic,
        { class: selectedLessonClass.class, section: selectedLessonClass.section },
        performanceAnalysis || { performanceCategory: 'Not enough data', averageScore: 0, strugglingStudentNames: [] },
        ageProfile || { averageAge: 15, ageRange: '14-16' },
        currentTags
      );

      if (aiPlan) {
        // 5. Update form state
        setLessonForm(prev => ({
          ...prev,
          objectives: Array.from(new Set([...prev.objectives, ...(aiPlan.learningObjectives || [])])),
          studentsNeedingAttention: Array.from(new Set([...prev.studentsNeedingAttention, ...(aiPlan.studentsNeedingAttention || [])])),
          notes: `${prev.notes ? prev.notes + '\n\n' : ''}AI Recommended Plan:\n${aiPlan.topicExplanation}`,
          aiPlan: aiPlan
        }));
        
        alert('✨ AI Lesson Plan generated and applied to the form!');
      }
    } catch (error) {
      console.error('Failed to generate AI lesson plan:', error);
      alert('Failed to generate AI lesson plan. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save lesson function
  const saveLessonLog = async () => {
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

    try {
      const lesson = await lessonService.create({
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
        time: lessonForm.time,
        curriculumTag: lessonForm.curriculumTag,
        aiPlan: lessonForm.aiPlan,
      });

      setLessonLogs((prevLessons) => [lesson, ...prevLessons]);

      // Update dashboard stats immediately if lesson is for today
      const today = new Date().toISOString().split('T')[0];
      if (lesson.date === today) {
        setDashboardWeekLessons(prev => [lesson, ...prev]);
      }

      alert('✅ Lesson logged successfully!');

      // Reset form
      setLessonForm({
        topic: '',
        objectives: [],
        studentsNeedingAttention: [],
        notes: '',
        teachingDepth: 'Moderate',
        aiSuggestions: [],
        time: '09:00',
        curriculumTag: undefined,
        aiPlan: undefined,
      });

      setShowLessonForm(false);
    } catch (error) {
      console.error('Error saving lesson log:', error);
      alert('Failed to save lesson log. Please try again.');
    }
  };

  const renderLessonLog = () => {
    // If form is not shown, display the list of logged lessons
    if (!showLessonForm) {
      // Filter lessons by subject and week (ensures consistency if new lessons are added manually)
      const weekEndsAt = new Date(currentWeekStart);
      weekEndsAt.setDate(currentWeekStart.getDate() + 7);

      const filteredLessons = lessonLogs.filter((lesson: any) => {
        const lessonDate = new Date(lesson.date);
        const dateMatch = lessonDate >= currentWeekStart && lessonDate < weekEndsAt;
        const classMatch = !selectedLessonClass ||
          (lesson.class === selectedLessonClass.class && lesson.section === selectedLessonClass.section);
        const subjectMatch = selectedSubject === 'All Subjects' || lesson.subject === selectedSubject;
        return dateMatch && classMatch && subjectMatch;
      });

      // Sort by date (most recent first)
      const sortedLessons = [...filteredLessons].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Week range for display
      const weekEndDate = new Date(currentWeekStart);
      weekEndDate.setDate(currentWeekStart.getDate() + 6);
      const rangeStr = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      // Grouping by date
      const groupedLessons: Record<string, any[]> = {};
      sortedLessons.forEach(lesson => {
        const dateStr = new Date(lesson.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        if (!groupedLessons[dateStr]) groupedLessons[dateStr] = [];
        groupedLessons[dateStr].push(lesson);
      });

      const subjects = ['All Subjects', ...new Set(myClasses.map(c => c.subject))];

      return (
        <div className="space-y-6">
          {/* Header with Nav */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-purple-600" />
                Lesson History
              </h2>
              <p className="text-gray-600">Track and manage your teaching records week by week</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLessonForm(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                Log New Lesson
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Weekly Navigation Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => navigateWeek(-1)}
                  className="p-2 hover:bg-white rounded-md transition-all text-gray-600 hover:text-purple-600 hover:shadow-sm"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={jumpToToday}
                  className="px-4 py-1.5 hover:bg-white rounded-md transition-all text-sm font-medium text-gray-700 hover:text-purple-600 hover:shadow-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateWeek(1)}
                  className="p-2 hover:bg-white rounded-md transition-all text-gray-600 hover:text-purple-600 hover:shadow-sm"
                  title="Next Week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {rangeStr}
                </h3>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <input
                  type="date"
                  onChange={(e) => jumpToDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-white hover:border-purple-300 transition-all">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Select Week</span>
                </button>
              </div>
              
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white font-medium text-gray-700"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {selectedLessonClass && (
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm font-medium">
                  {selectedLessonClass.class}-{selectedLessonClass.section}
                </div>
              )}
            </div>
          </div>

          {/* Lesson Logs List */}
          <div className="bg-white rounded-xl shadow-md p-6 min-h-[400px]">
            {lessonsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-lg font-medium">Loading lessons...</p>
              </div>
            ) : sortedLessons.length > 0 ? (
              <div className="space-y-10">
                {Object.keys(groupedLessons).map((dateStr) => (
                  <div key={dateStr} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        {dateStr}
                      </span>
                      <div className="h-px bg-gray-100 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {groupedLessons[dateStr].map((lesson: any) => (
                        <div 
                          key={lesson.id} 
                          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all group relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                          
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <h4 className="font-bold text-gray-900 text-xl">{lesson.topic}</h4>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-bold uppercase tracking-wider">
                                  {lesson.subject}
                                </span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold uppercase tracking-wider">
                                  {lesson.class}-{lesson.section}
                                </span>
                                {lesson.curriculumTag && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold uppercase tracking-wider">
                                    {lesson.curriculumTag}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Time & Duration</p>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Clock className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium">{lesson.time || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Learning Objectives</p>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Target className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium">{lesson.objectives?.length || 0} Points</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Logged By</p>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium">{lesson.teacherName || 'Teacher'}</span>
                                  </div>
                                </div>
                              </div>

                              {lesson.objectives && lesson.objectives.length > 0 && (
                                <div className="mt-5 p-4 bg-gray-50 rounded-lg">
                                  <div className="flex flex-wrap gap-2">
                                    {lesson.objectives.slice(0, 3).map((obj: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-100 text-xs text-gray-600 shadow-sm">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        {obj}
                                      </div>
                                    ))}
                                    {lesson.objectives.length > 3 && (
                                      <span className="text-xs text-purple-600 font-bold px-2 py-1">
                                        +{lesson.objectives.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedLesson(lesson);
                                setCurrentView('teaching-flow');
                              }}
                              className="w-full lg:w-auto px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-purple-200 group/btn"
                            >
                              <Sparkles className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                              <span>View Flow</span>
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No Lessons Logged</h4>
                <p className="text-gray-500 text-center max-w-sm mb-8">
                  {selectedLessonClass 
                    ? `We couldn't find any lessons for ${selectedLessonClass.class}-${selectedLessonClass.section} during this week.`
                    : "You haven't logged any lessons for this week yet. Start tracking your progress today!"}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowLessonForm(true)}
                    className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Log Your First Lesson
                  </button>
                  <button
                    onClick={jumpToToday}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    Go to Current Week
                  </button>
                </div>
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
            {/* Slot Selection */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">🏷 Timetable Slot *</label>
              <select
                value={selectedSlotId}
                onChange={(e) => {
                  const slotId = e.target.value;
                  setSelectedSlotId(slotId);
                  const slot = allTimetableSlots.find(s => s.id === slotId);
                  if (slot) {
                    const cls = myClasses.find(c => c.class === slot.class && c.section === slot.section);
                    setSelectedLessonClass(cls || {
                      id: `${slot.class}-${slot.section}-${slot.subject}`,
                      class: slot.class,
                      section: slot.section,
                      subject: slot.subject,
                      students: 0,
                      time: `${slot.startTime} - ${slot.endTime}`
                    });
                    setSelectedSubject(slot.subject);
                    setLessonForm(prev => ({ ...prev, time: slot.startTime, aiPlan: undefined }));
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Select a slot from your timetable...</option>
                {(() => {
                  const dayName = new Date(lessonDate).toLocaleDateString('en-US', { weekday: 'long' });
                  const slotsForDay = allTimetableSlots.filter(s => s.day === dayName);
                  if (slotsForDay.length === 0) return <option disabled>No classes scheduled for {dayName}</option>;
                  return slotsForDay.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                    <option key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime} | {slot.class}-{slot.section} | {slot.subject}
                    </option>
                  ));
                })()}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Showing available slots for {new Date(lessonDate).toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
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
                value={lessonForm.time}
                onChange={(e) => setLessonForm({ ...lessonForm, time: e.target.value, aiPlan: undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>

            {/* Curriculum Tag Selection */}
            {availableCurriculumTags.length > 0 && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2">🏷️ Curriculum Tag</label>
                <select
                  value={lessonForm.curriculumTag || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, curriculumTag: e.target.value as CurriculumTag })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">No specific curriculum</option>
                  {availableCurriculumTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Based on subject mapping configuration</p>
              </div>
            )}
          </div>
        </div>

        {/* Topic Input with AI Button */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-gray-700 font-semibold flex items-center gap-2">
              🎯 Topic Covered *
            </label>
            <button
              onClick={handleGenerateAILessonPlan}
              disabled={isGeneratingAI || !lessonForm.topic}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm
                ${isGeneratingAI 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-200 active:scale-95'
                }`}
            >
              {isGeneratingAI ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Analyzing Class Matrix...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ✨ Generate AI Plan
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={lessonForm.topic}
              onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value, aiPlan: undefined })}
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
                      onClick={() => setLessonForm({ ...lessonForm, topic: suggestion, aiPlan: undefined })}
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
                onClick={() => setLessonForm({ ...lessonForm, topic: suggestion, aiPlan: undefined })}
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
                                aiPlan: undefined,
                              });
                            } else {
                              setLessonForm({
                                ...lessonForm,
                                objectives: lessonForm.objectives.filter((o) => o !== objective),
                                aiPlan: undefined,
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
                            aiPlan: undefined,
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
                          aiPlan: undefined,
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
                          aiPlan: undefined,
                        });
                      } else {
                        setLessonForm({
                          ...lessonForm,
                          studentsNeedingAttention:
                            lessonForm.studentsNeedingAttention.filter(
                              (n) => n !== student.name
                            ),
                          aiPlan: undefined,
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
            onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value, aiPlan: undefined })}
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
                    time: '09:00',
                    curriculumTag: undefined,
                    aiPlan: undefined,
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

  const renderMarksUpload = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upload Exam Scores</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-bold"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            Back
          </button>
        </div>
        <TeacherMarksUpload />
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
              <label className="block text-gray-700 mb-2">Select Student *</label>
              <select 
                value={selectedNoteStudentId}
                onChange={(e) => setSelectedNoteStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a student...</option>
                {allStudents.sort((a, b) => a.name.localeCompare(b.name)).map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.class}-{student.section})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Note Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['Achievement', 'Concern', 'Behavior'] as const).map((type) => (
                  <label 
                    key={type}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedNoteType === type 
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200 shadow-sm' 
                        : type === 'Achievement' ? 'bg-green-50 border-green-200' :
                          type === 'Concern' ? 'bg-orange-50 border-orange-200' :
                          'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="noteType" 
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500" 
                      checked={selectedNoteType === type}
                      onChange={() => setSelectedNoteType(type)}
                    />
                    <span className="text-gray-700 font-bold">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Detailed Note *</label>
              <textarea
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your observation or note..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            </div>
            <button 
              onClick={handleSaveNote}
              disabled={isSavingNote || !selectedNoteStudentId || !noteContent}
              className={`w-full md:w-auto px-8 py-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2 font-black shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSavingNote ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Saving Note...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Note & Notify Parent
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6">Recent Notes & Observations</h3>
          <div className="space-y-4">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <div 
                  key={note.id}
                  className={`p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                    note.type === 'Achievement' ? 'bg-green-50/50 border-green-100' :
                    note.type === 'Concern' ? 'bg-orange-50/50 border-orange-100' :
                    'bg-blue-50/50 border-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                        note.type === 'Achievement' ? 'bg-green-500' :
                        note.type === 'Concern' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {note.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none mb-1">{note.studentName}</p>
                        <p className="text-xs text-gray-500 font-medium">Student Performance Note</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      note.type === 'Achievement' ? 'bg-green-600 text-white' :
                      note.type === 'Concern' ? 'bg-orange-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {note.type}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed font-medium pl-1">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100/50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md border border-gray-100">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span className="font-bold">{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md border border-gray-100">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        <span className="font-bold">{new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">
                        {note.teacherName.charAt(0)}
                      </div>
                      <span className="font-bold">By {note.teacherName}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquare className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-gray-900 font-bold mb-1">No notes recorded yet</h4>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Start recording student observations to track progress and keep parents informed.</p>
              </div>
            )}
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
                      setCurrentView('attendance-overview');
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
      case 'attendance-overview':
        return renderAttendanceOverview();
      case 'lesson-log':
        return renderLessonLog();
      case 'teaching-flow':
        return renderTeachingFlow();
      case 'student-notes':
        return renderStudentNotes();
      case 'performance':
        return renderPerformance();
      case 'marks-upload':
        return renderMarksUpload();
      case 'notifications':
        return renderAllNotifications();
      case 'calendar':
        return renderFullCalendar();
      default:
        return renderDashboard();
    }
  };

  const renderAttendanceOverview = () => {
    return (
      <AttendanceOverview
        classInfo={{
          class: attendanceClassFilter,
          section: attendanceSectionFilter,
          subject: attendanceSubjectFilter
        }}
        onBack={() => setCurrentView('my-classes')}
        onMarkAttendance={(date) => {
          if (date) {
            setAttendanceDate(date);
          } else {
            setAttendanceDate(new Date().toISOString().split('T')[0]);
          }
          setCurrentView('attendance');
        }}
      />
    );
  };

  const renderFullCalendar = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900">Academic Calendar</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-bold text-sm"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            Back to Dashboard
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 min-h-[600px]">
          <CalendarModule viewOnly={true} />
        </div>
      </div>
    );
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
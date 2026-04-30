import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardNav, parentNavItems } from './DashboardNav';
import { ParentDashboardChildProgress } from './ParentDashboardChildProgress';
import { ParentNotificationPanel } from './ParentNotificationPanel';
import { CalendarModule } from './CalendarModule';
import { ParentTeacherChat } from './ParentTeacherChat';
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
  ChevronLeft,
  Target,
  Activity,
  FileText,
  TrendingDown,
  Minus,
  Lightbulb,
} from 'lucide-react';
import logoImage from '../assets/logo.jpeg';
import { useStudents, useAttendance, useLessons, useNotifications, useFeePayments, useFeeInvoices, useStudentPerformance, useAssignments, useExams, useExamResults, useAssignmentSubmissions } from '../hooks/useDataService';
import { useAggregatedNotifications } from '../hooks/useAggregatedNotifications';
import { useAIFeatureEnabled } from '../hooks/useAIFeatureEnabled';
import dataService from '../utils/firestoreService';
import { generateAndDownloadReport } from '../utils/reportPdfGenerator';

type ViewType = 'dashboard' | 'timeline' | 'progress' | 'fees' | 'notifications' | 'reports' | 'ai-suggestions' | 'calendar' | 'chat';
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
  status: 'present' | 'absent' | 'late' | 'not-marked';
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
  type: 'attendance' | 'progress' | 'fee' | 'announcement' | 'assignment' | 'exam' | 'general';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export function ParentDashboardNew() {
  const { user, logout } = useAuth();
  const { isEnabled: isAIEnabled, getDisabledMessage } = useAIFeatureEnabled();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Standardize to start on Sunday (0)
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  });

  const navigateWeek = (dir: number) => {
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (dir * 7));
      return d;
    });
  };

  const jumpToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    setCurrentWeekStart(d);
  };

  // 1. Fetch children for this parent (tries parentId, then childrenIds, then email match)
  const { students: children, loading: childrenLoading } = useStudents({
    parentId: user?.id,
    childrenIds: user?.childrenIds,
    parentEmail: user?.email,
  });

  // 2. State for selected child
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Initialize selected child when children load
  useEffect(() => {
    if (children.length > 0 && (!selectedChildId || !children.find(c => c.id === selectedChildId))) {
      setSelectedChildId(children[0].id);
    }
  }, [children]);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0] || null;

  // 3. Fetch dynamic data for selected child (only when a real child is selected)
  // Fetch attendance for last 90 days so both weekly and monthly reports work
  const attendanceStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }, []);

  const { attendance: studentAttendance, stats: attendanceStats } = useAttendance(
    selectedChild ? {
      studentId: selectedChild.id,
      startDate: attendanceStartDate
    } : undefined
  );

  const { lessons } = useLessons(
    selectedChild ? {
      class: selectedChild.class,
      section: selectedChild.section
    } : undefined
  );

  // Collect all children's classes for notification filtering (multi-child parents)
  const allChildClasses = useMemo(() => 
    children.map(c => ({ class: c.class || '', section: c.section || '' })).filter(c => c.class),
    [children]
  );

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(
    user?.id || undefined, 
    'parent',
    selectedChild?.class,
    selectedChild?.section,
    allChildClasses.length > 1 ? allChildClasses : undefined
  );

  // Additional dynamic data for progress, fees, etc.
  const { payments: feeRecords } = useFeePayments(selectedChild ? { studentId: selectedChild.id } : undefined);
  const { performance: studentPerformance } = useStudentPerformance(selectedChild?.id);
  const { assignments } = useAssignments(selectedChild ? { class: selectedChild.class, section: selectedChild.section } : undefined);
  const { submissions: assignmentSubmissions } = useAssignmentSubmissions(selectedChild ? { studentId: selectedChild.id } : undefined);
  const { exams } = useExams(selectedChild ? { class: selectedChild.class, section: selectedChild.section } : undefined);
  const { results: examResults } = useExamResults(selectedChild ? { studentId: selectedChild.id } : undefined);
  const { invoices: feeInvoices } = useFeeInvoices(selectedChild ? { studentId: selectedChild.id } : undefined);

  // Fetch quiz results for selected child
  const [quizResults, setQuizResults] = useState<any[]>([]);
  useEffect(() => {
    if (!selectedChild) { setQuizResults([]); return; }
    let cancelled = false;

    const loadQuizResults = async () => {
      try {
        const studentIds = new Set<string>([selectedChild.id]);

        // Resolve the child's auth UID from the users collection.
        // Quiz results are typically stored with student_id = auth UID.
        if (selectedChild.email) {
          try {
            const studentUser = await dataService.user.getByEmail(selectedChild.email.toLowerCase());
            if (studentUser?.id) studentIds.add(studentUser.id);
          } catch { /* user record may not exist — handled below via class fallback */ }
        }

        // Fetch quiz results for each known student ID
        const resultGroups = await Promise.all(
          Array.from(studentIds).map((sid) =>
            dataService.quizResult.getByStudent(sid).catch(() => [])
          )
        );

        let merged = resultGroups.flat();

        // Fallback: if no results found via student_id, try by class+section
        // and filter to this child's name or email (covers wrong-UID scenario).
        if (merged.length === 0 && selectedChild.class && selectedChild.section) {
          try {
            const classResults = await dataService.quizResult.getByClass(
              selectedChild.class, selectedChild.section
            );
            const childName = (selectedChild.name || '').toLowerCase();
            const childEmail = (selectedChild.email || '').toLowerCase();
            merged = classResults.filter((qr: any) => {
              const qrName = (qr.student_name || '').toLowerCase();
              const qrEmail = (qr.student_email || '').toLowerCase();
              return (childEmail && qrEmail === childEmail)
                || (childName && qrName === childName);
            });
          } catch { /* class query may fail — that's okay */ }
        }

        // Deduplicate by Firestore document ID
        const seen = new Set<string>();
        const deduped = merged.filter((result: any) => {
          if (!result?.id || seen.has(result.id)) return false;
          seen.add(result.id);
          return true;
        });

        if (!cancelled) setQuizResults(deduped);
      } catch {
        if (!cancelled) setQuizResults([]);
      }
    };

    loadQuizResults();
    return () => {
      cancelled = true;
    };
  }, [selectedChild?.id, selectedChild?.email, selectedChild?.name, selectedChild?.class, selectedChild?.section]);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isHolidayToday, setIsHolidayToday] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState<any | null>(null);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<ReportPeriod>('weekly');

  useEffect(() => {
    let isMounted = true;
    const loadCalendarInfo = async () => {
      try {
        const events = await dataService.event.getUpcoming(5);
        if (isMounted) setUpcomingEvents(events);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const allEvents = await dataService.event.getAll();
        const todayHoliday = allEvents.find((e: any) => 
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
    return () => { isMounted = false; };
  }, []);

  // Local date helper (avoids UTC offset shifting the date)
  const getLocalDateStr = (d: Date = new Date()): string =>
    d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');

  const getResultDateStr = (value?: string): string => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value.split('T')[0] : getLocalDateStr(parsed);
  };

  const normalizeQuizKey = (subject?: string, topic?: string): string =>
    `${(subject || '').trim().toLowerCase()}::${(topic || '').trim().toLowerCase()}`;

  const getQuizAccuracy = (result: any): number => {
    if (typeof result?.accuracy === 'number') return result.accuracy;
    if (typeof result?.correct === 'number' && typeof result?.total === 'number' && result.total > 0) {
      return Math.round((result.correct / result.total) * 100);
    }
    if (typeof result?.score === 'number' && typeof result?.total === 'number' && result.total > 0 && result.score <= result.total) {
      return Math.round((result.score / result.total) * 100);
    }
    if (typeof result?.score === 'number') return result.score;
    return 0;
  };

  const todayDate = getLocalDateStr();

  const todayRecord = studentAttendance.find(a => a.date === todayDate);
  const todayAttendance: AttendanceRecord = {
    date: todayDate,
    status: (todayRecord?.status as any) || 'not-marked',
    time: todayRecord?.time || '--:--',
  };

  // Convert lessons to daily activities, enriched with quiz results
  const todayActivities: DailyActivity[] = useMemo(() => {
    // Index today's quiz results by subject+topic and subject-only for O(1) lookup
    const quizIndex = new Map<string, { score: number; total: number }>();
    const subjectOnlyIndex = new Map<string, { score: number; total: number }>();
    for (const qr of quizResults) {
      const qrDate = getResultDateStr(qr.completed_at || qr.created_at);
      if (qrDate === todayDate) {
        const entry = { score: getQuizAccuracy(qr), total: 100 };
        const key = normalizeQuizKey(qr.subject, qr.topic);
        quizIndex.set(key, entry);
        // Subject-only fallback for quiz results missing topic
        if (qr.subject) {
          const subjKey = (qr.subject || '').trim().toLowerCase();
          if (!subjectOnlyIndex.has(subjKey)) subjectOnlyIndex.set(subjKey, entry);
        }
      }
    }

    return lessons
      .filter(l => l.date === todayDate)
      .map(l => {
        const key = normalizeQuizKey(l.subject, l.topic);
        // Try exact match first, then subject-only fallback
        const quizResult = quizIndex.get(key)
          || subjectOnlyIndex.get((l.subject || '').trim().toLowerCase());
        return {
          id: l.id,
          date: l.date,
          subject: l.subject,
          topic: l.topic,
          objectives: l.objectives || [],
          teacherNote: l.notes,
          quizAssigned: true,
          quizCompleted: !!quizResult,
          quizScore: quizResult?.score,
          quizTotal: quizResult?.total,
        };
      });
  }, [lessons, quizResults, todayDate]);

  // Fallback to empty if no activities logged yet
  const effectiveActivities = todayActivities;

  const weekTimeline: DailyActivity[] = useMemo(() => {
    // Index ALL quiz results by date::subject::topic and date::subject for timeline enrichment
    const quizIndex = new Map<string, { score: number; total: number }>();
    const subjOnlyIndex = new Map<string, { score: number; total: number }>();
    for (const qr of quizResults) {
      const qrDate = getResultDateStr(qr.completed_at || qr.created_at);
      if (qrDate) {
        const entry = { score: getQuizAccuracy(qr), total: 100 };
        quizIndex.set(`${qrDate}::${normalizeQuizKey(qr.subject, qr.topic)}`, entry);
        if (qr.subject) {
          const subjKey = `${qrDate}::${(qr.subject || '').trim().toLowerCase()}`;
          if (!subjOnlyIndex.has(subjKey)) subjOnlyIndex.set(subjKey, entry);
        }
      }
    }

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 7);

    return lessons
      .filter(l => {
        const lessonDate = new Date(l.date + 'T00:00:00');
        return lessonDate >= currentWeekStart && lessonDate < weekEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(l => {
        const key = `${l.date}::${normalizeQuizKey(l.subject, l.topic)}`;
        const quizResult = quizIndex.get(key)
          || subjOnlyIndex.get(`${l.date}::${(l.subject || '').trim().toLowerCase()}`);
        return {
          id: l.id,
          date: l.date,
          subject: l.subject,
          topic: l.topic,
          objectives: l.objectives || [],
          teacherNote: l.notes,
          quizAssigned: true,
          quizCompleted: !!quizResult,
          quizScore: quizResult?.score,
          quizTotal: quizResult?.total,
        };
      });
  }, [lessons, quizResults, currentWeekStart]);

  // Generate Progress Data Dynamically from quiz and exam backend results
  const progressData: ProgressData[] = useMemo(() => {
    if ((!examResults || examResults.length === 0) && (!quizResults || quizResults.length === 0)) return [];

    // Normalize subject names for consistent grouping (trim + title-case first letter)
    const normalizeSubject = (s: string) => {
      const trimmed = s.trim();
      if (!trimmed) return trimmed;
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    };

    const subjectGroups: Record<string, { scores: { score: number; date: string }[]; }> = {};

    quizResults.forEach((result) => {
      if (!result.subject) return;
      const subj = normalizeSubject(result.subject);
      if (!subjectGroups[subj]) subjectGroups[subj] = { scores: [] };
      const score = getQuizAccuracy(result);
      const date = result.completed_at || result.created_at || '';
      subjectGroups[subj].scores.push({ score, date });
    });

    examResults.forEach(result => {
      const exam = exams.find(e => e.id === result.examId);
      if (exam?.subject) {
        const subj = normalizeSubject(exam.subject);
        if (!subjectGroups[subj]) subjectGroups[subj] = { scores: [] };
        // Compute percentage from marks if the stored percentage is missing/invalid
        let pct = result.percentage;
        if (typeof pct !== 'number' || isNaN(pct)) {
          pct = result.totalMarks > 0 ? Math.round((result.marksObtained / result.totalMarks) * 100) : 0;
        }
        const date = result.gradedAt || result.created_at || '';
        subjectGroups[subj].scores.push({ score: pct, date });
      }
    });

    return Object.entries(subjectGroups).map(([subject, data]) => {
      const { scores } = data;
      const totalScores = scores.reduce((s, e) => s + e.score, 0);
      const avg = Math.round(totalScores / scores.length);

      // Sort by date ascending to compute real trend
      const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date));
      const lastScore = sorted[sorted.length - 1].score;

      let trend: 'improving' | 'steady' | 'needs-attention' = 'steady';
      if (sorted.length >= 2) {
        // Compare recent half average vs older half average
        const mid = Math.floor(sorted.length / 2);
        const olderAvg = sorted.slice(0, mid).reduce((s, e) => s + e.score, 0) / mid;
        const recentAvg = sorted.slice(mid).reduce((s, e) => s + e.score, 0) / (sorted.length - mid);
        if (recentAvg >= olderAvg + 5) trend = 'improving';
        else if (recentAvg <= olderAvg - 5) trend = 'needs-attention';
      } else {
        // Single result: judge by score level
        if (avg >= 75) trend = 'improving';
        else if (avg < 50) trend = 'needs-attention';
      }

      return {
        subject,
        averageScore: avg,
        totalQuizzes: scores.length,
        trend,
        lastScore: Math.round(lastScore),
      };
    }).sort((a, b) => b.averageScore - a.averageScore);
  }, [examResults, exams, quizResults]);

  // Consolidate recent marks (exams + quizzes) for the report list
  const recentMarks = useMemo(() => {
    const days = selectedReportPeriod === 'weekly' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateStr(cutoff);

    // Filter and normalize exams
    const normalizedExams = examResults
      .filter(r => (r.gradedAt || r.created_at || '') >= cutoffStr)
      .map(r => {
        const exam = exams.find(e => e.id === r.examId);
        return {
          id: r.id,
          type: 'exam' as const,
          subject: exam?.subject || 'General',
          title: exam?.name || 'Exam',
          score: typeof r.percentage === 'number' && !isNaN(r.percentage) 
            ? r.percentage 
            : (r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0),
          marks: `${r.marksObtained}/${r.totalMarks}`,
          grade: r.grade,
          date: r.gradedAt || r.created_at || '',
        };
      });

    // Filter and normalize quizzes
    const normalizedQuizzes = quizResults
      .filter(qr => getResultDateStr(qr.completed_at || qr.created_at) >= cutoffStr)
      .map(qr => ({
        id: qr.id,
        type: 'quiz' as const,
        subject: qr.subject || 'General',
        title: qr.topic || 'Quiz',
        score: getQuizAccuracy(qr),
        marks: qr.total > 0 ? `${qr.correct || 0}/${qr.total}` : `${getQuizAccuracy(qr)}%`,
        grade: '',
        date: qr.completed_at || qr.created_at || '',
      }));

    return [...normalizedExams, ...normalizedQuizzes].sort((a, b) => 
      b.date.localeCompare(a.date)
    );
  }, [examResults, exams, quizResults, selectedReportPeriod, examResults]);



  const payments = feeRecords || [];

  // Determine pending fees dynamically using fee invoices
  const paidFees = payments.map(p => ({
    id: p.id,
    feeHead: p.components?.map(c => c.name).join(', ') || 'School Fee',
    amount: p.amount,
    dueDate: p.academicYear,
    status: 'paid' as const,
    paidDate: p.paymentDate,
    receiptNo: p.receiptNo
  }));

  // Deduplicate: exclude invoices that already have a matching payment
  const paidInvoiceIds = new Set((payments || []).map(p => (p as any).invoiceId).filter(Boolean));
  const pendingFees = (feeInvoices || [])
    .filter(inv => !paidInvoiceIds.has(inv.id))
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial')
    .map(inv => ({
      id: inv.id,
      feeHead: inv.items?.map((i: any) => i.componentName).join(', ') || 'School Fee',
      amount: inv.totalBalance,
      dueDate: inv.dueDate,
      status: (inv.status === 'partial' ? 'pending' : inv.status) as 'pending' | 'overdue',
    }));

  const totalDue = pendingFees.reduce((sum, f) => sum + f.amount, 0);




  // Helper: compute attendance stats for a specific date range from raw records
  const computeAttendanceForPeriod = (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateStr(cutoff);
    const records = studentAttendance.filter(r => r.date >= cutoffStr);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, percentage };
  };

  // Helper to calculate assignment stats from actual submission data
  const calculateAssignmentStats = (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = getLocalDateStr(cutoff);
    const recentAssignments = assignments.filter(a => (a.assignedDate || a.dueDate || '') >= cutoffDate);
    const assigned = recentAssignments.length;

    // Match actual student submissions against assignments
    const submittedIds = new Set((assignmentSubmissions || []).map(s => s.assignmentId));
    let completed = 0;
    let onTime = 0;
    let late = 0;
    for (const a of recentAssignments) {
      if (submittedIds.has(a.id)) {
        completed++;
        const sub = (assignmentSubmissions || []).find(s => s.assignmentId === a.id);
        if (sub && a.dueDate && sub.submittedDate <= a.dueDate) {
          onTime++;
        } else {
          late++;
        }
      }
    }
    const pending = assigned - completed;
    const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;
    return { assigned, completed, onTime, late, pending, completionRate };
  };

  // Helper: compute quiz-based homework stats for a period
  const calculateQuizHomeworkStats = (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateStr(cutoff);

    // Lessons in the period are the "assigned" homework
    const periodLessons = lessons.filter(l => l.date >= cutoffStr);
    const totalLessons = periodLessons.length;

    // Quiz results completed in the period
    const periodQuizzes = quizResults.filter(qr => {
      const d = getResultDateStr(qr.completed_at || qr.created_at);
      return d >= cutoffStr;
    });

    // Build set of completed subject::topic keys
    const completedKeys = new Set(
      periodQuizzes.map(qr => normalizeQuizKey(qr.subject, qr.topic))
    );

    let quizCompleted = 0;
    for (const l of periodLessons) {
      if (completedKeys.has(normalizeQuizKey(l.subject, l.topic))) {
        quizCompleted++;
      }
    }

    const avgAccuracy = periodQuizzes.length > 0
      ? Math.round(periodQuizzes.reduce((s, qr) => s + getQuizAccuracy(qr), 0) / periodQuizzes.length)
      : 0;

    return { totalLessons, quizCompleted, quizPending: totalLessons - quizCompleted, avgAccuracy, totalQuizzesTaken: periodQuizzes.length };
  };

  // Generate Report Data Dynamically
  const weeklyReportData = useMemo(() => {
    const hwStats = calculateAssignmentStats(7);
    const attStats = computeAttendanceForPeriod(7);
    const quizHw = calculateQuizHomeworkStats(7);

    // Merge assignment + quiz homework into a combined view
    const totalAssigned = hwStats.assigned + quizHw.totalLessons;
    const totalCompleted = hwStats.completed + quizHw.quizCompleted;
    const totalPending = hwStats.pending + quizHw.quizPending;
    const combinedRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 100;

    // Dynamic highlights
    const highlights: string[] = [];
    highlights.push(`Attendance: ${attStats.percentage}% (${attStats.present} of ${attStats.total} days)`);
    if (totalCompleted > 0) highlights.push(`Completed ${totalCompleted} of ${totalAssigned} homework tasks (${combinedRate}%)`);
    if (quizHw.totalQuizzesTaken > 0) highlights.push(`Average quiz accuracy: ${quizHw.avgAccuracy}%`);
    if (attStats.absent > 0) highlights.push(`${attStats.absent} absent day${attStats.absent > 1 ? 's' : ''} this week`);
    if (totalPending > 0) highlights.push(`${totalPending} homework task${totalPending > 1 ? 's' : ''} still pending`);
    if (highlights.length === 0) highlights.push('No activity data for this period yet.');

    return {
      period: 'Last 7 Days',
      attendanceSummary: attStats,
      homeworkSummary: {
        assigned: totalAssigned,
        completed: totalCompleted,
        onTime: hwStats.onTime,
        late: hwStats.late,
        pending: totalPending,
        completionRate: combinedRate,
      },
      performanceBySubject: progressData,
      skillGrowth: [],
      highlights,
      teacherComments: [],
    };
  }, [studentAttendance, assignments, assignmentSubmissions, lessons, quizResults, progressData]);

  const monthlyReportData = useMemo(() => {
    const hwStats = calculateAssignmentStats(30);
    const attStats = computeAttendanceForPeriod(30);
    const quizHw = calculateQuizHomeworkStats(30);

    const totalAssigned = hwStats.assigned + quizHw.totalLessons;
    const totalCompleted = hwStats.completed + quizHw.quizCompleted;
    const totalPending = hwStats.pending + quizHw.quizPending;
    const combinedRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 100;

    // Compute overall performance from progressData
    const overallAvg = progressData.length > 0
      ? Math.round(progressData.reduce((s, p) => s + p.averageScore, 0) / progressData.length)
      : 0;

    const highlights: string[] = [];
    highlights.push(`Monthly attendance: ${attStats.percentage}% (${attStats.present} of ${attStats.total} days)`);
    if (overallAvg > 0) highlights.push(`Overall performance score: ${overallAvg}%`);
    if (totalCompleted > 0) highlights.push(`Completed ${totalCompleted} of ${totalAssigned} homework tasks (${combinedRate}%)`);
    if (quizHw.totalQuizzesTaken > 0) highlights.push(`Average quiz accuracy: ${quizHw.avgAccuracy}%`);
    const strongSubjects = progressData.filter(p => p.averageScore >= 80);
    if (strongSubjects.length > 0) highlights.push(`Strong subjects: ${strongSubjects.map(s => s.subject).join(', ')}`);
    const weakSubjects = progressData.filter(p => p.averageScore < 60);
    if (weakSubjects.length > 0) highlights.push(`Needs attention: ${weakSubjects.map(s => s.subject).join(', ')}`);
    if (highlights.length === 0) highlights.push('No activity data for this period yet.');

    return {
      period: 'Last 30 Days',
      attendanceSummary: attStats,
      homeworkSummary: {
        assigned: totalAssigned,
        completed: totalCompleted,
        onTime: hwStats.onTime,
        late: hwStats.late,
        pending: totalPending,
        completionRate: combinedRate,
      },
      performanceBySubject: progressData,
      skillGrowth: [],
      highlights,
      teacherComments: [],
      areasOfImprovement: progressData
        .filter(p => p.averageScore < 70)
        .map(p => ({
          subject: p.subject,
          currentScore: p.averageScore,
          suggestions: [`Review upcoming lessons for ${p.subject}`, `Practice more past assignments.`]
        }))
    };
  }, [studentAttendance, assignments, assignmentSubmissions, lessons, quizResults, progressData]);

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

  // Handle downloading report as PDF
  const handleDownloadReport = () => {
    if (!selectedChild) {
      alert('Please select a student first.');
      return;
    }

    const reportData = selectedReportPeriod === 'weekly' ? weeklyReportData : monthlyReportData;
    
    const studentInfo = {
      name: selectedChild.name,
      class: selectedChild.class,
      section: selectedChild.section,
      rollNo: selectedChild.rollNo
    };

    try {
      generateAndDownloadReport(
        { ...reportData, recentMarks },
        studentInfo,
        selectedReportPeriod,
        'School Management System'
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  const renderReports = () => {
    const reportData = selectedReportPeriod === 'weekly' ? weeklyReportData : monthlyReportData;
    const attendancePercentage = reportData.attendanceSummary.total > 0
      ? Math.round(
        (reportData.attendanceSummary.present / reportData.attendanceSummary.total) * 100
      )
      : 0;

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
          <div className="mt-2">
            <p className="text-gray-700">
              Report Period: <strong>{reportData.period}</strong>
            </p>
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
                    <p className="text-2xl text-gray-900">{subject.averageScore}%</p>
                    <p className="text-gray-600 text-sm">{subject.totalQuizzes} quizzes</p>
                  </div>
                </div>
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
              </div>
            ))}
          </div>
        </div>

        {/* Skill Growth Analysis */}
        {reportData.skillGrowth && reportData.skillGrowth.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Skill Growth Analysis
            </h3>
            <div className="space-y-4">
              {(reportData.skillGrowth as any[]).map((skill: any) => (
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
        )}

        {/* Recent Performance Updates (Individual Marks List) */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              Recent Performance Updates
            </h3>
            <span className="text-sm text-gray-500 font-medium">
              {recentMarks.length} updates this {selectedReportPeriod}
            </span>
          </div>

          <div className="space-y-4">
            {recentMarks.length > 0 ? (
              recentMarks.map((mark) => (
                <div key={mark.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        mark.type === 'exam' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {mark.type === 'exam' ? <Award className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {mark.type === 'exam' ? 'Exam Result' : 'Quiz Result'}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                             {new Date(mark.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="text-gray-900 font-bold mb-1">{mark.subject}</h4>
                        <p className="text-gray-600 text-sm">{mark.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:text-right">
                      <div className="flex-1 md:flex-none">
                        <p className="text-xs text-gray-500 mb-1">Marks / Grade</p>
                        <p className="text-gray-900 font-bold">
                          {mark.marks} {mark.grade && <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">{mark.grade}</span>}
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-white rounded-full border-4 border-purple-100 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-lg font-black text-purple-600 leading-none">{mark.score}</span>
                        <span className="text-[10px] text-purple-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-gray-500">No performance updates found for this period.</p>
                <p className="text-sm mt-1">Updates will appear here as teachers upload marks.</p>
              </div>
            )}
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
        {reportData.teacherComments && reportData.teacherComments.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Teacher Comments
            </h3>
            <div className="space-y-3">
              {(reportData.teacherComments as any[]).map((comment: any, idx: number) => (
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
        )}

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
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
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
    const scoredActivities = effectiveActivities.filter((a) => typeof a.quizScore === 'number');
    const averageScore = scoredActivities.length > 0
      ? scoredActivities.reduce((sum, a) => sum + (a.quizScore || 0), 0) / scoredActivities.length
      : null;

    return (
      <div className="space-y-6">
        {/* Holiday Alert */}
        {isHolidayToday && holidayInfo && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-md animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-red-900 font-bold">{holidayInfo.title}</h3>
                <p className="text-red-700 text-sm">{holidayInfo.description || 'School is closed today.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Child Info Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
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
            {/* Child Selector */}
            {children.length > 1 && (
              <select
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {children.map(c => (
                  <option key={c.id} value={c.id} className="text-gray-900">
                    {c.name} - Class {c.class}
                  </option>
                ))}
              </select>
            )}
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
            <div className={`p-4 rounded-lg border-2 ${
              todayAttendance.status === 'present' ? 'bg-green-50 border-green-200' :
              todayAttendance.status === 'absent' ? 'bg-red-50 border-red-200' :
              todayAttendance.status === 'late' ? 'bg-orange-50 border-orange-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {todayAttendance.status === 'present' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : todayAttendance.status === 'absent' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : todayAttendance.status === 'late' ? (
                  <Clock className="w-5 h-5 text-orange-600" />
                ) : (
                  <Activity className="w-5 h-5 text-gray-400" />
                )}
                <p className="text-gray-700 font-medium">Attendance</p>
              </div>
              <p className={`text-2xl font-bold capitalize ${
                todayAttendance.status === 'present' ? 'text-green-600' :
                todayAttendance.status === 'absent' ? 'text-red-600' :
                todayAttendance.status === 'late' ? 'text-orange-600' :
                'text-gray-500'
              }`}>
                {todayAttendance.status === 'not-marked' ? 'Not Marked' : todayAttendance.status}
              </p>
              {todayAttendance.status !== 'not-marked' && todayAttendance.time && todayAttendance.time !== '--:--' && (
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
                {averageScore !== null ? Math.round(averageScore) : '—'}%
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
                        <span className="text-xs">%</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        Accuracy
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

        {/* Upcoming Events Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">Upcoming School Events</h3>
                <button 
                  onClick={() => setCurrentView('calendar')}
                  className="text-purple-600 text-sm font-bold hover:underline"
                >
                  View Calendar
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 ${
                                event.type === 'holiday' ? 'bg-red-500' : 
                                event.type === 'exam' ? 'bg-orange-500' : 
                                'bg-purple-500'
                            }`}>
                                <span className="text-[10px] font-bold uppercase">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-lg font-black leading-none">{new Date(event.startDate).getDate()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{event.title}</h4>
                                <p className="text-xs text-gray-500 truncate">{event.description || 'School event'}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-8 text-center text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No upcoming events scheduled</p>
                    </div>
                )}
            </div>
        </div>

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

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    const rangeStr = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-purple-600" />
              Learning Timeline
            </h2>
            <p className="text-gray-600 font-medium">Track your child's daily lessons and quiz performance</p>
          </div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Back to Dashboard
          </button>
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
              <h3 className="text-lg font-bold text-gray-900">
                {rangeStr}
              </h3>
            </div>
          </div>
          <div className="text-sm font-medium text-purple-600 bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
            {weekTimeline.length} Lessons Found
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedByDate).length > 0 ? (
            Object.entries(groupedByDate)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([date, activities]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="h-px bg-gray-100 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                {activity.subject}
                              </span>
                              {activity.quizCompleted ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Score: {activity.quizScore}%
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Quiz Pending
                                </span>
                              )}
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{activity.topic}</h4>
                            {activity.teacherNote && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                <p className="text-gray-700 text-sm italic">
                                  <span className="font-bold text-blue-800 not-italic">Teacher's Note:</span> {activity.teacherNote}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-gray-300" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No Activities Found</h4>
              <p className="text-gray-500 text-center max-w-sm">
                There are no learning activities logged for this week.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Child Progress Tracking</h2>
            <p className="text-gray-600 mt-1">Real-time insights into attendance, homework, and exam performance</p>
          </div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
        <ParentDashboardChildProgress />
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
                {paidFees
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
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm mb-4"
        >
          ← Back to Dashboard
        </button>
        <ParentNotificationPanel 
          onClose={() => setCurrentView('dashboard')}
          maxHeight="max-h-[calc(100vh-250px)]"
          showHeader={true}
        />
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
    // Loading state while children data is being fetched
    if (childrenLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your children's data...</p>
        </div>
      );
    }

    // No children linked to this parent
    if (!selectedChild) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-md">
          <Users className="w-20 h-20 text-gray-300 mb-4" />
          <h2 className="text-gray-900 mb-2">No Children Linked</h2>
          <p className="text-gray-600 text-center max-w-md mb-4">
            No student records are linked to your account yet. Please contact your school administrator to link your child's record.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p><strong>Your email:</strong> {user?.email}</p>
            <p className="mt-1">The school admin needs to add this email as the parent email during admission.</p>
          </div>
        </div>
      );
    }

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
        if (!isAIEnabled) {
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-gray-900">AI Discussion Tips</h2>
                  <p className="text-gray-600">Conversation ideas based on your child's lessons</p>
                </div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-md p-10 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Features Disabled</h3>
                <p className="text-gray-500 max-w-md mx-auto">{getDisabledMessage()}</p>
              </div>
            </div>
          );
        }
        return renderAISuggestions();
      case 'calendar':
        return (
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">School Calendar</h2>
                        <p className="text-gray-500 font-medium">Academic schedule, holidays, and events.</p>
                    </div>
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-bold text-sm"
                    >
                        Back to Dashboard
                    </button>
                </div>
                <div className="flex-1">
                    <CalendarModule viewOnly={true} />
                </div>
            </div>
        );
      case 'chat':
        return (
          <ParentTeacherChat
            selectedChild={selectedChild as import('../types').Student}
            parentId={user?.id || ''}
          />
        );
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
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20 font-bold text-sm"
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
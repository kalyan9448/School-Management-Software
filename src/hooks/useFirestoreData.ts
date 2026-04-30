// React Hooks for Firestore Data Service
// Provides reactive async data access across all dashboards

import { useState, useEffect, useCallback } from 'react';
import dataService from '../utils/firestoreService';
import type {
  Student,
  Teacher,
  Class,
  Subject,
  AttendanceRecord,
  LessonLog,
  Assignment,
  AssignmentSubmission,
  Exam,
  ExamResult,
  FeePayment,
  Announcement,
  Enquiry,
  Event,
  Notification,
} from '../utils/firestoreService';

import type {
  SchoolSettings,
  AcademicYear,
  StudentEnrollment,
  FeeInvoice,
  AuditLog,
} from '../types';

// Re-export types for consumers
export type {
  Student,
  Teacher,
  Class,
  Subject,
  AttendanceRecord,
  LessonLog,
  Assignment,
  AssignmentSubmission,
  Exam,
  ExamResult,
  FeePayment,
  Announcement,
  Enquiry,
  Event,
  Notification,
  SchoolSettings,
  AcademicYear,
  StudentEnrollment,
  FeeInvoice,
  AuditLog,
};

// Hook for students data
export const useStudents = (filters?: {
  class?: string;
  section?: string;
  parentId?: string;
  childrenIds?: string[];
  parentEmail?: string;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const childrenIdsKey = filters?.childrenIds?.join(',') || '';

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let data: Student[];
      if (filters?.class && filters?.section) {
        data = await dataService.student.getByClass(filters.class, filters.section);
      } else if (filters?.parentId || filters?.childrenIds?.length || filters?.parentEmail) {
        // Fetch from all available identifiers and merge (deduplicated)
        const [byParentId, byIds, byEmail] = await Promise.all([
          filters.parentId ? dataService.student.getByParentId(filters.parentId) : Promise.resolve([]),
          filters.childrenIds?.length ? dataService.student.getByIds(filters.childrenIds) : Promise.resolve([]),
          filters.parentEmail ? dataService.student.getByParentEmail(filters.parentEmail) : Promise.resolve([]),
        ]);

        const merged = [...byParentId, ...byIds, ...byEmail];
        const seen = new Set<string>();
        data = merged.filter(s => {
          if (!s.id || seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });

        // --- Self-Healing Logic ---
        // If we found students via email that have an incorrect parentId, update them
        if (filters.parentId) {
          const incorrectParentStudents = data.filter(s => s.parentId !== filters.parentId);
          if (incorrectParentStudents.length > 0) {
            console.log(`[useStudents] Found ${incorrectParentStudents.length} students with mismatched parentId. Healing...`);
            Promise.all(incorrectParentStudents.map(s => 
              dataService.student.update(s.id, { parentId: filters.parentId })
            )).catch(err => console.error('[useStudents] Self-healing failed:', err));
          }
        }
        // --------------------------
      } else {
        data = await dataService.student.getAll();
      }
      setStudents(data);
    } catch (err) {
      console.error('useStudents error:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.class, filters?.section, filters?.parentId, childrenIdsKey, filters?.parentEmail]);

  useEffect(() => { refresh(); }, [refresh]);
  return { students, loading, refresh };
};

// Hook for teachers data
export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTeachers(await dataService.teacher.getAll());
    } catch (err) {
      console.error('useTeachers error:', err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { teachers, loading, refresh };
};

// Hook for classes data
export const useClasses = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setClasses(await dataService.class.getAll());
    } catch (err) {
      console.error('useClasses error:', err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { classes, loading, refresh };
};

// Hook for subjects data
export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSubjects(await dataService.subject.getAll());
    } catch (err) {
      console.error('useSubjects error:', err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { subjects, loading, refresh };
};

// Hook for attendance data
export const useAttendance = (filters?: {
  studentId?: string;
  date?: string;
  class?: string;
  section?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    if (!filters) {
      setAttendance([]);
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Clear previous data to avoid showing stale results for other children
    setAttendance([]);
    setStats(null);

    try {
      let data: AttendanceRecord[];
      if (filters?.studentId) {
        data = await dataService.attendance.getByStudent(filters.studentId, filters.startDate, filters.endDate);
        if (isCancelled?.()) return;
        
        const studentStats = await dataService.attendance.getAttendanceStats(
          filters.studentId,
          filters.startDate?.substring(0, 7),
        );
        if (isCancelled?.()) return;
        setStats(studentStats);
      } else if (filters?.class && filters?.section && filters?.date) {
        data = await dataService.attendance.getByClass(filters.class, filters.section, filters.date);
      } else if (filters?.date) {
        data = await dataService.attendance.getByDate(filters.date);
      } else {
        data = await dataService.attendance.getAll();
      }
      
      if (isCancelled?.()) { console.log('[useAttendance] Fetch cancelled.'); return; }
      console.log(`[useAttendance] Finished fetching ${data.length} records.`);
      setAttendance(data);
    } catch (err) {
      console.error('useAttendance error:', err);
      if (!isCancelled?.()) setAttendance([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.studentId, filters?.date, filters?.class, filters?.section, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { attendance, stats, loading, refresh };
};

// Hook for lessons data
export const useLessons = (filters?: {
  teacherId?: string;
  class?: string;
  section?: string;
  date?: string;
}) => {
  const [lessons, setLessons] = useState<LessonLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    if (!filters) {
      setLessons([]);
      setLoading(false);
      return;
    }
    console.log('[useLessons] Refreshing data...');
    setLoading(true);
    setLessons([]); // Clear stale data

    try {
      let data: LessonLog[];
      if (filters?.teacherId) {
        data = await dataService.lesson.getByTeacher(filters.teacherId, filters.date);
      } else if (filters?.class && filters?.section) {
        data = await dataService.lesson.getByClass(filters.class, filters.section);
      } else if (filters?.date) {
        data = await dataService.lesson.getByDate(filters.date);
      } else {
        data = await dataService.lesson.getAll();
      }
      
      if (isCancelled?.()) { console.log('[useLessons] Fetch cancelled.'); return; }
      console.log(`[useLessons] Finished fetching ${data.length} lessons.`);
      setLessons(data);
    } catch (err) {
      console.error('useLessons error:', err);
      if (!isCancelled?.()) setLessons([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.teacherId, filters?.class, filters?.section, filters?.date]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { lessons, loading, refresh };
};

// Hook for assignments data
export const useAssignments = (filters?: {
  class?: string;
  section?: string;
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    if (!filters) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    console.log('[useAssignments] Refreshing data...');
    setLoading(true);
    setAssignments([]);

    try {
      const data = (filters?.class && filters?.section)
        ? await dataService.assignment.getByClass(filters.class, filters.section)
        : await dataService.assignment.getAll();
      
      if (isCancelled?.()) { console.log('[useAssignments] Fetch cancelled.'); return; }
      console.log(`[useAssignments] Finished fetching ${data.length} assignments.`);
      setAssignments(data);
    } catch (err) {
      console.error('useAssignments error:', err);
      if (!isCancelled?.()) setAssignments([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.class, filters?.section]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { assignments, loading, refresh };
};

// Hook for assignment submissions
export const useAssignmentSubmissions = (filters?: {
  studentId?: string;
  assignmentId?: string;
}) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    console.log('[useAssignmentSubmissions] Refreshing data...');
    setLoading(true);
    setSubmissions([]); // Clear stale data

    try {
      let data: AssignmentSubmission[] = [];
      if (filters?.assignmentId) {
        data = await dataService.assignmentSubmission.getByAssignment(filters.assignmentId);
      } else if (filters?.studentId) {
        data = await dataService.assignmentSubmission.getByStudent(filters.studentId);
      }
      
      if (isCancelled?.()) { console.log('[useAssignmentSubmissions] Fetch cancelled.'); return; }
      console.log(`[useAssignmentSubmissions] Finished fetching ${data.length} submissions.`);
      setSubmissions(data);
    } catch (err) {
      console.error('useAssignmentSubmissions error:', err);
      if (!isCancelled?.()) setSubmissions([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.studentId, filters?.assignmentId]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { submissions, loading, refresh };
};

// Hook for exams data
export const useExams = (filters?: {
  class?: string;
  section?: string;
  upcoming?: boolean;
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    if (!filters) {
      setExams([]);
      setLoading(false);
      return;
    }
    console.log('[useExams] Refreshing data...');
    setLoading(true);
    setExams([]); // Clear stale data

    try {
      let data: Exam[];
      if (filters?.upcoming) {
        data = await dataService.exam.getUpcoming();
      } else if (filters?.class && filters?.section) {
        data = await dataService.exam.getByClass(filters.class, filters.section);
      } else {
        data = await dataService.exam.getAll();
      }
      
      if (isCancelled?.()) { console.log('[useExams] Fetch cancelled.'); return; }
      console.log(`[useExams] Finished fetching ${data.length} exams.`);
      setExams(data);
    } catch (err) {
      console.error('useExams error:', err);
      if (!isCancelled?.()) setExams([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.upcoming, filters?.class, filters?.section]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { exams, loading, refresh };
};

// Hook for exam results
export const useExamResults = (filters?: {
  studentId?: string;
  examId?: string;
}) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    if (!filters) {
      setResults([]);
      setLoading(false);
      return;
    }
    console.log('[useExamResults] Refreshing data...');
    setLoading(true);
    setResults([]); // Clear stale data

    try {
      let data: ExamResult[] = [];
      if (filters?.studentId && filters?.examId) {
        const examResults = await dataService.examResult.getByExam(filters.examId);
        data = examResults.filter(r => r.studentId === filters.studentId);
      } else if (filters?.studentId) {
        data = await dataService.examResult.getByStudent(filters.studentId);
      }
      
      if (isCancelled?.()) { console.log('[useExamResults] Fetch cancelled.'); return; }
      console.log(`[useExamResults] Finished fetching ${data.length} results.`);
      setResults(data);
    } catch (err) {
      console.error('useExamResults error:', err);
      if (!isCancelled?.()) setResults([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.studentId, filters?.examId]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { results, loading, refresh };
};

// Hook for fee payments
export const useFeePayments = (filters?: {
  studentId?: string;
}) => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    if (!filters) {
      setPayments([]);
      setLoading(false);
      return;
    }
    console.log('[useFeePayments] Refreshing data...');
    setLoading(true);
    setPayments([]); // Clear stale data

    try {
      const data = filters?.studentId
        ? await dataService.fee.getPaymentsByStudent(filters.studentId)
        : await dataService.fee.getAllPayments();
      
      if (isCancelled?.()) { console.log('[useFeePayments] Fetch cancelled.'); return; }
      console.log(`[useFeePayments] Finished fetching ${data.length} payments.`);
      setPayments(data);
    } catch (err) {
      console.error('useFeePayments error:', err);
      if (!isCancelled?.()) setPayments([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.studentId]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { payments, loading, refresh };
};

// Hook for announcements
export const useAnnouncements = (filters?: {
  role?: string;
  class?: string;
  section?: string;
  activeOnly?: boolean;
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    console.log('[useAnnouncements] Refreshing data...');
    setLoading(true);
    try {
      const data = await dataService.announcement.getForUser(
        filters?.role || 'student',
        filters?.class,
        filters?.section,
      );
      console.log(`[useAnnouncements] Finished fetching ${data.length} announcements.`);
      setAnnouncements(data);
    } catch (err) {
      console.error('useAnnouncements error:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.role, filters?.class, filters?.section, filters?.activeOnly]);

  useEffect(() => { refresh(); }, [refresh]);
  return { announcements, loading, refresh };
};

// Hook for enquiries
export const useEnquiries = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    console.log('[useEnquiries] Refreshing data...');
    setLoading(true);
    try {
      const data = await dataService.enquiry.getAll();
      console.log(`[useEnquiries] Finished fetching ${data.length} enquiries.`);
      setEnquiries(data);
    } catch (err) {
      console.error('useEnquiries error:', err);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { enquiries, loading, refresh };
};

// Hook for events
export const useEvents = (filters?: {
  upcoming?: boolean;
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    console.log('[useEvents] Refreshing data...');
    setLoading(true);
    try {
      const data = filters?.upcoming
        ? await dataService.event.getUpcoming()
        : await dataService.event.getAll();
      console.log(`[useEvents] Finished fetching ${data.length} events.`);
      setEvents(data);
    } catch (err) {
      console.error('useEvents error:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.upcoming]);

  useEffect(() => { refresh(); }, [refresh]);
  return { events, loading, refresh };
};

// Hook for notifications
export const useNotifications = (
  userId?: string, 
  role?: string, 
  userClass?: string, 
  userSection?: string,
  allClasses?: { class: string; section: string }[]
) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await dataService.notification.getByUser(userId, role, userClass, userSection, allClasses);
      setNotifications(data);
      setUnreadCount(await dataService.notification.getUnreadCount(userId, role, userClass, userSection, allClasses));
    } catch (err) {
      console.error('useNotifications error:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId, role, userClass, userSection, allClasses]);

  useEffect(() => { refresh(); }, [refresh]);

  const markAsRead = useCallback(async (id: string) => {
    await dataService.notification.markAsRead(id);
    refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    if (userId) {
      await dataService.notification.markAllAsRead(userId);
      refresh();
    }
  }, [userId, refresh]);

  return { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead };
};

// Hook for dashboard statistics
export const useDashboardStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await dataService.statistics.getDashboardStats());
    } catch (err) {
      console.error('useDashboardStats error:', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { stats, loading, refresh };
};

// Hook for student performance
export const useStudentPerformance = (studentId?: string) => {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    if (!studentId) {
      setPerformance(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setPerformance(null); // Clear stale data

    try {
      const data = await dataService.statistics.getStudentPerformance(studentId);
      if (isCancelled?.()) return;
      setPerformance(data);
    } catch (err) {
      console.error('useStudentPerformance error:', err);
      if (!isCancelled?.()) setPerformance(null);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { performance, loading, refresh };
};

// Hook for class statistics
export const useClassStatistics = (className?: string, section?: string) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!className || !section) {
      setStatistics(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setStatistics(await dataService.statistics.getClassStatistics(className, section));
    } catch (err) {
      console.error('useClassStatistics error:', err);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [className, section]);

  useEffect(() => { refresh(); }, [refresh]);
  return { statistics, loading, refresh };
};

// Hook for school settings
export const useSchoolSettings = (schoolId?: string) => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!schoolId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSettings(await dataService.schoolSettings.getBySchool(schoolId));
    } catch (err) {
      console.error('useSchoolSettings error:', err);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { settings, loading, refresh };
};

// Hook for academic years
export const useAcademicYears = (schoolId?: string) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!schoolId) {
      setAcademicYears([]);
      setCurrentYear(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const years = await dataService.academicYear.getBySchool(schoolId);
      setAcademicYears(years);
      setCurrentYear(years.find(y => y.isCurrent) || null);
    } catch (err) {
      console.error('useAcademicYears error:', err);
      setAcademicYears([]);
      setCurrentYear(null);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { academicYears, currentYear, loading, refresh };
};

// Hook for student enrollments
export const useStudentEnrollments = (filters?: {
  studentId?: string;
  classId?: string;
  academicYear?: string;
}) => {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let data: StudentEnrollment[];
      if (filters?.studentId) {
        data = await dataService.studentEnrollment.getByStudent(filters.studentId);
      } else if (filters?.classId && filters?.academicYear) {
        data = await dataService.studentEnrollment.getByClass(filters.classId, filters.academicYear);
      } else {
        data = await dataService.studentEnrollment.getAll();
      }
      setEnrollments(data);
    } catch (err) {
      console.error('useStudentEnrollments error:', err);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.classId, filters?.academicYear]);

  useEffect(() => { refresh(); }, [refresh]);
  return { enrollments, loading, refresh };
};

// Hook for fee invoices
export const useFeeInvoices = (filters?: {
  studentId?: string;
  class?: string;
  section?: string;
  academicYear?: string;
  pendingOnly?: boolean;
}) => {
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (isCancelled?: () => boolean) => {
    setLoading(true);
    setInvoices([]); // Clear stale data

    try {
      let data: FeeInvoice[];
      if (filters?.pendingOnly) {
        data = await dataService.feeInvoice.getPending();
      } else if (filters?.studentId) {
        data = await dataService.feeInvoice.getByStudent(filters.studentId);
      } else if (filters?.class && filters?.section && filters?.academicYear) {
        data = await dataService.feeInvoice.getByClass(filters.class, filters.section, filters.academicYear);
      } else {
        data = await dataService.feeInvoice.getAll();
      }
      
      if (isCancelled?.()) return;
      setInvoices(data);
    } catch (err) {
      console.error('useFeeInvoices error:', err);
      if (!isCancelled?.()) setInvoices([]);
    } finally {
      if (!isCancelled?.()) setLoading(false);
    }
  }, [filters?.studentId, filters?.class, filters?.section, filters?.academicYear, filters?.pendingOnly]);

  useEffect(() => {
    let cancelled = false;
    refresh(() => cancelled);
    return () => { cancelled = true; };
  }, [refresh]);

  return { invoices, loading, refresh };
};

// Hook for audit logs
export const useAuditLogs = (filters?: {
  schoolId?: string;
  userId?: string;
  collectionName?: string;
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let data: AuditLog[];
      if (filters?.userId) {
        data = await dataService.auditLog.getByUser(filters.userId);
      } else if (filters?.collectionName) {
        data = await dataService.auditLog.getByCollection(filters.collectionName);
      } else if (filters?.schoolId) {
        data = await dataService.auditLog.getBySchool(filters.schoolId);
      } else {
        data = await dataService.auditLog.getAll();
      }
      setLogs(data);
    } catch (err) {
      console.error('useAuditLogs error:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.schoolId, filters?.userId, filters?.collectionName]);

  useEffect(() => { refresh(); }, [refresh]);
  return { logs, loading, refresh };
};

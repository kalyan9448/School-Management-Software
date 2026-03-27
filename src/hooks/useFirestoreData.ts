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
      } else if (filters?.parentId) {
        // Try parentId first, fall back to childrenIds, then parentEmail
        data = await dataService.student.getByParentId(filters.parentId);
        if (data.length === 0 && filters.childrenIds?.length) {
          data = await dataService.student.getByIds(filters.childrenIds);
        }
        if (data.length === 0 && filters.parentEmail) {
          data = await dataService.student.getByParentEmail(filters.parentEmail);
        }
      } else if (filters?.childrenIds?.length) {
        data = await dataService.student.getByIds(filters.childrenIds);
      } else if (filters?.parentEmail) {
        data = await dataService.student.getByParentEmail(filters.parentEmail);
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

  const refresh = useCallback(async () => {
    if (!filters) {
      setAttendance([]);
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data: AttendanceRecord[];
      if (filters?.studentId) {
        data = await dataService.attendance.getByStudent(filters.studentId, filters.startDate, filters.endDate);
        const studentStats = await dataService.attendance.getAttendanceStats(
          filters.studentId,
          filters.startDate?.substring(0, 7),
        );
        setStats(studentStats);
      } else if (filters?.class && filters?.section && filters?.date) {
        data = await dataService.attendance.getByClass(filters.class, filters.section, filters.date);
      } else if (filters?.date) {
        data = await dataService.attendance.getByDate(filters.date);
      } else {
        data = await dataService.attendance.getAll();
      }
      setAttendance(data);
    } catch (err) {
      console.error('useAttendance error:', err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.date, filters?.class, filters?.section, filters?.startDate, filters?.endDate]);

  useEffect(() => { refresh(); }, [refresh]);
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

  const refresh = useCallback(async () => {
    if (!filters) {
      setLessons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
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
      setLessons(data);
    } catch (err) {
      console.error('useLessons error:', err);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.teacherId, filters?.class, filters?.section, filters?.date]);

  useEffect(() => { refresh(); }, [refresh]);
  return { lessons, loading, refresh };
};

// Hook for assignments data
export const useAssignments = (filters?: {
  class?: string;
  section?: string;
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!filters) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = (filters?.class && filters?.section)
        ? await dataService.assignment.getByClass(filters.class, filters.section)
        : await dataService.assignment.getAll();
      setAssignments(data);
    } catch (err) {
      console.error('useAssignments error:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.class, filters?.section]);

  useEffect(() => { refresh(); }, [refresh]);
  return { assignments, loading, refresh };
};

// Hook for assignment submissions
export const useAssignmentSubmissions = (filters?: {
  studentId?: string;
  assignmentId?: string;
}) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let data: AssignmentSubmission[] = [];
      if (filters?.assignmentId) {
        data = await dataService.assignmentSubmission.getByAssignment(filters.assignmentId);
      } else if (filters?.studentId) {
        data = await dataService.assignmentSubmission.getByStudent(filters.studentId);
      }
      setSubmissions(data);
    } catch (err) {
      console.error('useAssignmentSubmissions error:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.assignmentId]);

  useEffect(() => { refresh(); }, [refresh]);
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

  const refresh = useCallback(async () => {
    if (!filters) {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data: Exam[];
      if (filters?.upcoming) {
        data = await dataService.exam.getUpcoming();
      } else if (filters?.class && filters?.section) {
        data = await dataService.exam.getByClass(filters.class, filters.section);
      } else {
        data = await dataService.exam.getAll();
      }
      setExams(data);
    } catch (err) {
      console.error('useExams error:', err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.upcoming, filters?.class, filters?.section]);

  useEffect(() => { refresh(); }, [refresh]);
  return { exams, loading, refresh };
};

// Hook for exam results
export const useExamResults = (filters?: {
  studentId?: string;
  examId?: string;
}) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!filters) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data: ExamResult[] = [];
      if (filters?.studentId && filters?.examId) {
        const examResults = await dataService.examResult.getByExam(filters.examId);
        data = examResults.filter(r => r.studentId === filters.studentId);
      } else if (filters?.studentId) {
        data = await dataService.examResult.getByStudent(filters.studentId);
      }
      setResults(data);
    } catch (err) {
      console.error('useExamResults error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.examId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { results, loading, refresh };
};

// Hook for fee payments
export const useFeePayments = (filters?: {
  studentId?: string;
}) => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!filters) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = filters?.studentId
        ? await dataService.fee.getPaymentsByStudent(filters.studentId)
        : await dataService.fee.getAllPayments();
      setPayments(data);
    } catch (err) {
      console.error('useFeePayments error:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId]);

  useEffect(() => { refresh(); }, [refresh]);
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
    setLoading(true);
    try {
      const data = await dataService.announcement.getForUser(
        filters?.role || 'student',
        filters?.class,
        filters?.section,
      );
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
    setLoading(true);
    try {
      setEnquiries(await dataService.enquiry.getAll());
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
    setLoading(true);
    try {
      const data = filters?.upcoming
        ? await dataService.event.getUpcoming()
        : await dataService.event.getAll();
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

  const refresh = useCallback(async () => {
    if (!studentId) {
      setPerformance(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPerformance(await dataService.statistics.getStudentPerformance(studentId));
    } catch (err) {
      console.error('useStudentPerformance error:', err);
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { refresh(); }, [refresh]);
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

  const refresh = useCallback(async () => {
    setLoading(true);
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
      setInvoices(data);
    } catch (err) {
      console.error('useFeeInvoices error:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.class, filters?.section, filters?.academicYear, filters?.pendingOnly]);

  useEffect(() => { refresh(); }, [refresh]);
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

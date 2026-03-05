// React Hook for Data Service
// Provides reactive data access across all dashboards

import { useState, useEffect, useCallback } from 'react';
import dataService, {
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
} from '../utils/centralDataService';

// Hook for students data
export const useStudents = (filters?: {
  class?: string;
  section?: string;
  parentId?: string;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      let data: Student[] = [];

      if (filters?.class && filters?.section) {
        data = dataService.student.getByClass(filters.class, filters.section);
      } else if (filters?.parentId) {
        data = dataService.student.getByParentId(filters.parentId);
      } else {
        data = dataService.student.getAll();
      }

      setStudents(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.class, filters?.section, filters?.parentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { students, loading, refresh };
};

// Hook for teachers data
export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = dataService.teacher.getAll();
      setTeachers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { teachers, loading, refresh };
};

// Hook for classes data
export const useClasses = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = dataService.class.getAll();
      setClasses(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { classes, loading, refresh };
};

// Hook for subjects data
export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = dataService.subject.getAll();
      setSubjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      let data: AttendanceRecord[] = [];

      if (filters?.studentId) {
        data = dataService.attendance.getByStudent(
          filters.studentId,
          filters.startDate,
          filters.endDate
        );

        // Get stats for student
        const studentStats = dataService.attendance.getAttendanceStats(
          filters.studentId,
          filters.startDate?.substring(0, 7) // Get month from date
        );
        setStats(studentStats);
      } else if (filters?.date) {
        data = dataService.attendance.getByDate(filters.date);
      } else if (filters?.class && filters?.section && filters?.date) {
        data = dataService.attendance.getByClass(filters.class, filters.section, filters.date);
      } else {
        data = dataService.attendance.getAll();
      }

      setAttendance(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.date, filters?.class, filters?.section, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    refresh();
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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      let data: LessonLog[] = [];

      if (filters?.teacherId) {
        data = dataService.lesson.getByTeacher(filters.teacherId, filters.date);
      } else if (filters?.class && filters?.section) {
        data = dataService.lesson.getByClass(filters.class, filters.section);
      } else if (filters?.date) {
        data = dataService.lesson.getByDate(filters.date);
      } else {
        data = dataService.lesson.getAll();
      }

      setLessons(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.teacherId, filters?.class, filters?.section, filters?.date]);

  useEffect(() => {
    refresh();
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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      let data: Assignment[] = [];

      if (filters?.class && filters?.section) {
        data = dataService.assignment.getByClass(filters.class, filters.section);
      } else {
        data = dataService.assignment.getAll();
      }

      setAssignments(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.class, filters?.section]);

  useEffect(() => {
    refresh();
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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      let data: AssignmentSubmission[] = [];

      if (filters?.assignmentId) {
        data = dataService.assignmentSubmission.getByAssignment(filters.assignmentId);
      } else if (filters?.studentId) {
        data = dataService.assignmentSubmission.getByStudent(filters.studentId);
      }

      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.assignmentId]);

  useEffect(() => {
    refresh();
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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      let data: Exam[] = [];

      if (filters?.upcoming) {
        data = dataService.exam.getUpcoming();
      } else if (filters?.class && filters?.section) {
        data = dataService.exam.getByClass(filters.class, filters.section);
      } else {
        data = dataService.exam.getAll();
      }

      setExams(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.upcoming, filters?.class, filters?.section]);

  useEffect(() => {
    refresh();
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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      let data: ExamResult[] = [];

      if (filters?.studentId && filters?.examId) {
        const results = dataService.examResult.getByExam(filters.examId);
        data = results.filter(r => r.studentId === filters.studentId);
      } else if (filters?.studentId) {
        data = dataService.examResult.getByStudent(filters.studentId);
      }

      setResults(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.examId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { results, loading, refresh };
};

// Hook for fee payments
export const useFeePayments = (filters?: {
  studentId?: string;
}) => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = filters?.studentId
        ? dataService.fee.getPaymentsByStudent(filters.studentId)
        : dataService.fee.getAllPayments();
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId]);

  useEffect(() => {
    refresh();
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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = dataService.announcement.getForUser(
        filters?.role || 'student',
        filters?.class,
        filters?.section
      );
      setAnnouncements(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.role, filters?.class, filters?.section, filters?.activeOnly]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { announcements, loading, refresh };
};

// Hook for enquiries
export const useEnquiries = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = dataService.enquiry.getAll();
      setEnquiries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { enquiries, loading, refresh };
};

// Hook for events
export const useEvents = (filters?: {
  upcoming?: boolean;
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = filters?.upcoming
        ? dataService.event.getUpcoming()
        : dataService.event.getAll();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, [filters?.upcoming]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, refresh };
};

// Hook for notifications
export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = dataService.notification.getByUser(userId);
      setNotifications(data);
      setUnreadCount(dataService.notification.getUnreadCount(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markAsRead = useCallback((id: string) => {
    dataService.notification.markAsRead(id);
    refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(() => {
    if (userId) {
      dataService.notification.markAllAsRead(userId);
      refresh();
    }
  }, [userId, refresh]);

  return { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead };
};

// Hook for dashboard statistics
export const useDashboardStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const data = dataService.statistics.getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
};

// Hook for student performance
export const useStudentPerformance = (studentId?: string) => {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!studentId) {
      setPerformance(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = dataService.statistics.getStudentPerformance(studentId);
      setPerformance(data);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { performance, loading, refresh };
};

// Hook for class statistics
export const useClassStatistics = (className?: string, section?: string) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!className || !section) {
      setStatistics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = dataService.statistics.getClassStatistics(className, section);
      setStatistics(data);
    } finally {
      setLoading(false);
    }
  }, [className, section]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { statistics, loading, refresh };
};

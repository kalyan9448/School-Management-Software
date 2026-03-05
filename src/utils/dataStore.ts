// Centralized data store for demo mode
// This allows data to flow between Teacher, Parent, and Admin dashboards

interface Student {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  parentId?: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  time: string;
  markedBy: string;
}

interface LessonLog {
  id: string;
  date: string;
  classId: string;
  class: string;
  section: string;
  subject: string;
  topic: string;
  objectives: string[];
  studentsNeedingAttention: string[];
  notes: string;
  teacherId: string;
  teacherName: string;
}

interface Quiz {
  id: string;
  lessonId: string;
  classId: string;
  class: string;
  section: string;
  subject: string;
  topic: string;
  questions: QuizQuestion[];
  assignedDate: string;
  dueDate: string;
  assignedBy: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  total: number;
  completedDate: string;
  answers: number[];
}

interface StudentNote {
  id: string;
  studentId: string;
  type: 'achievement' | 'concern' | 'behavior';
  note: string;
  date: string;
  teacherId: string;
  teacherName: string;
}

interface Notification {
  id: string;
  userId: string;
  type: 'attendance' | 'progress' | 'fee' | 'announcement';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

// Initialize demo data
const initializeDemoData = () => {
  const students: Student[] = [
    { id: '1', name: 'Aarav Sharma', rollNo: '001', class: 'Nursery', section: 'A', parentId: 'parent1' },
    { id: '2', name: 'Diya Patel', rollNo: '002', class: 'Nursery', section: 'A', parentId: 'parent2' },
    { id: '3', name: 'Arjun Singh', rollNo: '003', class: 'Nursery', section: 'A', parentId: 'parent3' },
    { id: '4', name: 'Ananya Gupta', rollNo: '004', class: 'Nursery', section: 'A', parentId: 'parent4' },
    { id: '5', name: 'Vivaan Kumar', rollNo: '005', class: 'Nursery', section: 'A', parentId: 'parent5' },
    { id: '6', name: 'Saanvi Reddy', rollNo: '006', class: 'LKG', section: 'B', parentId: 'parent6' },
    { id: '7', name: 'Ishaan Verma', rollNo: '007', class: 'LKG', section: 'B', parentId: 'parent7' },
    { id: '8', name: 'Aanya Rao', rollNo: '008', class: 'LKG', section: 'B', parentId: 'parent8' },
  ];

  if (!localStorage.getItem('demo_students')) {
    localStorage.setItem('demo_students', JSON.stringify(students));
  }

  if (!localStorage.getItem('demo_attendance')) {
    localStorage.setItem('demo_attendance', JSON.stringify([]));
  }

  if (!localStorage.getItem('demo_lessons')) {
    localStorage.setItem('demo_lessons', JSON.stringify([]));
  }

  if (!localStorage.getItem('demo_quizzes')) {
    localStorage.setItem('demo_quizzes', JSON.stringify([]));
  }

  if (!localStorage.getItem('demo_quiz_results')) {
    localStorage.setItem('demo_quiz_results', JSON.stringify([]));
  }

  if (!localStorage.getItem('demo_student_notes')) {
    localStorage.setItem('demo_student_notes', JSON.stringify([]));
  }

  if (!localStorage.getItem('demo_notifications')) {
    localStorage.setItem('demo_notifications', JSON.stringify([]));
  }
};

// Initialize on load
initializeDemoData();

// Helper function to generate ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 11);
};

// ==================== STUDENTS ====================
export const studentsStore = {
  getAll: (): Student[] => {
    const data = localStorage.getItem('demo_students');
    return data ? JSON.parse(data) : [];
  },

  getByClass: (className: string, section: string): Student[] => {
    const students = studentsStore.getAll();
    return students.filter(s => s.class === className && s.section === section);
  },

  getById: (id: string): Student | null => {
    const students = studentsStore.getAll();
    return students.find(s => s.id === id) || null;
  },

  getByParentId: (parentId: string): Student | null => {
    const students = studentsStore.getAll();
    return students.find(s => s.parentId === parentId) || null;
  },
};

// ==================== ATTENDANCE ====================
export const attendanceStore = {
  getAll: (): AttendanceRecord[] => {
    const data = localStorage.getItem('demo_attendance');
    return data ? JSON.parse(data) : [];
  },

  getByDate: (date: string): AttendanceRecord[] => {
    const records = attendanceStore.getAll();
    return records.filter(r => r.date === date);
  },

  getByStudent: (studentId: string, date: string): AttendanceRecord | null => {
    const records = attendanceStore.getAll();
    return records.find(r => r.studentId === studentId && r.date === date) || null;
  },

  save: (records: Partial<AttendanceRecord>[]): void => {
    const existing = attendanceStore.getAll();
    const date = records[0]?.date || new Date().toISOString().split('T')[0];
    
    // Remove existing records for this date
    const filtered = existing.filter(r => r.date !== date);
    
    // Add new records
    const newRecords: AttendanceRecord[] = records.map(r => ({
      id: r.id || generateId(),
      studentId: r.studentId!,
      date: r.date!,
      status: r.status!,
      time: r.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      markedBy: r.markedBy || 'teacher',
    }));

    localStorage.setItem('demo_attendance', JSON.stringify([...filtered, ...newRecords]));

    // Create notifications for parents
    newRecords.forEach(record => {
      const student = studentsStore.getById(record.studentId);
      if (student?.parentId && record.status === 'present') {
        notificationsStore.create({
          userId: student.parentId,
          type: 'attendance',
          title: 'Child Arrived at School',
          message: `${student.name} arrived at school at ${record.time}`,
          date: record.date,
        });
      }
    });
  },
};

// ==================== LESSONS ====================
export const lessonsStore = {
  getAll: (): LessonLog[] => {
    const data = localStorage.getItem('demo_lessons');
    return data ? JSON.parse(data) : [];
  },

  getByDate: (date: string): LessonLog[] => {
    const lessons = lessonsStore.getAll();
    return lessons.filter(l => l.date === date);
  },

  getByStudent: (studentClass: string, studentSection: string, date: string): LessonLog[] => {
    const lessons = lessonsStore.getAll();
    return lessons.filter(l => 
      l.class === studentClass && 
      l.section === studentSection && 
      l.date === date
    );
  },

  create: (lesson: Partial<LessonLog>): LessonLog => {
    const lessons = lessonsStore.getAll();
    const newLesson: LessonLog = {
      id: generateId(),
      date: lesson.date || new Date().toISOString().split('T')[0],
      classId: lesson.classId || '',
      class: lesson.class || '',
      section: lesson.section || '',
      subject: lesson.subject || '',
      topic: lesson.topic || '',
      objectives: lesson.objectives || [],
      studentsNeedingAttention: lesson.studentsNeedingAttention || [],
      notes: lesson.notes || '',
      teacherId: lesson.teacherId || '',
      teacherName: lesson.teacherName || '',
    };

    lessons.push(newLesson);
    localStorage.setItem('demo_lessons', JSON.stringify(lessons));

    return newLesson;
  },
};

// ==================== QUIZZES ====================
export const quizzesStore = {
  getAll: (): Quiz[] => {
    const data = localStorage.getItem('demo_quizzes');
    return data ? JSON.parse(data) : [];
  },

  getByClass: (className: string, section: string): Quiz[] => {
    const quizzes = quizzesStore.getAll();
    return quizzes.filter(q => q.class === className && q.section === section);
  },

  getById: (id: string): Quiz | null => {
    const quizzes = quizzesStore.getAll();
    return quizzes.find(q => q.id === id) || null;
  },

  create: (quiz: Partial<Quiz>): Quiz => {
    const quizzes = quizzesStore.getAll();
    const newQuiz: Quiz = {
      id: generateId(),
      lessonId: quiz.lessonId || '',
      classId: quiz.classId || '',
      class: quiz.class || '',
      section: quiz.section || '',
      subject: quiz.subject || '',
      topic: quiz.topic || '',
      questions: quiz.questions || [],
      assignedDate: quiz.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: quiz.dueDate || new Date().toISOString().split('T')[0],
      assignedBy: quiz.assignedBy || '',
    };

    quizzes.push(newQuiz);
    localStorage.setItem('demo_quizzes', JSON.stringify(quizzes));

    return newQuiz;
  },
};

// ==================== QUIZ RESULTS ====================
export const quizResultsStore = {
  getAll: (): QuizResult[] => {
    const data = localStorage.getItem('demo_quiz_results');
    return data ? JSON.parse(data) : [];
  },

  getByQuiz: (quizId: string): QuizResult[] => {
    const results = quizResultsStore.getAll();
    return results.filter(r => r.quizId === quizId);
  },

  getByStudent: (studentId: string, quizId: string): QuizResult | null => {
    const results = quizResultsStore.getAll();
    return results.find(r => r.studentId === studentId && r.quizId === quizId) || null;
  },

  create: (result: Partial<QuizResult>): QuizResult => {
    const results = quizResultsStore.getAll();
    const newResult: QuizResult = {
      id: generateId(),
      quizId: result.quizId || '',
      studentId: result.studentId || '',
      score: result.score || 0,
      total: result.total || 0,
      completedDate: result.completedDate || new Date().toISOString().split('T')[0],
      answers: result.answers || [],
    };

    results.push(newResult);
    localStorage.setItem('demo_quiz_results', JSON.stringify(results));

    // Create notification for parent
    const student = studentsStore.getById(newResult.studentId);
    if (student?.parentId) {
      const percentage = Math.round((newResult.score / newResult.total) * 100);
      notificationsStore.create({
        userId: student.parentId,
        type: 'progress',
        title: percentage >= 80 ? 'Great Quiz Performance!' : 'Quiz Completed',
        message: `${student.name} scored ${newResult.score}/${newResult.total} in today's quiz. ${percentage >= 80 ? 'Excellent work!' : 'Keep practicing!'}`,
        date: newResult.completedDate,
      });
    }

    return newResult;
  },
};

// ==================== STUDENT NOTES ====================
export const studentNotesStore = {
  getAll: (): StudentNote[] => {
    const data = localStorage.getItem('demo_student_notes');
    return data ? JSON.parse(data) : [];
  },

  getByStudent: (studentId: string): StudentNote[] => {
    const notes = studentNotesStore.getAll();
    return notes.filter(n => n.studentId === studentId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  create: (note: Partial<StudentNote>): StudentNote => {
    const notes = studentNotesStore.getAll();
    const newNote: StudentNote = {
      id: generateId(),
      studentId: note.studentId || '',
      type: note.type || 'behavior',
      note: note.note || '',
      date: note.date || new Date().toISOString().split('T')[0],
      teacherId: note.teacherId || '',
      teacherName: note.teacherName || '',
    };

    notes.push(newNote);
    localStorage.setItem('demo_student_notes', JSON.stringify(notes));

    return newNote;
  },
};

// ==================== NOTIFICATIONS ====================
export const notificationsStore = {
  getAll: (): Notification[] => {
    const data = localStorage.getItem('demo_notifications');
    return data ? JSON.parse(data) : [];
  },

  getByUser: (userId: string): Notification[] => {
    const notifications = notificationsStore.getAll();
    return notifications.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  create: (notification: Partial<Notification>): Notification => {
    const notifications = notificationsStore.getAll();
    const newNotification: Notification = {
      id: generateId(),
      userId: notification.userId || '',
      type: notification.type || 'announcement',
      title: notification.title || '',
      message: notification.message || '',
      date: notification.date || new Date().toISOString(),
      read: notification.read || false,
    };

    notifications.push(newNotification);
    localStorage.setItem('demo_notifications', JSON.stringify(notifications));

    return newNotification;
  },

  markAsRead: (id: string): void => {
    const notifications = notificationsStore.getAll();
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('demo_notifications', JSON.stringify(updated));
  },
};

// ==================== HELPER FUNCTIONS ====================
export const dataStoreHelpers = {
  // Get today's activities for a student
  getStudentDailyActivities: (studentClass: string, studentSection: string, date: string) => {
    const lessons = lessonsStore.getByStudent(studentClass, studentSection, date);
    const quizzes = quizzesStore.getByClass(studentClass, studentSection);
    
    return lessons.map(lesson => {
      const quiz = quizzes.find(q => q.lessonId === lesson.id);
      return {
        lesson,
        quiz,
        quizResult: null, // Can be populated if needed
      };
    });
  },

  // Get attendance summary for a class
  getClassAttendanceSummary: (className: string, section: string, date: string) => {
    const students = studentsStore.getByClass(className, section);
    const attendance = attendanceStore.getByDate(date);

    return students.map(student => {
      const record = attendance.find(a => a.studentId === student.id);
      return {
        student,
        status: record?.status || null,
        time: record?.time || null,
      };
    });
  },
};
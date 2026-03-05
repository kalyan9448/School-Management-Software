// Centralized Data Service for All Dashboards
// This service manages all data operations across the application

// ==================== INTERFACES ====================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'accountant' | 'parent' | 'superadmin' | 'student';
  phone?: string;
  avatar?: string;
  // Teacher specific
  subjects?: string[];
  classes?: string[];
  // Student specific
  studentId?: string;
  class?: string;
  section?: string;
  rollNo?: string;
  parentId?: string;
  // Parent specific
  childrenIds?: string[];
  isFirstLogin?: boolean;
  school_id?: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  fatherName: string;
  motherName: string;
  parentPhone: string;
  parentEmail: string;
  parentId?: string;
  address: string;
  admissionDate: string;
  status: 'active' | 'inactive' | 'transferred';
  photo?: string;
  bloodGroup?: string;
  medicalInfo?: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: { class: string; section: string; subject: string }[];
  qualification: string;
  experience: number;
  joiningDate: string;
  salary: number;
  photo?: string;
  address?: string;
  status: 'active' | 'inactive';
}

export interface Class {
  id: string;
  className: string;
  section: string;
  classTeacher: string;
  capacity: number;
  currentStrength: number;
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  time: string;
  markedBy: string;
  remarks?: string;
}

export interface LessonLog {
  id: string;
  date: string;
  classId: string;
  class: string;
  section: string;
  subject: string;
  topic: string;
  objectives: string[];
  description?: string;
  studentsNeedingAttention: string[];
  notes: string;
  teacherId: string;
  teacherName: string;
  attachments?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  section: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  totalMarks: number;
  attachments?: string[];
  status: 'active' | 'closed';
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedDate: string;
  files: string[];
  remarks?: string;
  marksObtained?: number;
  feedback?: string;
  gradedBy?: string;
  gradedDate?: string;
  status: 'pending' | 'submitted' | 'graded';
}

export interface Exam {
  id: string;
  name: string;
  type: 'unit-test' | 'mid-term' | 'final' | 'practical';
  subject: string;
  class: string;
  section: string;
  date: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  syllabus?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  remarks?: string;
}

export interface FeeStructure {
  id: string;
  class: string;
  academicYear: string;
  components: FeeComponent[];
  totalAmount: number;
  dueDate: string;
}

export interface FeeComponent {
  name: string;
  amount: number;
  mandatory: boolean;
}

export interface FeePayment {
  id: string;
  studentId: string;
  receiptNo: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'cash' | 'card' | 'upi' | 'cheque' | 'online';
  transactionId?: string;
  collectedBy: string;
  components: { name: string; amount: number }[];
  academicYear: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'event' | 'holiday' | 'exam';
  postedBy: string;
  postedDate: string;
  targetAudience: 'all' | 'teachers' | 'parents' | 'students' | 'specific-class';
  class?: string;
  section?: string;
  priority: 'low' | 'medium' | 'high';
  expiryDate?: string;
  attachments?: string[];
}

export interface Enquiry {
  id: string;
  parentName: string;
  studentName: string;
  phone: string;
  email: string;
  classApplied: string;
  enquiryDate: string;
  source: 'walk-in' | 'phone' | 'website' | 'reference';
  status: 'new' | 'contacted' | 'visited' | 'converted' | 'lost';
  followUpDate?: string;
  notes?: string;
  assignedTo?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'holiday' | 'exam' | 'ptm' | 'sports' | 'cultural' | 'other';
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  organizer?: string;
  targetAudience: 'all' | 'specific-class';
  class?: string;
  section?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'attendance' | 'assignment' | 'exam' | 'fee' | 'announcement' | 'general';
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
}

// ==================== DATA INITIALIZATION ====================

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 11);
};

const initializeData = () => {
  // Initialize demo students
  if (!localStorage.getItem('app_students')) {
    const demoStudents: Student[] = [
      {
        id: 'STU001',
        admissionNo: 'KVS2024001',
        name: 'Aarav Sharma',
        rollNo: '001',
        class: '8th',
        section: 'A',
        dateOfBirth: '2010-05-15',
        gender: 'male',
        fatherName: 'Rajesh Sharma',
        motherName: 'Priya Sharma',
        parentPhone: '+91 9876543210',
        parentEmail: 'parent@school.com',
        parentId: '5',
        address: '123 MG Road, Mumbai',
        admissionDate: '2024-04-01',
        status: 'active',
        bloodGroup: 'O+',
      },
      {
        id: 'STU002',
        admissionNo: 'KVS2024002',
        name: 'Diya Patel',
        rollNo: '002',
        class: '8th',
        section: 'A',
        dateOfBirth: '2010-08-22',
        gender: 'female',
        fatherName: 'Amit Patel',
        motherName: 'Neha Patel',
        parentPhone: '+91 9876543211',
        parentEmail: 'patel@example.com',
        address: '456 Park Street, Mumbai',
        admissionDate: '2024-04-01',
        status: 'active',
        bloodGroup: 'A+',
      },
      {
        id: 'STU003',
        admissionNo: 'KVS2024003',
        name: 'Arjun Singh',
        rollNo: '003',
        class: '8th',
        section: 'A',
        dateOfBirth: '2010-03-10',
        gender: 'male',
        fatherName: 'Vikram Singh',
        motherName: 'Anita Singh',
        parentPhone: '+91 9876543212',
        parentEmail: 'singh@example.com',
        address: '789 Lake Road, Mumbai',
        admissionDate: '2024-04-01',
        status: 'active',
        bloodGroup: 'B+',
      },
    ];
    localStorage.setItem('app_students', JSON.stringify(demoStudents));
  }

  // Initialize demo teachers
  if (!localStorage.getItem('app_teachers')) {
    const demoTeachers: Teacher[] = [
      {
        id: '3',
        employeeId: 'EMP001',
        name: 'John Teacher',
        email: 'teacher@school.com',
        phone: '+91 9876543220',
        subjects: ['Mathematics', 'Science'],
        classes: [
          { class: '8th', section: 'A', subject: 'Mathematics' },
          { class: '8th', section: 'A', subject: 'Science' },
        ],
        qualification: 'M.Sc Mathematics',
        experience: 5,
        joiningDate: '2020-06-01',
        salary: 45000,
        status: 'active',
      },
    ];
    localStorage.setItem('app_teachers', JSON.stringify(demoTeachers));
  }

  // Initialize other collections
  const collections = [
    'app_classes',
    'app_subjects',
    'app_attendance',
    'app_lessons',
    'app_assignments',
    'app_assignment_submissions',
    'app_exams',
    'app_exam_results',
    'app_fee_structures',
    'app_fee_payments',
    'app_announcements',
    'app_enquiries',
    'app_events',
    'app_notifications',
    'app_users',
    'app_schools',
  ];

  collections.forEach(collection => {
    if (!localStorage.getItem(collection)) {
      localStorage.setItem(collection, JSON.stringify([]));
    }
  });

  // Initialize demo users (overrides the hardcoded list in AuthContext eventually)
  if (!localStorage.getItem('app_users') || JSON.parse(localStorage.getItem('app_users') || '[]').length === 0) {
    const demoUsers: User[] = [
      { id: '0', email: 'superadmin@platform.com', name: 'Super Admin', role: 'superadmin', isFirstLogin: false },
      { id: '1', email: 'admin@school.com', name: 'Admin User', role: 'admin', isFirstLogin: false },
      { id: '3', email: 'teacher@school.com', name: 'John Teacher', role: 'teacher', isFirstLogin: false },
      { id: '4', email: 'accountant@school.com', name: 'Fee Manager', role: 'accountant', isFirstLogin: false },
      { id: '5', email: 'parent@school.com', name: 'Parent User', role: 'parent', isFirstLogin: false },
      { id: '6', email: 'student@school.com', name: 'Aarav Sharma', role: 'student', isFirstLogin: false },
    ];
    localStorage.setItem('app_users', JSON.stringify(demoUsers));
  }

  // Initialize demo classes
  if (!localStorage.getItem('app_classes') || JSON.parse(localStorage.getItem('app_classes') || '[]').length === 0) {
    const demoClasses: Class[] = [
      {
        id: 'CLS001',
        className: '8th',
        section: 'A',
        classTeacher: 'John Teacher',
        capacity: 40,
        currentStrength: 3,
        subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
      },
    ];
    localStorage.setItem('app_classes', JSON.stringify(demoClasses));
  }

  // Initialize demo subjects
  if (!localStorage.getItem('app_subjects') || JSON.parse(localStorage.getItem('app_subjects') || '[]').length === 0) {
    const demoSubjects: Subject[] = [
      { id: 'SUB001', name: 'Mathematics', code: 'MATH', description: 'Mathematics' },
      { id: 'SUB002', name: 'Science', code: 'SCI', description: 'Science' },
      { id: 'SUB003', name: 'English', code: 'ENG', description: 'English Language' },
      { id: 'SUB004', name: 'Social Studies', code: 'SST', description: 'Social Studies' },
      { id: 'SUB005', name: 'Hindi', code: 'HIN', description: 'Hindi Language' },
    ];
    localStorage.setItem('app_subjects', JSON.stringify(demoSubjects));
  }
};

// Initialize on load
initializeData();

// ==================== DATA SERVICES ====================

export const userService = {
  getAll: (): User[] => {
    const data = localStorage.getItem('app_users');
    return data ? JSON.parse(data) : [];
  },

  getByEmail: (email: string): User | null => {
    const users = userService.getAll();
    return users.find(u => u.email === email) || null;
  },

  create: (user: Partial<User>): User => {
    const users = userService.getAll();
    const newUser: User = {
      id: user.id || generateId(),
      email: user.email || '',
      name: user.name || '',
      role: user.role || 'student',
      isFirstLogin: user.isFirstLogin ?? true, // Default to true for new users
    };

    users.push(newUser);
    localStorage.setItem('app_users', JSON.stringify(users));
    return newUser;
  },

  update: (id: string, updates: Partial<User>): User | null => {
    const users = userService.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    localStorage.setItem('app_users', JSON.stringify(users));
    return users[index];
  },
};

export const schoolService = {
  getAll: (): any[] => {
    const data = localStorage.getItem('app_schools');
    return data ? JSON.parse(data) : [];
  },

  create: (school: any): any => {
    const schools = schoolService.getAll();
    const newSchool = {
      ...school,
      id: generateId(),
      status: 'active',
      created_at: new Date().toISOString(),
    };
    schools.push(newSchool);
    localStorage.setItem('app_schools', JSON.stringify(schools));

    // Automatically provision the School Admin user
    userService.create({
      email: school.principalEmail,
      name: school.principalName,
      role: 'admin',
      school_id: newSchool.id,
      isFirstLogin: true,
    });

    return newSchool;
  }
};

export const studentService = {
  getAll: (): Student[] => {
    const data = localStorage.getItem('app_students');
    return data ? JSON.parse(data) : [];
  },

  getById: (id: string): Student | null => {
    const students = studentService.getAll();
    return students.find(s => s.id === id) || null;
  },

  getByClass: (className: string, section: string): Student[] => {
    const students = studentService.getAll();
    return students.filter(s => s.class === className && s.section === section);
  },

  getByParentId: (parentId: string): Student[] => {
    const students = studentService.getAll();
    return students.filter(s => s.parentId === parentId);
  },

  create: (student: Partial<Student>): Student => {
    const students = studentService.getAll();
    const newStudent: Student = {
      id: student.id || generateId(),
      admissionNo: student.admissionNo || `KVS${new Date().getFullYear()}${String(students.length + 1).padStart(3, '0')}`,
      name: student.name || '',
      rollNo: student.rollNo || String(students.length + 1).padStart(3, '0'),
      class: student.class || '',
      section: student.section || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || 'male',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      parentId: student.parentId,
      address: student.address || '',
      admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
      status: student.status || 'active',
      photo: student.photo,
      bloodGroup: student.bloodGroup,
      medicalInfo: student.medicalInfo,
    };

    students.push(newStudent);
    localStorage.setItem('app_students', JSON.stringify(students));
    return newStudent;
  },

  update: (id: string, updates: Partial<Student>): Student | null => {
    const students = studentService.getAll();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;

    students[index] = { ...students[index], ...updates };
    localStorage.setItem('app_students', JSON.stringify(students));
    return students[index];
  },

  delete: (id: string): boolean => {
    const students = studentService.getAll();
    const filtered = students.filter(s => s.id !== id);
    localStorage.setItem('app_students', JSON.stringify(filtered));
    return true;
  },
};

export const teacherService = {
  getAll: (): Teacher[] => {
    const data = localStorage.getItem('app_teachers');
    return data ? JSON.parse(data) : [];
  },

  getById: (id: string): Teacher | null => {
    const teachers = teacherService.getAll();
    return teachers.find(t => t.id === id) || null;
  },

  create: (teacher: Partial<Teacher>): Teacher => {
    const teachers = teacherService.getAll();
    const newTeacher: Teacher = {
      id: teacher.id || generateId(),
      employeeId: teacher.employeeId || `EMP${String(teachers.length + 1).padStart(3, '0')}`,
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      subjects: teacher.subjects || [],
      classes: teacher.classes || [],
      qualification: teacher.qualification || '',
      experience: teacher.experience || 0,
      joiningDate: teacher.joiningDate || new Date().toISOString().split('T')[0],
      salary: teacher.salary || 0,
      photo: teacher.photo,
      address: teacher.address,
      status: teacher.status || 'active',
    };

    teachers.push(newTeacher);
    localStorage.setItem('app_teachers', JSON.stringify(teachers));
    return newTeacher;
  },

  update: (id: string, updates: Partial<Teacher>): Teacher | null => {
    const teachers = teacherService.getAll();
    const index = teachers.findIndex(t => t.id === id);
    if (index === -1) return null;

    teachers[index] = { ...teachers[index], ...updates };
    localStorage.setItem('app_teachers', JSON.stringify(teachers));
    return teachers[index];
  },
};

export const classService = {
  getAll: (): Class[] => {
    const data = localStorage.getItem('app_classes');
    return data ? JSON.parse(data) : [];
  },

  getById: (id: string): Class | null => {
    const classes = classService.getAll();
    return classes.find(c => c.id === id) || null;
  },

  create: (classData: Partial<Class>): Class => {
    const classes = classService.getAll();
    const newClass: Class = {
      id: classData.id || generateId(),
      className: classData.className || '',
      section: classData.section || '',
      classTeacher: classData.classTeacher || '',
      capacity: classData.capacity || 40,
      currentStrength: classData.currentStrength || 0,
      subjects: classData.subjects || [],
    };

    classes.push(newClass);
    localStorage.setItem('app_classes', JSON.stringify(classes));
    return newClass;
  },
};

export const subjectService = {
  getAll: (): Subject[] => {
    const data = localStorage.getItem('app_subjects');
    return data ? JSON.parse(data) : [];
  },

  create: (subject: Partial<Subject>): Subject => {
    const subjects = subjectService.getAll();
    const newSubject: Subject = {
      id: subject.id || generateId(),
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description,
    };

    subjects.push(newSubject);
    localStorage.setItem('app_subjects', JSON.stringify(subjects));
    return newSubject;
  },
};

export const attendanceService = {
  getAll: (): AttendanceRecord[] => {
    const data = localStorage.getItem('app_attendance');
    return data ? JSON.parse(data) : [];
  },

  getByDate: (date: string): AttendanceRecord[] => {
    const records = attendanceService.getAll();
    return records.filter(r => r.date === date);
  },

  getByStudent: (studentId: string, startDate?: string, endDate?: string): AttendanceRecord[] => {
    const records = attendanceService.getAll();
    let filtered = records.filter(r => r.studentId === studentId);

    if (startDate) {
      filtered = filtered.filter(r => r.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(r => r.date <= endDate);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getByClass: (className: string, section: string, date: string): AttendanceRecord[] => {
    const students = studentService.getByClass(className, section);
    const studentIds = students.map(s => s.id);
    const records = attendanceService.getByDate(date);
    return records.filter(r => studentIds.includes(r.studentId));
  },

  markAttendance: (records: Partial<AttendanceRecord>[]): void => {
    const existing = attendanceService.getAll();
    const date = records[0]?.date || new Date().toISOString().split('T')[0];

    // Remove existing records for this date and students
    const studentIds = records.map(r => r.studentId);
    const filtered = existing.filter(r => !(r.date === date && studentIds.includes(r.studentId)));

    // Add new records
    const newRecords: AttendanceRecord[] = records.map(r => ({
      id: r.id || generateId(),
      studentId: r.studentId!,
      date: r.date!,
      status: r.status!,
      time: r.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      markedBy: r.markedBy || 'teacher',
      remarks: r.remarks,
    }));

    localStorage.setItem('app_attendance', JSON.stringify([...filtered, ...newRecords]));

    // Create notifications for parents
    newRecords.forEach(record => {
      const student = studentService.getById(record.studentId);
      if (student?.parentId) {
        notificationService.create({
          userId: student.parentId,
          type: 'attendance',
          title: record.status === 'present' ? 'Child Arrived at School' : 'Attendance Alert',
          message: `${student.name} marked ${record.status} at ${record.time}`,
          date: record.date,
        });
      }
    });
  },

  getAttendanceStats: (studentId: string, month?: string): {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    percentage: number;
  } => {
    let records = attendanceService.getByStudent(studentId);

    if (month) {
      records = records.filter(r => r.date.startsWith(month));
    }

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const leave = records.filter(r => r.status === 'leave').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, leave, percentage };
  },
};

export const lessonService = {
  getAll: (): LessonLog[] => {
    const data = localStorage.getItem('app_lessons');
    return data ? JSON.parse(data) : [];
  },

  getByDate: (date: string): LessonLog[] => {
    const lessons = lessonService.getAll();
    return lessons.filter(l => l.date === date);
  },

  getByTeacher: (teacherId: string, date?: string): LessonLog[] => {
    const lessons = lessonService.getAll();
    let filtered = lessons.filter(l => l.teacherId === teacherId);
    if (date) {
      filtered = filtered.filter(l => l.date === date);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getByClass: (className: string, section: string): LessonLog[] => {
    const lessons = lessonService.getAll();
    return lessons.filter(l => l.class === className && l.section === section)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  create: (lesson: Partial<LessonLog>): LessonLog => {
    const lessons = lessonService.getAll();
    const newLesson: LessonLog = {
      id: lesson.id || generateId(),
      date: lesson.date || new Date().toISOString().split('T')[0],
      classId: lesson.classId || '',
      class: lesson.class || '',
      section: lesson.section || '',
      subject: lesson.subject || '',
      topic: lesson.topic || '',
      objectives: lesson.objectives || [],
      description: lesson.description,
      studentsNeedingAttention: lesson.studentsNeedingAttention || [],
      notes: lesson.notes || '',
      teacherId: lesson.teacherId || '',
      teacherName: lesson.teacherName || '',
      attachments: lesson.attachments || [],
    };

    lessons.push(newLesson);
    localStorage.setItem('app_lessons', JSON.stringify(lessons));
    return newLesson;
  },
};

export const assignmentService = {
  getAll: (): Assignment[] => {
    const data = localStorage.getItem('app_assignments');
    return data ? JSON.parse(data) : [];
  },

  getByClass: (className: string, section: string): Assignment[] => {
    const assignments = assignmentService.getAll();
    return assignments.filter(a => a.class === className && a.section === section)
      .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
  },

  getById: (id: string): Assignment | null => {
    const assignments = assignmentService.getAll();
    return assignments.find(a => a.id === id) || null;
  },

  create: (assignment: Partial<Assignment>): Assignment => {
    const assignments = assignmentService.getAll();
    const newAssignment: Assignment = {
      id: assignment.id || generateId(),
      title: assignment.title || '',
      description: assignment.description || '',
      subject: assignment.subject || '',
      class: assignment.class || '',
      section: assignment.section || '',
      assignedBy: assignment.assignedBy || '',
      assignedDate: assignment.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: assignment.dueDate || '',
      totalMarks: assignment.totalMarks || 0,
      attachments: assignment.attachments || [],
      status: assignment.status || 'active',
    };

    assignments.push(newAssignment);
    localStorage.setItem('app_assignments', JSON.stringify(assignments));

    // Notify students
    const students = studentService.getByClass(newAssignment.class, newAssignment.section);
    students.forEach(student => {
      if (student.parentId) {
        notificationService.create({
          userId: student.parentId,
          type: 'assignment',
          title: 'New Assignment Posted',
          message: `${newAssignment.subject}: ${newAssignment.title}. Due date: ${newAssignment.dueDate}`,
          date: newAssignment.assignedDate,
        });
      }
    });

    return newAssignment;
  },
};

export const assignmentSubmissionService = {
  getAll: (): AssignmentSubmission[] => {
    const data = localStorage.getItem('app_assignment_submissions');
    return data ? JSON.parse(data) : [];
  },

  getByAssignment: (assignmentId: string): AssignmentSubmission[] => {
    const submissions = assignmentSubmissionService.getAll();
    return submissions.filter(s => s.assignmentId === assignmentId);
  },

  getByStudent: (studentId: string): AssignmentSubmission[] => {
    const submissions = assignmentSubmissionService.getAll();
    return submissions.filter(s => s.studentId === studentId)
      .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
  },

  submit: (submission: Partial<AssignmentSubmission>): AssignmentSubmission => {
    const submissions = assignmentSubmissionService.getAll();
    const newSubmission: AssignmentSubmission = {
      id: submission.id || generateId(),
      assignmentId: submission.assignmentId || '',
      studentId: submission.studentId || '',
      submittedDate: submission.submittedDate || new Date().toISOString().split('T')[0],
      files: submission.files || [],
      remarks: submission.remarks,
      status: 'submitted',
    };

    submissions.push(newSubmission);
    localStorage.setItem('app_assignment_submissions', JSON.stringify(submissions));
    return newSubmission;
  },

  grade: (id: string, marksObtained: number, feedback: string, gradedBy: string): AssignmentSubmission | null => {
    const submissions = assignmentSubmissionService.getAll();
    const index = submissions.findIndex(s => s.id === id);
    if (index === -1) return null;

    submissions[index] = {
      ...submissions[index],
      marksObtained,
      feedback,
      gradedBy,
      gradedDate: new Date().toISOString().split('T')[0],
      status: 'graded',
    };

    localStorage.setItem('app_assignment_submissions', JSON.stringify(submissions));

    // Notify parent
    const student = studentService.getById(submissions[index].studentId);
    if (student?.parentId) {
      notificationService.create({
        userId: student.parentId,
        type: 'assignment',
        title: 'Assignment Graded',
        message: `${student.name}'s assignment has been graded. Marks: ${marksObtained}`,
        date: new Date().toISOString().split('T')[0],
      });
    }

    return submissions[index];
  },
};

export const examService = {
  getAll: (): Exam[] => {
    const data = localStorage.getItem('app_exams');
    return data ? JSON.parse(data) : [];
  },

  getUpcoming: (): Exam[] => {
    const exams = examService.getAll();
    const today = new Date().toISOString().split('T')[0];
    return exams.filter(e => e.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getByClass: (className: string, section: string): Exam[] => {
    const exams = examService.getAll();
    return exams.filter(e => e.class === className && e.section === section);
  },

  create: (exam: Partial<Exam>): Exam => {
    const exams = examService.getAll();
    const newExam: Exam = {
      id: exam.id || generateId(),
      name: exam.name || '',
      type: exam.type || 'unit-test',
      subject: exam.subject || '',
      class: exam.class || '',
      section: exam.section || '',
      date: exam.date || '',
      duration: exam.duration || 60,
      totalMarks: exam.totalMarks || 100,
      passingMarks: exam.passingMarks || 40,
      syllabus: exam.syllabus,
    };

    exams.push(newExam);
    localStorage.setItem('app_exams', JSON.stringify(exams));
    return newExam;
  },
};

export const examResultService = {
  getAll: (): ExamResult[] => {
    const data = localStorage.getItem('app_exam_results');
    return data ? JSON.parse(data) : [];
  },

  getByStudent: (studentId: string): ExamResult[] => {
    const results = examResultService.getAll();
    return results.filter(r => r.studentId === studentId);
  },

  getByExam: (examId: string): ExamResult[] => {
    const results = examResultService.getAll();
    return results.filter(r => r.examId === examId);
  },

  create: (result: Partial<ExamResult>): ExamResult => {
    const results = examResultService.getAll();
    const percentage = result.totalMarks ? Math.round(((result.marksObtained || 0) / result.totalMarks) * 100) : 0;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const newResult: ExamResult = {
      id: result.id || generateId(),
      examId: result.examId || '',
      studentId: result.studentId || '',
      marksObtained: result.marksObtained || 0,
      totalMarks: result.totalMarks || 0,
      percentage,
      grade,
      rank: result.rank,
      remarks: result.remarks,
    };

    results.push(newResult);
    localStorage.setItem('app_exam_results', JSON.stringify(results));
    return newResult;
  },
};

export const feeService = {
  getAllStructures: (): FeeStructure[] => {
    const data = localStorage.getItem('app_fee_structures');
    return data ? JSON.parse(data) : [];
  },

  getAllPayments: (): FeePayment[] => {
    const data = localStorage.getItem('app_fee_payments');
    return data ? JSON.parse(data) : [];
  },

  getPaymentsByStudent: (studentId: string): FeePayment[] => {
    const payments = feeService.getAllPayments();
    return payments.filter(p => p.studentId === studentId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  },

  createPayment: (payment: Partial<FeePayment>): FeePayment => {
    const payments = feeService.getAllPayments();
    const newPayment: FeePayment = {
      id: payment.id || generateId(),
      studentId: payment.studentId || '',
      receiptNo: payment.receiptNo || `REC${new Date().getFullYear()}${String(payments.length + 1).padStart(4, '0')}`,
      amount: payment.amount || 0,
      paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
      paymentMode: payment.paymentMode || 'cash',
      transactionId: payment.transactionId,
      collectedBy: payment.collectedBy || '',
      components: payment.components || [],
      academicYear: payment.academicYear || '2024-2025',
    };

    payments.push(newPayment);
    localStorage.setItem('app_fee_payments', JSON.stringify(payments));

    // Notify parent
    const student = studentService.getById(newPayment.studentId);
    if (student?.parentId) {
      notificationService.create({
        userId: student.parentId,
        type: 'fee',
        title: 'Fee Payment Received',
        message: `Payment of ₹${newPayment.amount} received. Receipt No: ${newPayment.receiptNo}`,
        date: newPayment.paymentDate,
      });
    }

    return newPayment;
  },
};

export const announcementService = {
  getAll: (): Announcement[] => {
    const data = localStorage.getItem('app_announcements');
    return data ? JSON.parse(data) : [];
  },

  getActive: (): Announcement[] => {
    const announcements = announcementService.getAll();
    const today = new Date().toISOString().split('T')[0];
    return announcements.filter(a => !a.expiryDate || a.expiryDate >= today)
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  },

  getForUser: (role: string, className?: string, section?: string): Announcement[] => {
    const announcements = announcementService.getActive();
    return announcements.filter(a => {
      if (a.targetAudience === 'all') return true;
      if (a.targetAudience === role + 's') return true;
      if (a.targetAudience === 'specific-class' && a.class === className && a.section === section) return true;
      return false;
    });
  },

  create: (announcement: Partial<Announcement>): Announcement => {
    const announcements = announcementService.getAll();
    const newAnnouncement: Announcement = {
      id: announcement.id || generateId(),
      title: announcement.title || '',
      message: announcement.message || '',
      type: announcement.type || 'general',
      postedBy: announcement.postedBy || '',
      postedDate: announcement.postedDate || new Date().toISOString().split('T')[0],
      targetAudience: announcement.targetAudience || 'all',
      class: announcement.class,
      section: announcement.section,
      priority: announcement.priority || 'medium',
      expiryDate: announcement.expiryDate,
      attachments: announcement.attachments || [],
    };

    announcements.push(newAnnouncement);
    localStorage.setItem('app_announcements', JSON.stringify(announcements));
    return newAnnouncement;
  },
};

export const enquiryService = {
  getAll: (): Enquiry[] => {
    const data = localStorage.getItem('app_enquiries');
    return data ? JSON.parse(data) : [];
  },

  create: (enquiry: Partial<Enquiry>): Enquiry => {
    const enquiries = enquiryService.getAll();
    const newEnquiry: Enquiry = {
      id: enquiry.id || generateId(),
      parentName: enquiry.parentName || '',
      studentName: enquiry.studentName || '',
      phone: enquiry.phone || '',
      email: enquiry.email || '',
      classApplied: enquiry.classApplied || '',
      enquiryDate: enquiry.enquiryDate || new Date().toISOString().split('T')[0],
      source: enquiry.source || 'walk-in',
      status: enquiry.status || 'new',
      followUpDate: enquiry.followUpDate,
      notes: enquiry.notes,
      assignedTo: enquiry.assignedTo,
    };

    enquiries.push(newEnquiry);
    localStorage.setItem('app_enquiries', JSON.stringify(enquiries));
    return newEnquiry;
  },

  update: (id: string, updates: Partial<Enquiry>): Enquiry | null => {
    const enquiries = enquiryService.getAll();
    const index = enquiries.findIndex(e => e.id === id);
    if (index === -1) return null;

    enquiries[index] = { ...enquiries[index], ...updates };
    localStorage.setItem('app_enquiries', JSON.stringify(enquiries));
    return enquiries[index];
  },
};

export const eventService = {
  getAll: (): Event[] => {
    const data = localStorage.getItem('app_events');
    return data ? JSON.parse(data) : [];
  },

  getUpcoming: (): Event[] => {
    const events = eventService.getAll();
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  create: (event: Partial<Event>): Event => {
    const events = eventService.getAll();
    const newEvent: Event = {
      id: event.id || generateId(),
      title: event.title || '',
      description: event.description || '',
      type: event.type || 'other',
      date: event.date || '',
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      organizer: event.organizer,
      targetAudience: event.targetAudience || 'all',
      class: event.class,
      section: event.section,
    };

    events.push(newEvent);
    localStorage.setItem('app_events', JSON.stringify(events));
    return newEvent;
  },
};

export const notificationService = {
  getAll: (): Notification[] => {
    const data = localStorage.getItem('app_notifications');
    return data ? JSON.parse(data) : [];
  },

  getByUser: (userId: string): Notification[] => {
    const notifications = notificationService.getAll();
    return notifications.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getUnreadCount: (userId: string): number => {
    const notifications = notificationService.getByUser(userId);
    return notifications.filter(n => !n.read).length;
  },

  create: (notification: Partial<Notification>): Notification => {
    const notifications = notificationService.getAll();
    const newNotification: Notification = {
      id: notification.id || generateId(),
      userId: notification.userId || '',
      type: notification.type || 'general',
      title: notification.title || '',
      message: notification.message || '',
      date: notification.date || new Date().toISOString(),
      read: notification.read || false,
      link: notification.link,
    };

    notifications.push(newNotification);
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
    return newNotification;
  },

  markAsRead: (id: string): void => {
    const notifications = notificationService.getAll();
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('app_notifications', JSON.stringify(updated));
  },

  markAllAsRead: (userId: string): void => {
    const notifications = notificationService.getAll();
    const updated = notifications.map(n =>
      n.userId === userId ? { ...n, read: true } : n
    );
    localStorage.setItem('app_notifications', JSON.stringify(updated));
  },
};

// ==================== STATISTICS & ANALYTICS ====================

export const statisticsService = {
  getDashboardStats: () => {
    const students = studentService.getAll();
    const teachers = teacherService.getAll();
    const today = new Date().toISOString().split('T')[0];
    const attendance = attendanceService.getByDate(today);
    const announcements = announcementService.getActive();

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      presentToday: attendance.filter(a => a.status === 'present').length,
      absentToday: attendance.filter(a => a.status === 'absent').length,
      activeAnnouncements: announcements.length,
      attendancePercentage: attendance.length > 0
        ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
        : 0,
    };
  },

  getStudentPerformance: (studentId: string) => {
    const results = examResultService.getByStudent(studentId);
    const submissions = assignmentSubmissionService.getByStudent(studentId);
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');

    const totalExamMarks = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalExamMax = results.reduce((sum, r) => sum + r.totalMarks, 0);
    const examPercentage = totalExamMax > 0 ? Math.round((totalExamMarks / totalExamMax) * 100) : 0;

    const totalAssignmentMarks = gradedSubmissions.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
    const totalAssignmentMax = gradedSubmissions.length * 100; // Assuming 100 marks per assignment
    const assignmentPercentage = totalAssignmentMax > 0 ? Math.round((totalAssignmentMarks / totalAssignmentMax) * 100) : 0;

    return {
      overallPercentage: Math.round((examPercentage + assignmentPercentage) / 2),
      examPercentage,
      assignmentPercentage,
      totalExams: results.length,
      totalAssignments: submissions.length,
      gradedAssignments: gradedSubmissions.length,
      pendingAssignments: submissions.filter(s => s.status === 'submitted').length,
    };
  },

  getClassStatistics: (className: string, section: string) => {
    const students = studentService.getByClass(className, section);
    const today = new Date().toISOString().split('T')[0];
    const attendance = attendanceService.getByClass(className, section, today);

    return {
      totalStudents: students.length,
      presentToday: attendance.filter(a => a.status === 'present').length,
      absentToday: attendance.filter(a => a.status === 'absent').length,
      attendancePercentage: students.length > 0
        ? Math.round((attendance.filter(a => a.status === 'present').length / students.length) * 100)
        : 0,
    };
  },
};

// Export all services
export default {
  user: userService,
  school: schoolService,
  student: studentService,
  teacher: teacherService,
  class: classService,
  subject: subjectService,
  attendance: attendanceService,
  lesson: lessonService,
  assignment: assignmentService,
  assignmentSubmission: assignmentSubmissionService,
  exam: examService,
  examResult: examResultService,
  fee: feeService,
  announcement: announcementService,
  enquiry: enquiryService,
  event: eventService,
  notification: notificationService,
  statistics: statisticsService,
};

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
  school_id?: string;
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
  email?: string; // Optional student email for login
  parentId?: string;
  address: string;
  admissionDate: string;
  academicYear?: string;
  selectedFees?: string[];
  status: 'enquiry' | 'in-process' | 'confirmed' | 'admitted' | 'active' | 'inactive' | 'transferred';
  photo?: string;
  bloodGroup?: string;
  medicalInfo?: {
    allergies: string[];
    conditions: string[];
    emergencyContact: string;
    emergencyPhone: string;
  };
  // UI and Stats fields
  phone?: string; // Often matches parentPhone
  presentDays?: number;
  totalDays?: number;
  attendance?: number;
  feeStatus?: 'paid' | 'partial' | 'pending';
  dueFee?: number;
  totalFee?: number;
  paidFee?: number;
  fatherOccupation?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianOccupation?: string;
  emergencyContactNumber?: string;
  classTeacher?: string;
  classTeacherContact?: string;
  transportRoute?: string;
  busNumber?: string;
  parentName?: string;
  dob?: string;
}

export interface Teacher {
  id: string;
  school_id?: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  subjects: string[];
  classes: { class: string; section: string; subject: string }[];
  qualification: string;
  experience: number;
  joiningDate: string;
  salary: number;
  photo?: string;
  address?: string;
  department?: string;
  status: 'active' | 'inactive' | 'on-leave';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedReport {
  id: string;
  school_id?: string;
  name: string;
  type: string;
  generatedOn: string;
  format: string; // PDF, CSV etc
  size: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledReport {
  id: string;
  school_id?: string;
  name: string;
  type: string;
  frequency: string;
  recipients: string;
  nextRun: string;
  status: 'active' | 'paused';
  created_at?: string;
  updated_at?: string;
}

export interface SubjectMappingRecord {
  id: string;
  school_id: string;
  academic_year_id: string;
  className: string;
  section: string;
  subjectName: string;
  teacherName: string;
  teacherEmail: string;
  periods: number;
  created_at?: string;
  updated_at?: string;
}

export interface Class {
  id: string;
  school_id?: string;
  className: string;
  section: string;
  classTeacher: string;
  capacity: number;
  currentStrength: number;
  subjects: string[];
}

export interface Subject {
  id: string;
  school_id?: string;
  name: string;
  code: string;
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  school_id?: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  time: string;
  markedBy: string;
  remarks?: string;
  class?: string;
  section?: string;
  studentName?: string;
  rollNo?: string;
  parentPhone?: string;
}

export interface LessonLog {
  id: string;
  school_id?: string;
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
  time?: string;
  attachments?: string[];
}



export interface Assignment {
  id: string;
  school_id?: string;
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
  school_id?: string;
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
  school_id?: string;
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
  school_id?: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  remarks?: string;
  gradedBy?: string;
  gradedAt?: string;
  created_at?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimetableSlot {
  id: string;
  school_id?: string;
  classId: string;
  class: string;
  section: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subjectId: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  room?: string;
}

export interface FeeStructure {
  id: string;
  school_id?: string;
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
  school_id?: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
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
  school_id?: string;
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

export interface Admission {
  id: string;
  school_id?: string;
  admissionNo: string;
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  fatherOccupation: string;
  motherOccupation: string;
  guardianOccupation: string;
  parentName: string;
  phone: string;
  emergencyContactNumber: string;
  email: string;
  parentEmail: string;
  address: string;
  classApplied: string;
  classAllotted: string;
  section: string;
  rollNo: string;
  status: 'enquiry' | 'in-process' | 'confirmed' | 'admitted';
  appliedDate: string;
  admissionDate: string;
  academicYear: string;
  selectedFees?: string[];
}

export interface Enquiry {
  id: string;
  school_id?: string;
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
  school_id?: string;
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
  school_id?: string;
  userId: string;
  recipientRole?: string;
  class?: string;
  section?: string;
  type: 'attendance' | 'assignment' | 'exam' | 'fee' | 'announcement' | 'general';
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
}

// ==================== FIRESTORE-BACKED SERVICES ====================
// All data operations now go through Firestore. No localStorage, no mock data.

import {
  userService,
  schoolService,
  organizationService,
  studentService,
  teacherService,
  classService,
  subjectService,
  attendanceService,
  lessonService,
  assignmentService,
  assignmentSubmissionService,
  examService,
  examResultService,
  feeService,
  announcementService,
  enquiryService,
  eventService,
  notificationService,
  timetableService,
  statisticsService,
  quizService,
  schoolSettingsService,
  academicYearService,
  studentEnrollmentService,
  feeInvoiceService,
  auditLogService,
  admissionService,
  subjectMappingService,
  studentNoteService,
  reportsService,
  StudentNote,
} from './firestoreService';

export {
  userService,
  schoolService,
  organizationService,
  studentService,
  teacherService,
  classService,
  subjectService,
  attendanceService,
  lessonService,
  assignmentService,
  assignmentSubmissionService,
  examService,
  examResultService,
  feeService,
  announcementService,
  enquiryService,
  eventService,
  notificationService,
  timetableService,
  statisticsService,
  quizService,
  schoolSettingsService,
  academicYearService,
  studentEnrollmentService,
  feeInvoiceService,
  auditLogService,
  admissionService,
  subjectMappingService,
  studentNoteService,
  reportsService,
};

export type { StudentNote };

// Default export — same shape as before
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
  timetable: timetableService,
  statistics: statisticsService,
  schoolSettings: schoolSettingsService,
  academicYear: academicYearService,
  subjectMapping: subjectMappingService,
  studentEnrollment: studentEnrollmentService,
  feeInvoice: feeInvoiceService,
  auditLog: auditLogService,
  studentNote: studentNoteService,
};

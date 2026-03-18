// =============================================================================
// SHARED TYPESCRIPT TYPES — School Management SaaS
// Single source of truth for all data interfaces across the application.
// Every record that belongs to a school MUST include school_id for multi-tenancy.
// =============================================================================

// ----- Auth / Users -----

export type UserRole = 'admin' | 'teacher' | 'accountant' | 'parent' | 'superadmin' | 'student';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    avatar?: string;
    school_id?: string; // null for superadmin (platform-level)
    isFirstLogin?: boolean;
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
}

// ----- School (Multi-Tenant) -----

export interface School {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    principal: string;
    logo?: string;
    website?: string;
    established?: string;
    board?: string; // CBSE, ICSE, State etc.
    status: 'active' | 'inactive' | 'trial';
    plan: 'basic' | 'standard' | 'premium';
    created_at: string;
}

// ----- Student -----

export interface Student {
    id: string;
    school_id: string;
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
    status: 'enquiry' | 'in-process' | 'confirmed' | 'admitted' | 'active' | 'inactive' | 'transferred';
    photo?: string;
    bloodGroup?: string;
    medicalInfo?: string;
}

// ----- Teacher -----

export interface Teacher {
    id: string;
    school_id: string;
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

// ----- Class / Subject -----

export interface Class {
    id: string;
    school_id: string;
    className: string;
    section: string;
    classTeacher: string;
    capacity: number;
    currentStrength: number;
    subjects: string[];
}

export interface Subject {
    id: string;
    school_id: string;
    name: string;
    code: string;
    description?: string;
}

// ----- Attendance -----

export interface AttendanceRecord {
    id: string;
    school_id: string;
    studentId: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
    time: string;
    markedBy: string;
    remarks?: string;
}

// ----- Lessons & Assignments -----

export interface LessonLog {
    id: string;
    school_id: string;
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
    school_id: string;
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
    school_id: string;
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

// ----- Exams -----

export interface Exam {
    id: string;
    school_id: string;
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
    school_id: string;
    examId: string;
    studentId: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    rank?: number;
    remarks?: string;
}

// ----- Fees -----

export interface FeeComponent {
    name: string;
    amount: number;
    mandatory: boolean;
}

export interface FeeStructure {
    id: string;
    school_id: string;
    class: string;
    academicYear: string;
    components: FeeComponent[];
    totalAmount: number;
    dueDate: string;
}

export interface FeePayment {
    id: string;
    school_id: string;
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

// ----- Communication -----

export interface Announcement {
    id: string;
    school_id: string;
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

export interface Notification {
    id: string;
    school_id: string;
    userId: string;
    type: 'attendance' | 'assignment' | 'exam' | 'fee' | 'announcement' | 'general';
    title: string;
    message: string;
    date: string;
    read: boolean;
    link?: string;
}

// ----- Admissions / Enquiry -----

export interface Enquiry {
    id: string;
    school_id: string;
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

// ----- Events -----

export interface Event {
    id: string;
    school_id: string;
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
// ----- Timetable -----

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimetableSlot {
    id: string;
    school_id: string;
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

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
    status?: 'active' | 'inactive' | 'disabled';
    last_login_at?: string;
    password_reset_required?: boolean;
    // Teacher specific
    subjects?: string[];
    classes?: (string | { class: string; section: string; subject: string })[];
    employee_id?: string;
    department?: string;
    // Student specific
    studentId?: string;
    class?: string;
    section?: string;
    rollNo?: string;
    parentId?: string;
    admission_number?: string;
    // Parent specific
    childrenIds?: string[];
    relationship?: 'father' | 'mother' | 'guardian' | 'other';
    // Audit
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
}

// ----- School (Multi-Tenant) -----

export interface School {
    id: string;
    name: string;
    code?: string;
    address: string;
    phone: string;
    email: string;
    principal: string;
    principal_email?: string;
    principal_phone?: string;
    admin_email?: string;
    logo?: string;
    website?: string;
    established?: string;
    board?: 'CBSE' | 'ICSE' | 'IB' | 'STATE' | 'IGCSE' | string;
    status: 'active' | 'inactive' | 'trial';
    plan: 'basic' | 'standard' | 'premium';
    subscription_status?: 'active' | 'expired' | 'suspended' | 'cancelled';
    tax_id?: string;
    student_count?: number;
    teacher_count?: number;
    created_at: string;
    updated_at?: string;
    created_by?: string;
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
    email?: string;
    parentId?: string;
    parentSecondaryId?: string;
    address: string;
    admissionDate: string;
    academicYear?: string;
    status: 'enquiry' | 'in-process' | 'confirmed' | 'admitted' | 'active' | 'inactive' | 'transferred' | 'graduated';
    photo?: string;
    bloodGroup?: string;
    medicalInfo?: string;
    lastSchoolName?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
}

// ----- Teacher -----

export interface Teacher {
    id: string;
    school_id: string;
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
    created_by?: string;
    updated_by?: string;
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
    academicYear?: string;
    status?: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

export interface Subject {
    id: string;
    school_id: string;
    name: string;
    code: string;
    description?: string;
    classLevels?: string[];
    status?: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

// ----- Attendance -----

export interface AttendanceRecord {
    id: string;
    school_id: string;
    studentId: string;
    classId?: string;
    class?: string;
    section?: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
    time: string;
    markedBy: string;
    remarks?: string;
    leaveType?: 'sick' | 'casual' | 'earned';
    verifiedBy?: string;
    verifiedAt?: string;
    academicYear?: string;
    created_at?: string;
    updated_at?: string;
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
    subjectId?: string;
    topic: string;
    objectives: string[];
    description?: string;
    teachingMethod?: string;
    homeworkAssigned?: boolean;
    studentsNeedingAttention: string[];
    notes: string;
    teacherId: string;
    teacherName: string;
    attachments?: string[];
    academicYear?: string;
    completionStatus?: 'planned' | 'in_progress' | 'completed';
    created_at?: string;
    updated_at?: string;
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
    subjectId?: string;
    class: string;
    section: string;
    classId?: string;
    date: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    syllabus?: string;
    academicYear?: string;
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    created_at?: string;
    updated_at?: string;
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
    gradedBy?: string;
    gradedAt?: string;
    attemptNumber?: number;
    created_at?: string;
    updated_at?: string;
}

// ----- Quiz Results (AI Homework) -----

export interface QuizAnswer {
    questionId: number;
    selectedAnswer: number;
    isCorrect: boolean;
}

export interface QuizResult {
    id: string;
    school_id: string;
    student_id: string;
    student_email: string;
    student_name: string;
    class: string;
    section: string;
    subject: string;
    topic: string;
    score: number;
    correct: number;
    total: number;
    accuracy: number;
    answers: QuizAnswer[];
    questions: any[];
    completed_at: string;
    created_at?: string;
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
    section?: string;
    academicYear: string;
    components: FeeComponent[];
    totalAmount: number;
    dueDate: string;
    lateFeeRule?: string;
    concessionRule?: string;
    status?: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

export interface FeePayment {
    id: string;
    school_id: string;
    studentId: string;
    invoiceId?: string;
    receiptNo: string;
    amount: number;
    paymentDate: string;
    paymentMode: 'cash' | 'card' | 'upi' | 'cheque' | 'online';
    transactionId?: string;
    chequeNo?: string;
    bankReferenceId?: string;
    collectedBy: string;
    components: { name: string; amount: number }[];
    academicYear: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected' | 'reversed';
    reconciliationStatus?: 'pending' | 'reconciled' | 'disputed';
    remarks?: string;
    created_at?: string;
    updated_at?: string;
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
    status?: 'active' | 'archived';
    created_at?: string;
    updated_at?: string;
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
    readAt?: string;
    link?: string;
    sentVia?: 'in_app' | 'email' | 'sms' | 'push';
    status?: 'sent' | 'delivered' | 'failed';
    created_at?: string;
    updated_at?: string;
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
    tags?: string[];
    convertedToStudentId?: string;
    conversionDate?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
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
    academicYear?: string;
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    created_at?: string;
    updated_at?: string;
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
    academicYear?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

// ===== NEW PRODUCTION COLLECTIONS =====

// ----- School Settings -----

export interface SchoolSettings {
    id: string;
    school_id: string;
    academicYear: string;
    timezone?: string;
    currency?: string;
    attendanceRules?: {
        lateThresholdMinutes?: number;
        halfDayThresholdMinutes?: number;
        autoNotifyParent?: boolean;
    };
    gradingRules?: {
        gradeScale: { minPercentage: number; grade: string; description: string }[];
        passingPercentage: number;
    };
    feeRules?: {
        lateFeePercentage?: number;
        gracePeriodDays?: number;
        reminderDaysBefore?: number[];
    };
    notificationRules?: {
        emailEnabled?: boolean;
        smsEnabled?: boolean;
        pushEnabled?: boolean;
    };
    branding?: {
        primaryColor?: string;
        secondaryColor?: string;
        tagline?: string;
    };
    created_at?: string;
    updated_at?: string;
}

// ----- Academic Year -----

export interface AcademicYear {
    id: string;
    school_id: string;
    name: string; // e.g. "2025-2026"
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    status: 'active' | 'upcoming' | 'completed';
    terms?: {
        name: string;
        startDate: string;
        endDate: string;
    }[];
    created_at?: string;
    updated_at?: string;
}

// ----- Student Enrollment -----

export interface StudentEnrollment {
    id: string;
    school_id: string;
    studentId: string;
    classId: string;
    class: string;
    section: string;
    academicYear: string;
    rollNo: string;
    startDate: string;
    endDate?: string;
    status: 'enrolled' | 'promoted' | 'transferred_out' | 'withdrawn' | 'graduated';
    promotedFromClassId?: string;
    promotedFromAcademicYear?: string;
    remarks?: string;
    created_at?: string;
    updated_at?: string;
}

// ----- Fee Invoice -----

export interface FeeInvoiceItem {
    componentName: string;
    amount: number;
    discount?: number;
    discountReason?: string;
    netAmount: number;
}

export interface FeeInvoice {
    id: string;
    school_id: string;
    studentId: string;
    studentName?: string;
    class: string;
    section: string;
    academicYear: string;
    invoiceNumber: string;
    items: FeeInvoiceItem[];
    totalDue: number;
    totalPaid: number;
    totalDiscount: number;
    totalBalance: number;
    dueDate: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'waived';
    remarks?: string;
    created_at?: string;
    updated_at?: string;
}

// ----- Audit Log -----

export interface AuditLog {
    id: string;
    school_id: string;
    userId: string;
    userName?: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'approve' | 'reject';
    collectionName: string;
    documentId: string;
    beforeData?: Record<string, any>;
    afterData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    created_at: string;
}

# 📚 Data Service - Quick Reference Guide

## 🚀 Quick Start

### Import the Service
```typescript
import dataService from '../utils/centralDataService';
```

### Import Hooks
```typescript
import {
  useStudents,
  useAttendance,
  useAssignments,
  // ... etc
} from '../hooks/useDataService';
```

---

## 🎯 Common Operations

### Students

**Get all students**
```typescript
const { students, loading, refresh } = useStudents();
```

**Get students by class**
```typescript
const { students } = useStudents({ class: '8th', section: 'A' });
```

**Get student by parent ID**
```typescript
const { students: children } = useStudents({ parentId: '5' });
```

**Create a student**
```typescript
const newStudent = dataService.student.create({
  name: 'John Doe',
  class: '8th',
  section: 'A',
  rollNo: '025',
  dateOfBirth: '2010-05-15',
  gender: 'male',
  fatherName: 'Father Name',
  motherName: 'Mother Name',
  parentPhone: '+91 9876543210',
  parentEmail: 'parent@example.com',
  address: '123 Street Name',
});
```

**Update a student**
```typescript
dataService.student.update('STU001', {
  class: '9th',
  section: 'B',
});
```

---

### Attendance

**Get attendance with stats**
```typescript
const { attendance, stats } = useAttendance({ 
  studentId: 'STU001',
  startDate: '2026-03-01',
  endDate: '2026-03-31'
});

// stats contains:
// { total, present, absent, late, leave, percentage }
```

**Mark attendance for multiple students**
```typescript
dataService.attendance.markAttendance([
  { 
    studentId: 'STU001', 
    date: '2026-03-02', 
    status: 'present',
    time: '08:30 AM',
    markedBy: 'teacher1'
  },
  { 
    studentId: 'STU002', 
    date: '2026-03-02', 
    status: 'absent',
    remarks: 'Sick leave'
  }
]);
```

**Get class attendance for a date**
```typescript
const { attendance } = useAttendance({
  date: '2026-03-02'
});
```

---

### Lessons

**Get lessons by teacher**
```typescript
const { lessons } = useLessons({ 
  teacherId: '3',
  date: '2026-03-02' // optional
});
```

**Get lessons by class**
```typescript
const { lessons } = useLessons({ 
  class: '8th', 
  section: 'A' 
});
```

**Create a lesson**
```typescript
const newLesson = dataService.lesson.create({
  date: '2026-03-02',
  class: '8th',
  section: 'A',
  subject: 'Mathematics',
  topic: 'Linear Equations',
  objectives: [
    'Understand linear equations',
    'Solve simple equations'
  ],
  description: 'Introduction to linear equations',
  studentsNeedingAttention: ['STU002'],
  notes: 'Good participation from class',
  teacherId: '3',
  teacherName: 'John Teacher',
});
```

---

### Assignments

**Get assignments for a class**
```typescript
const { assignments } = useAssignments({ 
  class: '8th', 
  section: 'A' 
});
```

**Create an assignment**
```typescript
const newAssignment = dataService.assignment.create({
  title: 'Math Homework - Chapter 5',
  description: 'Solve all problems from exercise 5.3',
  subject: 'Mathematics',
  class: '8th',
  section: 'A',
  assignedBy: 'teacher1',
  assignedDate: '2026-03-02',
  dueDate: '2026-03-10',
  totalMarks: 50,
  attachments: ['link-to-file.pdf'],
});

// This automatically creates notifications for all students' parents
```

**Get assignment submissions**
```typescript
// By student
const { submissions } = useAssignmentSubmissions({ 
  studentId: 'STU001' 
});

// By assignment
const { submissions } = useAssignmentSubmissions({ 
  assignmentId: 'ASG001' 
});
```

**Submit an assignment**
```typescript
const submission = dataService.assignmentSubmission.submit({
  assignmentId: 'ASG001',
  studentId: 'STU001',
  files: ['submission.pdf'],
  remarks: 'Completed all questions',
});
```

**Grade a submission**
```typescript
dataService.assignmentSubmission.grade(
  'SUB001', // submission ID
  45, // marks obtained
  'Good work! Review question 5.',
  'teacher1' // graded by
);

// This automatically notifies the parent
```

---

### Exams & Results

**Get upcoming exams**
```typescript
const { exams } = useExams({ upcoming: true });
```

**Get exams for a class**
```typescript
const { exams } = useExams({ 
  class: '8th', 
  section: 'A' 
});
```

**Create an exam**
```typescript
const newExam = dataService.exam.create({
  name: 'Mid-term Examination',
  type: 'mid-term',
  subject: 'Mathematics',
  class: '8th',
  section: 'A',
  date: '2026-03-15',
  duration: 120, // minutes
  totalMarks: 100,
  passingMarks: 40,
  syllabus: 'Chapters 1-5',
});
```

**Get exam results**
```typescript
// By student
const { results } = useExamResults({ studentId: 'STU001' });

// By exam
const { results } = useExamResults({ examId: 'EXM001' });
```

**Create exam result**
```typescript
const result = dataService.examResult.create({
  examId: 'EXM001',
  studentId: 'STU001',
  marksObtained: 85,
  totalMarks: 100,
  rank: 5,
  remarks: 'Excellent performance',
});

// Automatically calculates percentage and grade
// Grade: A+ (≥90%), A (≥80%), B+ (≥70%), B (≥60%), C (≥50%), D (≥40%), F (<40%)
```

---

### Fees

**Get fee payments for a student**
```typescript
const { payments } = useFeePayments({ studentId: 'STU001' });
```

**Create fee payment**
```typescript
const payment = dataService.fee.createPayment({
  studentId: 'STU001',
  amount: 5000,
  paymentDate: '2026-03-02',
  paymentMode: 'online',
  transactionId: 'TXN123456',
  collectedBy: 'admin1',
  components: [
    { name: 'Tuition Fee', amount: 3000 },
    { name: 'Bus Fee', amount: 1500 },
    { name: 'Library Fee', amount: 500 }
  ],
  academicYear: '2024-2025',
});

// Automatically generates receipt number
// Automatically notifies parent
```

---

### Announcements

**Get active announcements**
```typescript
const { announcements } = useAnnouncements({ activeOnly: true });
```

**Get announcements for specific role**
```typescript
const { announcements } = useAnnouncements({ 
  role: 'student',
  class: '8th',
  section: 'A'
});
```

**Create announcement**
```typescript
const announcement = dataService.announcement.create({
  title: 'School Holiday',
  message: 'School will be closed on March 10th for Republic Day',
  type: 'holiday',
  postedBy: 'admin1',
  targetAudience: 'all', // or 'students', 'teachers', 'parents', 'specific-class'
  priority: 'high',
  expiryDate: '2026-03-10',
});
```

---

### Events

**Get upcoming events**
```typescript
const { events } = useEvents({ upcoming: true });
```

**Create event**
```typescript
const event = dataService.event.create({
  title: 'Annual Sports Day',
  description: 'Inter-house sports competition',
  type: 'sports',
  date: '2026-03-20',
  startTime: '09:00 AM',
  endTime: '04:00 PM',
  venue: 'School Playground',
  organizer: 'Sports Department',
  targetAudience: 'all',
});
```

---

### Notifications

**Get user notifications**
```typescript
const { 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead 
} = useNotifications('user_id');
```

**Create notification**
```typescript
const notification = dataService.notification.create({
  userId: 'parent1',
  type: 'attendance',
  title: 'Child Arrived at School',
  message: 'John Doe arrived at school at 08:30 AM',
  date: '2026-03-02',
});
```

**Mark as read**
```typescript
markAsRead('NOTIF001');
```

**Mark all as read**
```typescript
markAllAsRead();
```

---

### Statistics

**Get dashboard stats**
```typescript
const { stats } = useDashboardStats();

// Returns:
// {
//   totalStudents,
//   totalTeachers,
//   presentToday,
//   absentToday,
//   activeAnnouncements,
//   attendancePercentage
// }
```

**Get student performance**
```typescript
const { performance } = useStudentPerformance('STU001');

// Returns:
// {
//   overallPercentage,
//   examPercentage,
//   assignmentPercentage,
//   totalExams,
//   totalAssignments,
//   gradedAssignments,
//   pendingAssignments
// }
```

**Get class statistics**
```typescript
const { statistics } = useClassStatistics('8th', 'A');

// Returns:
// {
//   totalStudents,
//   presentToday,
//   absentToday,
//   attendancePercentage
// }
```

---

## 🎨 Common Patterns

### Pattern 1: Display Student List with Attendance
```typescript
function ClassAttendance() {
  const { students } = useStudents({ class: '8th', section: 'A' });
  const today = new Date().toISOString().split('T')[0];
  const { attendance } = useAttendance({ date: today });

  return (
    <div>
      {students.map(student => {
        const record = attendance.find(a => a.studentId === student.id);
        return (
          <div key={student.id}>
            <span>{student.name}</span>
            <span>{record?.status || 'Not marked'}</span>
          </div>
        );
      })}
    </div>
  );
}
```

### Pattern 2: Student Performance Card
```typescript
function StudentPerformanceCard({ studentId }) {
  const { performance, loading } = useStudentPerformance(studentId);
  
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h3>Overall: {performance.overallPercentage}%</h3>
      <p>Exams: {performance.examPercentage}%</p>
      <p>Assignments: {performance.assignmentPercentage}%</p>
    </div>
  );
}
```

### Pattern 3: Assignment Submission Status
```typescript
function AssignmentList({ studentId }) {
  const student = useStudents().students.find(s => s.id === studentId);
  const { assignments } = useAssignments({ 
    class: student?.class, 
    section: student?.section 
  });
  const { submissions } = useAssignmentSubmissions({ studentId });

  return (
    <div>
      {assignments.map(assignment => {
        const submission = submissions.find(s => s.assignmentId === assignment.id);
        const status = !submission ? 'pending' : submission.status;
        
        return (
          <div key={assignment.id}>
            <h4>{assignment.title}</h4>
            <span>{status}</span>
            {submission?.marksObtained && (
              <span>{submission.marksObtained}/{assignment.totalMarks}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### Pattern 4: Parent Dashboard - All Children
```typescript
function ParentDashboard() {
  const { user } = useAuth();
  const { students: children } = useStudents({ parentId: user.id });

  return (
    <div>
      {children.map(child => (
        <ChildCard key={child.id} studentId={child.id} />
      ))}
    </div>
  );
}

function ChildCard({ studentId }) {
  const { performance } = useStudentPerformance(studentId);
  const { stats } = useAttendance({ studentId });
  
  return (
    <div>
      <h3>Performance: {performance?.overallPercentage}%</h3>
      <p>Attendance: {stats?.percentage}%</p>
    </div>
  );
}
```

### Pattern 5: Teacher - Create Assignment Flow
```typescript
function CreateAssignment() {
  const { user } = useAuth();
  const { refresh } = useAssignments();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    section: '',
    dueDate: '',
    totalMarks: 0,
  });

  const handleSubmit = () => {
    // Create assignment
    dataService.assignment.create({
      ...formData,
      assignedBy: user.id,
      assignedDate: new Date().toISOString().split('T')[0],
    });

    // Refresh the assignments list
    refresh();

    // Reset form
    setFormData({ /* ... */ });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 🔄 Refresh Data

All hooks return a `refresh()` function:

```typescript
const { students, refresh } = useStudents();

// After creating/updating/deleting
dataService.student.create({ /* ... */ });
refresh(); // Updates the hook data
```

Or manually call the hook again:

```typescript
// Changes in filters will automatically refresh
const [classFilter, setClassFilter] = useState('8th');
const { students } = useStudents({ class: classFilter });

// Changing the filter automatically fetches new data
setClassFilter('9th');
```

---

## 🎯 Data Types Reference

### Student Status
- `'active'` - Currently enrolled
- `'inactive'` - Not active
- `'transferred'` - Transferred to another school

### Attendance Status
- `'present'` - Student present
- `'absent'` - Student absent
- `'late'` - Student late
- `'half-day'` - Half day attendance
- `'leave'` - On approved leave

### Assignment Status
- `'pending'` - Not submitted
- `'submitted'` - Submitted, awaiting grading
- `'graded'` - Graded with feedback

### Exam Types
- `'unit-test'` - Unit test
- `'mid-term'` - Mid-term exam
- `'final'` - Final exam
- `'practical'` - Practical exam

### Payment Modes
- `'cash'` - Cash payment
- `'card'` - Card payment
- `'upi'` - UPI payment
- `'cheque'` - Cheque payment
- `'online'` - Online transfer

### Announcement Types
- `'general'` - General announcement
- `'urgent'` - Urgent notice
- `'event'` - Event notification
- `'holiday'` - Holiday notice
- `'exam'` - Exam related

### Event Types
- `'holiday'` - School holiday
- `'exam'` - Examination
- `'ptm'` - Parent-teacher meeting
- `'sports'` - Sports event
- `'cultural'` - Cultural event
- `'other'` - Other events

---

## 💡 Pro Tips

### Tip 1: Combine Multiple Hooks
```typescript
function StudentProfile({ studentId }) {
  const student = useStudents().students.find(s => s.id === studentId);
  const { attendance, stats } = useAttendance({ studentId });
  const { performance } = useStudentPerformance(studentId);
  const { results } = useExamResults({ studentId });
  const { submissions } = useAssignmentSubmissions({ studentId });

  // Now you have all student data in one component
}
```

### Tip 2: Filter Client-Side for Complex Queries
```typescript
const { students } = useStudents();

// Filter students with low attendance
const lowAttendanceStudents = students.filter(student => {
  const stats = dataService.attendance.getAttendanceStats(student.id);
  return stats.percentage < 75;
});
```

### Tip 3: Use Statistics Service for Calculations
```typescript
// Don't calculate manually
const { students } = useStudents({ class: '8th', section: 'A' });
const presentCount = /* manual calculation */;

// Use the statistics service instead
const { statistics } = useClassStatistics('8th', 'A');
const presentToday = statistics.presentToday;
```

### Tip 4: Auto-Refresh After Mutations
```typescript
function MarkAttendanceButton({ studentId, date, status }) {
  const { refresh } = useAttendance({ studentId });

  const handleMark = () => {
    dataService.attendance.markAttendance([{
      studentId,
      date,
      status
    }]);
    refresh(); // UI updates immediately
  };

  return <button onClick={handleMark}>Mark {status}</button>;
}
```

---

## 🐛 Troubleshooting

### Problem: Data not updating
**Solution**: Call `refresh()` after mutations
```typescript
const { students, refresh } = useStudents();

dataService.student.create({ /* ... */ });
refresh(); // Don't forget this!
```

### Problem: Hook returns empty array
**Solution**: Check filters
```typescript
// May return empty if no students in class
const { students } = useStudents({ class: '12th', section: 'Z' });

// Check what data exists
console.log(dataService.student.getAll());
```

### Problem: Notifications not created
**Solution**: Ensure parentId is set
```typescript
// Parent must have parentId link
const student = dataService.student.create({
  // ...
  parentId: '5', // Must link to parent user
});

// Now notifications will be auto-created for this parent
```

---

## 📝 Cheat Sheet

```typescript
// STUDENTS
useStudents()                                    // All students
useStudents({ class: '8th', section: 'A' })     // By class
useStudents({ parentId: '5' })                  // By parent
dataService.student.create({ /* ... */ })       // Create
dataService.student.update(id, { /* ... */ })   // Update

// ATTENDANCE
useAttendance({ studentId: 'STU001' })          // By student
useAttendance({ date: '2026-03-02' })           // By date
dataService.attendance.markAttendance([...])    // Mark
dataService.attendance.getAttendanceStats(id)   // Stats

// ASSIGNMENTS
useAssignments({ class: '8th', section: 'A' })  // By class
dataService.assignment.create({ /* ... */ })    // Create
useAssignmentSubmissions({ studentId })         // By student
dataService.assignmentSubmission.submit({})     // Submit
dataService.assignmentSubmission.grade(id,...)  // Grade

// EXAMS & RESULTS
useExams({ upcoming: true })                    // Upcoming
useExamResults({ studentId: 'STU001' })         // By student
dataService.exam.create({ /* ... */ })          // Create exam
dataService.examResult.create({ /* ... */ })    // Create result

// FEES
useFeePayments({ studentId: 'STU001' })         // By student
dataService.fee.createPayment({ /* ... */ })    // Payment

// OTHERS
useAnnouncements({ activeOnly: true })          // Active
useEvents({ upcoming: true })                   // Upcoming
useNotifications(userId)                        // By user
useDashboardStats()                             // Dashboard
useStudentPerformance(studentId)                // Performance
```

---

**Last Updated**: March 2, 2026  
**For**: School Management System v2.0  
**Quick help**: Check `/utils/centralDataService.ts` for full API

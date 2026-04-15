/**
 * Example Usage Scenarios for Parent Dashboard Notifications
 * Copy these examples to your backend/admin code to start sending notifications
 */

// ============================================================================
// SCENARIO 1: Publish Exam Results (When Teacher/Admin publishes exam)
// ============================================================================

import { notificationAggregator } from '../services/notificationAggregator';
import dataService from '../utils/firestoreService';

async function publishExamResults(examId: string, schoolId: string) {
  try {
    // 1. Fetch all exam results for this exam
    const results = await dataService.examResult.getByExam(examId);

    // 2. For each result, get student and parent details
    for (const result of results) {
      const student = await dataService.student.getById(result.studentId);
      if (!student) continue;

      // 3. Find parent ID (assuming stored in student.parentId)
      const parentId = student.parentId || (await getParentIdByStudentEmail(student.email));

      // 4. Create notification for each parent
      await notificationAggregator.createExamResultNotification({
        studentId: result.studentId,
        studentName: student.name,
        examId: examId,
        examName: result.examName || 'Exam',
        marks: result.marksObtained,
        totalMarks: result.totalMarks || 100,
        percentage: result.percentage || 0,
        grade: result.grade || 'N/A',
        class: student.class || '',
        section: student.section || '',
        parentId: parentId,
        schoolId: schoolId,
      });
    }

    console.log(`✅ Exam result notifications sent to ${results.length} parents`);
  } catch (error) {
    console.error('❌ Error publishing exam results:', error);
  }
}

// Usage:
// await publishExamResults('exam-abc123', 'school-xyz');

// ============================================================================
// SCENARIO 2: Send School Announcement (Admin broadcasts message)
// ============================================================================

async function broadcastSchoolAnnouncement(params: {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetClass?: string; // Leave empty for school-wide
  targetSection?: string;
  schoolId: string;
}) {
  try {
    // 1. Get all parents (or specific class parents)
    let parents = [];

    if (params.targetClass && params.targetSection) {
      // Get parents of specific class
      const classStudents = await dataService.student.getByClass(
        params.targetClass,
        params.targetSection
      );
      parents = classStudents
        .map((s: any) => s.parentId)
        .filter((id: string) => id);
    } else {
      // Get all parents in school
      const allStudents = await dataService.student.getAll();
      parents = allStudents
        .map((s: any) => s.parentId)
        .filter((id: string) => id);
      // Remove duplicates
      parents = [...new Set(parents)];
    }

    // 2. Send bulk announcement notification
    await notificationAggregator.createBulkNotification({
      parentIds: parents,
      schoolId: params.schoolId,
      class: params.targetClass || '',
      section: params.targetSection || '',
      type: 'announcement',
      title: params.title,
      message: params.content.substring(0, 200),
      link: `/parent/dashboard/announcements/`,
    });

    console.log(`✅ Announcement sent to ${parents.length} parents`);
  } catch (error) {
    console.error('❌ Error broadcasting announcement:', error);
  }
}

// Usage:
// await broadcastSchoolAnnouncement({
//   title: 'Annual Day Celebration',
//   content: 'Our annual day celebration is scheduled for April 25. All students must participate...',
//   priority: 'high',
//   targetClass: '10',
//   targetSection: 'A',
//   schoolId: 'school-123',
// });

// ============================================================================
// SCENARIO 3: Send Fee Reminders (Cron job or manual trigger)
// ============================================================================

async function sendFeeReminders(schoolId: string) {
  try {
    // 1. Get all pending/overdue invoices
    const allInvoices = await dataService.feeInvoice.getAll();

    const pendingInvoices = allInvoices.filter((inv: any) =>
      ['pending', 'overdue', 'partial'].includes(inv.status)
    );

    // 2. For each invoice, create notification
    for (const invoice of pendingInvoices) {
      const student = await dataService.student.getById(invoice.studentId);
      if (!student) continue;

      const parentId = student.parentId;

      // Determine status and message urgency
      let status: 'pending' | 'overdue' | 'partial' = 'pending';
      if (invoice.status === 'overdue') status = 'overdue';
      else if (invoice.status === 'partial') status = 'partial';

      await notificationAggregator.createFeeReminderNotification({
        studentId: invoice.studentId,
        studentName: student.name,
        invoiceId: invoice.id,
        amount: invoice.totalBalance || invoice.amount,
        dueDate: invoice.dueDate,
        status: status,
        class: student.class || '',
        section: student.section || '',
        parentId: parentId,
        schoolId: schoolId,
      });
    }

    console.log(`✅ Fee reminders sent for ${pendingInvoices.length} invoices`);
  } catch (error) {
    console.error('❌ Error sending fee reminders:', error);
  }
}

// Usage (run daily via cron):
// Every day at 10 AM, Firebase scheduled function calls:
// await sendFeeReminders('school-123');

// ============================================================================
// SCENARIO 4: Alert Parents of School Events
// ============================================================================

async function alertParentsOfUpcomingEvent(params: {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  schoolId: string;
  daysInAdvance?: number; // Only alert N days before
}) {
  try {
    const eventDate = new Date(params.eventDate);
    const now = new Date();
    const daysUntil = Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only send if within alert window (e.g., within 7 days or as specified)
    const alertWindow = params.daysInAdvance || 7;
    if (daysUntil > alertWindow) {
      console.log(`Event is ${daysUntil} days away, skipping alert`);
      return;
    }

    // 1. Get all parents
    const allStudents = await dataService.student.getAll();
    const parentIds = [...new Set(allStudents.map((s: any) => s.parentId).filter((id: string) => id))];

    // 2. Send event alerts
    for (const parentId of parentIds) {
      await notificationAggregator.createEventAlertNotification({
        eventId: params.eventId,
        eventName: params.eventName,
        description: `${params.eventName} - scheduled for ${params.eventDate}`,
        eventDate: params.eventDate,
        eventTime: params.eventTime,
        location: params.location,
        schoolId: params.schoolId,
        parentId: parentId,
        daysAhead: daysUntil,
      });
    }

    console.log(`✅ Event alerts sent to ${parentIds.length} parents`);
  } catch (error) {
    console.error('❌ Error alerting event:', error);
  }
}

// Usage:
// await alertParentsOfUpcomingEvent({
//   eventId: 'event-123',
//   eventName: 'Annual Sports Day',
//   eventDate: '2025-04-25',
//   eventTime: '09:00 AM',
//   location: 'School Ground',
//   schoolId: 'school-123',
//   daysInAdvance: 7,
// });

// ============================================================================
// SCENARIO 5: Notify Parents of Attendance
// ============================================================================

async function notifyAttendanceStatus(params: {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  reason?: string;
  schoolId: string;
}) {
  try {
    const student = await dataService.student.getById(params.studentId);
    if (!student) {
      console.warn('Student not found:', params.studentId);
      return;
    }

    // Only notify for absences or special cases (not for every present)
    const shouldNotify = ['absent', 'late', 'leave'].includes(params.status);

    if (!shouldNotify) {
      console.log('Attendance is normal, skipping notification');
      return;
    }

    const parentId = student.parentId;

    await notificationAggregator.createAttendanceNotification({
      studentId: params.studentId,
      studentName: student.name,
      attendanceStatus: params.status,
      date: params.date,
      class: student.class || '',
      section: student.section || '',
      parentId: parentId,
      schoolId: params.schoolId,
      reason: params.reason,
    });

    console.log(`✅ Attendance notification sent for ${student.name}`);
  } catch (error) {
    console.error('❌ Error notifying attendance:', error);
  }
}

// Usage (call after marking attendance):
// await notifyAttendanceStatus({
//   studentId: 'student-123',
//   date: '2025-04-15',
//   status: 'absent',
//   reason: 'Medical appointment',
//   schoolId: 'school-123',
// });

// ============================================================================
// SCENARIO 6: Notify About New Assignments
// ============================================================================

async function notifyNewAssignment(params: {
  assignmentId: string;
  title: string;
  class: string;
  section: string;
  dueDate: string;
  subject?: string;
  schoolId: string;
}) {
  try {
    // 1. Get all students in this class
    const students = await dataService.student.getByClass(params.class, params.section);

    // 2. Get parent IDs
    const parentIds = students
      .map((s: any) => s.parentId)
      .filter((id: string) => id);

    // Remove duplicates
    const uniqueParentIds = [...new Set(parentIds)];

    // 3. Send bulk notification
    await notificationAggregator.createBulkNotification({
      parentIds: uniqueParentIds,
      schoolId: params.schoolId,
      class: params.class,
      section: params.section,
      type: 'assignment',
      title: `📝 New Assignment: ${params.title}`,
      message: `Due on ${params.dueDate}${params.subject ? ` (${params.subject})` : ''}`,
      link: `/parent/dashboard/assignments/${params.assignmentId}`,
    });

    console.log(`✅ Assignment notification sent to ${uniqueParentIds.length} parents`);
  } catch (error) {
    console.error('❌ Error notifying assignment:', error);
  }
}

// Usage (call when assignment is created):
// await notifyNewAssignment({
//   assignmentId: 'assign-123',
//   title: 'Solve 10 Math Problems',
//   class: '10',
//   section: 'A',
//   dueDate: '2025-04-20',
//   subject: 'Mathematics',
//   schoolId: 'school-123',
// });

// ============================================================================
// INTEGRATION POINTS (Where to call these functions)
// ============================================================================

// 1. After publishing exam results (School Admin Dashboard)
// File: src/pages/school-admin/ExamPublishPage.tsx or similar
// Trigger: publishExamResults(examId, schoolId)

// 2. After creating/publishing announcement (School Admin)
// File: src/components/AnnouncementModule.tsx or similar
// Trigger: broadcastSchoolAnnouncement({ ... })

// 3. Via cron job (daily reminder service)
// File: backend/src/cron/fee-reminder.ts
// Trigger: sendFeeReminders(schoolId) AT 10:00 AM daily

// 4. After marking attendance (Attendance Module)
// File: src/components/AttendanceMarking.tsx
// Trigger: notifyAttendanceStatus({ ... }) for absences only

// 5. After creating new assignment (Assignment Module)
// File: src/components/AssignmentModule.tsx
// Trigger: notifyNewAssignment({ ... })

// 6. Cron job for upcoming events (7 days before)
// File: backend/src/cron/event-alerts.ts
// Trigger: alertParentsOfUpcomingEvent({ ... })

// ============================================================================
// DEBUGGING: Check Notifications in Firebase Console
// ============================================================================

// Navigate to Firebase Console → Firestore → Collections → notifications
// Filter by:
// - userId = parent's uid
// - date = most recent
// - type = exam/announcement/etc.

// Check data structure:
// {
//   "id": "auto-generated",
//   "userId": "parent-uid-xyz",
//   "type": "exam",
//   "title": "Exam Results: Mid-Term",
//   "message": "John scored 85/100 (85%) - Grade: 🟢 A",
//   "date": "2025-04-15T10:30:00Z",
//   "read": false,
//   "school_id": "school-123",
//   "link": "/parent/dashboard/exams/exam-abc"
// }

// ============================================================================
// HELPER FUNCTIONS (Add these to your codebase)
// ============================================================================

async function getParentIdByStudentEmail(studentEmail: string): Promise<string | null> {
  try {
    // Query users collection to find parent user
    const users = await dataService.user.getByEmail(studentEmail);
    if (users && users.length > 0) {
      return users[0].parentId || null;
    }
    return null;
  } catch (error) {
    console.error('Error finding parent:', error);
    return null;
  }
}

// Forward these to your backend if needed
export {
  publishExamResults,
  broadcastSchoolAnnouncement,
  sendFeeReminders,
  alertParentsOfUpcomingEvent,
  notifyAttendanceStatus,
  notifyNewAssignment,
};

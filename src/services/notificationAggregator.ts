/**
 * Notification Aggregator Service
 * Centralizes creation of notifications for exam results, announcements, fee reminders, and events
 * from School Admin to Parents
 */

import { notificationService } from '../utils/firestoreService';
import { Notification } from '../types/index';

export interface AggregatedNotification extends Notification {
  category: 'exam' | 'announcement' | 'fee' | 'event' | 'assignment' | 'attendance' | 'general';
  sourceId?: string; // ID of the source resource (examId, announcementId, etc)
  sourceType?: string;
  metadata?: {
    [key: string]: any;
  };
}

export const notificationAggregator = {
  /**
   * Create exam result notification for a parent
   */
  createExamResultNotification: async (params: {
    studentId: string;
    studentName: string;
    examId: string;
    examName: string;
    marks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    class: string;
    section: string;
    parentId: string;
    schoolId: string;
  }): Promise<Notification> => {
    const percentage = Math.round(params.percentage);
    const gradeColor = params.grade === 'A' ? '🟢' : params.grade === 'B' ? '🔵' : params.grade === 'C' ? '🟡' : '🔴';

    return notificationService.create({
      userId: params.parentId,
      school_id: params.schoolId,
      recipientRole: 'parent',
      class: params.class,
      section: params.section,
      type: 'exam',
      title: `Exam Results: ${params.examName}`,
      message: `${params.studentName} scored ${params.marks}/${params.totalMarks} (${percentage}%) - Grade: ${gradeColor} ${params.grade}`,
      date: new Date().toISOString(),
      read: false,
      link: `/parent/dashboard/exams/${params.examId}`,
    });
  },

  /**
   * Create school announcement notification
   */
  createAnnouncementNotification: async (params: {
    announcementId: string;
    title: string;
    content: string;
    targetAudience: string; // 'all' | 'parent' | 'student' | 'teacher'
    targetClass?: string;
    targetSection?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    schoolId: string;
    parentId?: string;
    recipientRole?: string;
  }): Promise<Notification> => {
    const priorityEmoji = {
      low: '📌',
      medium: '📢',
      high: '⚠️',
      urgent: '🔴',
    }[params.priority];

    return notificationService.create({
      userId: params.parentId || 'all',
      school_id: params.schoolId,
      recipientRole: params.recipientRole || 'parent',
      class: params.targetClass,
      section: params.targetSection,
      type: 'announcement',
      title: `${priorityEmoji} ${params.title}`,
      message: params.content.substring(0, 200) + (params.content.length > 200 ? '...' : ''),
      date: new Date().toISOString(),
      read: false,
      link: `/parent/dashboard/announcements/${params.announcementId}`,
    });
  },

  /**
   * Create fee reminder notification
   */
  createFeeReminderNotification: async (params: {
    studentId: string;
    studentName: string;
    invoiceId: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'overdue' | 'partial';
    class: string;
    section: string;
    parentId: string;
    schoolId: string;
  }): Promise<Notification> => {
    const statusEmoji = {
      pending: '⏰',
      overdue: '🔴',
      partial: '🟡',
    }[params.status];

    const daysUntilDue = Math.ceil(
      (new Date(params.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let message = '';
    if (params.status === 'overdue') {
      message = `${statusEmoji} Fee overdue for ${params.studentName}! Amount due: ₹${params.amount.toLocaleString('en-IN')}`;
    } else if (params.status === 'partial') {
      message = `${statusEmoji} Partial fee paid for ${params.studentName}. Pending amount: ₹${params.amount.toLocaleString('en-IN')}`;
    } else {
      message = `${statusEmoji} Fee reminder for ${params.studentName}. Amount: ₹${params.amount.toLocaleString('en-IN')} - Due in ${daysUntilDue} days`;
    }

    const title = params.status === 'overdue' ? 'Action Required: Fee Overdue' : 'Fee Reminder';

    return notificationService.create({
      userId: params.parentId,
      school_id: params.schoolId,
      recipientRole: 'parent',
      class: params.class,
      section: params.section,
      type: 'fee',
      title,
      message,
      date: new Date().toISOString(),
      read: false,
      link: `/parent/dashboard/fees/${params.invoiceId}`,
    });
  },

  /**
   * Create event alert notification
   */
  createEventAlertNotification: async (params: {
    eventId: string;
    eventName: string;
    description: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    targetClass?: string;
    targetSection?: string;
    schoolId: string;
    parentId?: string;
    recipientRole?: string;
    daysAhead?: number;
  }): Promise<Notification> => {
    const eventDateObj = new Date(params.eventDate);
    const now = new Date();
    const daysAhead = params.daysAhead || Math.ceil((eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const eventEmoji = daysAhead <= 1 ? '🚨' : daysAhead <= 7 ? '📅' : '📌';

    let message = `${eventEmoji} ${params.eventName}`;
    if (params.eventTime) {
      message += ` at ${params.eventTime}`;
    }
    if (params.location) {
      message += ` | Location: ${params.location}`;
    }
    if (daysAhead <= 1 && daysAhead > 0) {
      message += ' ⏰ Coming tomorrow!';
    } else if (daysAhead <= 0) {
      message += ' 🎉 Today!';
    }

    return notificationService.create({
      userId: params.parentId || 'all',
      school_id: params.schoolId,
      recipientRole: params.recipientRole || 'parent',
      class: params.targetClass,
      section: params.targetSection,
      type: 'general',
      title: 'School Event Alert',
      message: message.substring(0, 300),
      date: new Date().toISOString(),
      read: false,
      link: `/parent/dashboard/events/${params.eventId}`,
    });
  },

  /**
   * Create assignment notification
   */
  createAssignmentNotification: async (params: {
    studentId: string;
    assignmentId: string;
    assignmentTitle: string;
    class: string;
    section: string;
    dueDate: string;
    parentId: string;
    schoolId: string;
    subject?: string;
  }): Promise<Notification> => {
    const daysUntilDue = Math.ceil(
      (new Date(params.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return notificationService.create({
      userId: params.parentId,
      school_id: params.schoolId,
      recipientRole: 'parent',
      class: params.class,
      section: params.section,
      type: 'assignment',
      title: `📝 New Assignment: ${params.assignmentTitle}`,
      message: `Assignment due in ${daysUntilDue} day(s). ${params.subject ? `Subject: ${params.subject}` : ''}`,
      date: new Date().toISOString(),
      read: false,
      link: `/parent/dashboard/assignments/${params.assignmentId}`,
    });
  },

  /**
   * Create attendance notification
   */
  createAttendanceNotification: async (params: {
    studentId: string;
    studentName: string;
    attendanceStatus: 'present' | 'absent' | 'late' | 'leave';
    date: string;
    class: string;
    section: string;
    parentId: string;
    schoolId: string;
    reason?: string;
  }): Promise<Notification> => {
    const statusEmoji = {
      present: '✅',
      absent: '❌',
      late: '⏰',
      leave: '📝',
    }[params.attendanceStatus];

    const title = params.attendanceStatus === 'absent' ? 'Absence Alert' : 'Attendance Update';

    return notificationService.create({
      userId: params.parentId,
      school_id: params.schoolId,
      recipientRole: 'parent',
      class: params.class,
      section: params.section,
      type: 'attendance',
      title,
      message: `${statusEmoji} ${params.studentName} marked ${params.attendanceStatus} on ${new Date(params.date).toLocaleDateString('en-IN')}${params.reason ? ` - ${params.reason}` : ''}`,
      date: new Date().toISOString(),
      read: false,
      link: `/parent/dashboard/attendance/${params.date}`,
    });
  },

  /**
   * Bulk create notifications for all parents of a class
   */
  createBulkNotification: async (params: {
    parentIds: string[];
    schoolId: string;
    class: string;
    section: string;
    type: 'exam' | 'announcement' | 'fee' | 'event' | 'assignment' | 'attendance' | 'general';
    title: string;
    message: string;
    recipientRole?: string;
    link?: string;
  }): Promise<Notification[]> => {
    const notifications = await Promise.all(
      params.parentIds.map(parentId =>
        notificationService.create({
          userId: parentId,
          school_id: params.schoolId,
          recipientRole: params.recipientRole || 'parent',
          class: params.class,
          section: params.section,
          type: params.type as any,
          title: params.title,
          message: params.message,
          date: new Date().toISOString(),
          read: false,
          link: params.link,
        })
      )
    );
    return notifications;
  },
};

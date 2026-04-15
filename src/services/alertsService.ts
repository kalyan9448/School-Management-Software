// =============================================================================
// Alerts & Notifications Service — Generates system alerts for parents
// Monitors student data and creates contextual alerts
// =============================================================================

import {
  notificationService,
  examScoreService,
  attendanceService,
  assignmentSubmissionService,
} from '../utils/centralDataService';
import type { ExamScore, AttendanceRecord, AssignmentSubmission } from '../types';

export interface Alert {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestion?: string;
}

// ==================== ACADEMIC PERFORMANCE ALERTS ====================

/**
 * Check exam scores and generate alerts for poor performance
 */
export async function checkAcademicPerformance(studentId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    const scores = await examScoreService.getByStudent(studentId);
    
    if (scores.length === 0) {
      return alerts;
    }

    const recentScores = scores.slice(0, 5);
    const recentAverage = recentScores.reduce((sum, s) => sum + s.percentage, 0) / recentScores.length;

    // Alert for poor performance
    if (recentAverage < 40) {
      alerts.push({
        type: 'warning',
        title: 'Poor Academic Performance',
        message: `Recent exam average is ${Math.round(recentAverage)}%. Please consider additional support.`,
        date: new Date().toISOString(),
        severity: 'high',
        actionable: true,
        suggestion: 'Schedule a meeting with the teacher to discuss areas of improvement.',
      });
    } else if (recentAverage < 60) {
      alerts.push({
        type: 'warning',
        title: 'Below Average Performance',
        message: `Recent exam average is ${Math.round(recentAverage)}%. Additional help might be beneficial.`,
        date: new Date().toISOString(),
        severity: 'medium',
        actionable: true,
        suggestion: 'Consider arranging tuition or study group sessions.',
      });
    }

    // Alert for excellent performance
    if (recentAverage >= 80) {
      alerts.push({
        type: 'success',
        title: 'Excellent Academic Performance',
        message: `Outstanding! Recent average is ${Math.round(recentAverage)}%. Great work!`,
        date: new Date().toISOString(),
        severity: 'low',
        actionable: false,
        suggestion: 'Encourage continued excellence and exploration of advanced topics.',
      });
    }

    // Alert for subject-wise performance
    const subjectAverages: Record<string, number[]> = {};
    scores.forEach(score => {
      if (!subjectAverages[score.subjectId]) {
        subjectAverages[score.subjectId] = [];
      }
      subjectAverages[score.subjectId].push(score.percentage);
    });

    Object.entries(subjectAverages).forEach(([subject, percentages]) => {
      const avg = percentages.reduce((a, b) => a + b) / percentages.length;
      if (avg < 40) {
        alerts.push({
          type: 'warning',
          title: `Critical Performance in ${subject}`,
          message: `Average performance in ${subject} is ${Math.round(avg)}%. Immediate action needed.`,
          date: new Date().toISOString(),
          severity: 'high',
          actionable: true,
          suggestion: `Focus on fundamentals in ${subject} with concentrated study sessions.`,
        });
      }
    });

  } catch (error) {
    console.error('Error checking academic performance:', error);
  }

  return alerts;
}

// ==================== ATTENDANCE ALERTS ====================

/**
 * Check attendance and generate alerts for absences
 */
export async function checkAttendanceAlerts(studentId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    const records = await attendanceService.getByStudent(studentId);

    if (records.length === 0) {
      return alerts;
    }

    // Get current month records
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRecords = records.filter(r => r.date.startsWith(currentMonth));

    if (monthlyRecords.length === 0) {
      return alerts;
    }

    const presentCount = monthlyRecords.filter(r => r.status === 'present').length;
    const attendancePercentage = (presentCount / monthlyRecords.length) * 100;

    if (attendancePercentage < 75) {
      const absenceCount = monthlyRecords.filter(r => r.status === 'absent').length;
      alerts.push({
        type: 'warning',
        title: 'Low Attendance Alert',
        message: `Attendance is ${Math.round(attendancePercentage)}%. Target is 75%. (${absenceCount} absences this month)`,
        date: new Date().toISOString(),
        severity: attendancePercentage < 50 ? 'high' : 'medium',
        actionable: true,
        suggestion:
          attendancePercentage < 50
            ? 'Urgent: Contact school regarding poor attendance. May affect final grades.'
            : 'Improve attendance for next month. One week of perfect attendance needed.',
      });
    } else {
      alerts.push({
        type: 'success',
        title: 'Good Attendance',
        message: `Current attendance is ${Math.round(attendancePercentage)}%. Well done!`,
        date: new Date().toISOString(),
        severity: 'low',
        actionable: false,
        suggestion: 'Maintain this excellent attendance record.',
      });
    }

    // Alert for consecutive absences
    let consecutiveAbsences = 0;
    let maxConsecutive = 0;

    monthlyRecords.forEach(record => {
      if (record.status === 'absent' || record.status === 'leave') {
        consecutiveAbsences++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveAbsences);
      } else {
        consecutiveAbsences = 0;
      }
    });

    if (maxConsecutive >= 3) {
      alerts.push({
        type: 'warning',
        title: 'Consecutive Absences Detected',
        message: `${maxConsecutive} consecutive absences recorded this month.`,
        date: new Date().toISOString(),
        severity: 'high',
        actionable: true,
        suggestion: 'Please provide medical certificate if needed. Ensure student attends regularly now.',
      });
    }

  } catch (error) {
    console.error('Error checking attendance:', error);
  }

  return alerts;
}

// ==================== HOMEWORK/ASSIGNMENT ALERTS ====================

/**
 * Check homework completion and generate alerts
 */
export async function checkHomeworkAlerts(studentId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    const submissions = await assignmentSubmissionService.getByStudent(studentId);

    if (submissions.length === 0) {
      return alerts;
    }

    const completedCount = submissions.filter(s => s.submitted).length;
    const completionPercentage = (completedCount / submissions.length) * 100;

    if (completionPercentage < 70) {
      alerts.push({
        type: 'warning',
        title: 'Low Homework Completion',
        message: `Only ${Math.round(completionPercentage)}% of assignments completed. Target is 70%.`,
        date: new Date().toISOString(),
        severity: 'medium',
        actionable: true,
        suggestion:
          completionPercentage < 50
            ? 'Urgent: Most assignments incomplete. Establish a daily homework routine.'
            : 'Improve submission rate. Set daily homework targets.',
      });
    } else if (completionPercentage >= 90) {
      alerts.push({
        type: 'success',
        title: 'Excellent Homework Submission',
        message: `${Math.round(completionPercentage)}% of assignments completed. Excellent discipline!`,
        date: new Date().toISOString(),
        severity: 'low',
        actionable: false,
        suggestion: 'Maintain this excellent habit of regular submission.',
      });
    }

    // Alert for pending assignments
    const pendingSubmissions = submissions.filter(s => !s.submitted);
    if (pendingSubmissions.length > 0) {
      const oldestPending = pendingSubmissions.sort(
        (a, b) => new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()
      )[0];

      const daysOld = Math.floor(
        (new Date().getTime() - new Date(oldestPending.assignedDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOld > 7) {
        alerts.push({
          type: 'warning',
          title: 'Overdue Assignments',
          message: `${pendingSubmissions.length} assignment(s) overdue by ${daysOld} days.`,
          date: new Date().toISOString(),
          severity: 'high',
          actionable: true,
          suggestion: `Complete pending assignments immediately. Talk to teacher for help if needed.`,
        });
      }
    }

  } catch (error) {
    console.error('Error checking homework:', error);
  }

  return alerts;
}

// ==================== TREND ANALYSIS ====================

/**
 * Analyze performance trends and generate alerts
 */
export async function analyzeTrends(studentId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    const scores = await examScoreService.getByStudent(studentId);

    if (scores.length < 5) {
      return alerts; // Need at least 5 scores to detect trend
    }

    const recentScores = scores.slice(0, 5).map(s => s.percentage);
    const olderScores = scores.slice(5, 10).map(s => s.percentage);

    if (olderScores.length > 0) {
      const recentAvg = recentScores.reduce((a, b) => a + b) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b) / olderScores.length;
      const change = recentAvg - olderAvg;

      if (change > 5) {
        alerts.push({
          type: 'success',
          title: 'Improving Performance Trend',
          message: `Excellent progress! Scores improved by ${Math.round(change)}% recently.`,
          date: new Date().toISOString(),
          severity: 'low',
          actionable: false,
          suggestion: 'Continue with current study strategies. Maintain momentum!',
        });
      } else if (change < -5) {
        alerts.push({
          type: 'warning',
          title: 'Declining Performance Trend',
          message: `Performance declining by ${Math.round(Math.abs(change))}%. Review study methods.`,
          date: new Date().toISOString(),
          severity: 'high',
          actionable: true,
          suggestion: 'Identify new challenges and adjust study approach. Seek teacher guidance.',
        });
      }
    }

  } catch (error) {
    console.error('Error analyzing trends:', error);
  }

  return alerts;
}

// ==================== COMPREHENSIVE ALERT GENERATION ====================

/**
 * Generate all alerts for a student
 */
export async function generateAllAlerts(studentId: string): Promise<Alert[]> {
  const allAlerts: Alert[] = [];

  try {
    // Run all alert checks in parallel
    const [academic, attendance, homework, trends] = await Promise.all([
      checkAcademicPerformance(studentId),
      checkAttendanceAlerts(studentId),
      checkHomeworkAlerts(studentId),
      analyzeTrends(studentId),
    ]);

    allAlerts.push(...academic, ...attendance, ...homework, ...trends);

    // Sort by severity and date
    allAlerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Limit to 10 most recent/important alerts
    return allAlerts.slice(0, 10);

  } catch (error) {
    console.error('Error generating alerts:', error);
    return allAlerts;
  }
}

// ==================== NOTIFICATION SENDING ====================

/**
 * Send alert as parent notification
 */
export async function sendAlertNotification(
  parentId: string,
  studentName: string,
  alert: Alert
): Promise<void> {
  try {
    await notificationService.create({
      userId: parentId,
      type: 'general',
      title: alert.title,
      message: `${studentName}: ${alert.message}` + (alert.suggestion ? ` ${alert.suggestion}` : ''),
      date: alert.date,
    });
  } catch (error) {
    console.error('Error sending alert notification:', error);
  }
}

/**
 * Send multiple alerts as notifications
 */
export async function sendBulkAlertNotifications(
  parentId: string,
  studentName: string,
  alerts: Alert[]
): Promise<void> {
  try {
    for (const alert of alerts) {
      await sendAlertNotification(parentId, studentName, alert);
    }
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
  }
}

// ==================== ALERT FILTERING ====================

/**
 * Get alerts of specific type
 */
export function filterAlertsByType(alerts: Alert[], type: 'warning' | 'success' | 'info'): Alert[] {
  return alerts.filter(alert => alert.type === type);
}

/**
 * Get actionable alerts
 */
export function getActionableAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter(alert => alert.actionable);
}

/**
 * Get high-severity alerts
 */
export function getCriticalAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter(alert => alert.severity === 'high');
}

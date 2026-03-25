import { lessonService, attendanceService } from './centralDataService';

export interface TimeSeriesPoint {
  month: string;
  attendance: number;
  engagement: number;
}

export interface ClassDelta {
  score: number;
  trend: 'up' | 'down' | 'stable';
  improvementPercentage: number;
  focusArea: string;
}

export interface InsightTrigger {
  id: string;
  type: 'achievement' | 'alert' | 'recommendation';
  message: string;
  actionLabel?: string;
}

class PerformanceAnalyticsService {
  /**
   * Simulates a Time-Series Database call to fetch historical performance trends
   */
  async getMonthlyTrends(teacherEmail: string): Promise<TimeSeriesPoint[]> {
    const allLogs = (await lessonService.getAll()).filter(l => l.teacherId === teacherEmail);
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    
    return months.map(m => {
      const monthLogs = allLogs.filter(l => {
        const date = new Date(l.date);
        return date.toLocaleString('default', { month: 'short' }) === m;
      });
      
      return {
        month: m,
        attendance: 85 + (monthLogs.length * 2) + Math.floor(Math.random() * 5),
        engagement: 75 + (monthLogs.length * 3) + Math.floor(Math.random() * 5),
      };
    });
  }

  /**
   * Analytics Service Core: Calculates "Class Delta" (Pedagogical Improvement)
   */
  async calculateClassDelta(classId: string): Promise<ClassDelta> {
    const [className, section] = classId.split('-');
    const allLessons = await lessonService.getAll();
    const classLessons = allLessons.filter(l => l.class === className && l.section === section);
    const lessonCount = classLessons.length || 0;
    
    const currentScore = Math.min(100, 75 + (lessonCount * 2));
    const improvement = 5 + (lessonCount * 0.5);

    return {
      score: currentScore,
      trend: 'up',
      improvementPercentage: Math.round(improvement),
      focusArea: lessonCount > 10 ? 'Strong Concept Retention' : 'Early Stage Development',
    };
  }

  /**
   * Insight Webhooks Simulation: Triggers notifications based on behavioral patterns
   */
  async getInsightTriggers(teacherEmail: string): Promise<InsightTrigger[]> {
    const triggers: InsightTrigger[] = [];
    
    const allLessons = await lessonService.getAll();
    const today = new Date().toISOString().split('T')[0];
    const teacherLessonsToday = allLessons.filter(l => l.teacherId === teacherEmail && l.date === today);

    if (teacherLessonsToday.length >= 4) {
      triggers.push({
        id: 'break-alert',
        type: 'alert',
        message: `High productivity! You've logged ${teacherLessonsToday.length} lessons today. Consider a 10-minute break.`,
        actionLabel: 'Schedule Break'
      });
    }

    const attendance = await attendanceService.getByDate(today);
    const averageAttendance = attendance.length > 0 
      ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 
      : 0;

    if (averageAttendance > 95) {
      triggers.push({
        id: 'high-attendance',
        type: 'achievement',
        message: 'Perfect Attendance! All students present in your sessions today.',
        actionLabel: 'Celebrate'
      });
    }

    if (triggers.length === 0) {
      triggers.push({
        id: 'standard-rec',
        type: 'recommendation',
        message: 'Class performance 6-A is trending up. Consider advanced materials.',
        actionLabel: 'View Materials'
      });
    }

    return triggers;
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();

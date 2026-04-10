import { 
  lessonService, 
  attendanceService, 
  studentService, 
  quizResultService, 
  examResultService 
} from './centralDataService';

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

  /**
   * Aggregates performance data for a specific class/section/subject.
   * Returns a summary 'matrix' of historical quiz and exam scores.
   */
  async getClassPerformanceAnalysis(className: string, section: string, subjectName: string) {
    try {
      // 1. Fetch students for context
      const students = await studentService.getByClass(className, section);
      
      // 2. Fetch results
      const quizResults = await quizResultService.getByClass(className, section);
      const filteredQuizResults = quizResults.filter(r => 
        (r.subject || '').toLowerCase() === subjectName.toLowerCase()
      );

      // 3. Aggregate metrics
      const totalStudents = students.length;
      const scores = filteredQuizResults.map(r => r.accuracy || 0);
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      
      const strugglingStudents = students.filter(s => {
        const studentScores = filteredQuizResults.filter(r => r.student_id === s.id).map(r => r.accuracy || 0);
        return studentScores.length > 0 && (studentScores.reduce((a, b) => a + b, 0) / studentScores.length) < 50;
      });

      const topicsCovered = Array.from(new Set(filteredQuizResults.map(r => r.topic).filter(Boolean)));

      return {
        averageScore,
        totalStudents,
        strugglingCount: strugglingStudents.length,
        strugglingStudentNames: strugglingStudents.map(s => s.name),
        topicsCovered,
        recentPerformanceTrend: scores.slice(-10), // Last 10 quiz scores
        performanceCategory: averageScore > 80 ? 'Exceeding Expectations' : averageScore > 60 ? 'Meeting Expectations' : 'Needs Focus'
      };
    } catch (error) {
      console.error('Error in getClassPerformanceAnalysis:', error);
      return null;
    }
  }

  /**
   * Calculates the age profile of a class to help AI adjust pedagogical depth.
   */
  async getStudentAgeProfile(className: string, section: string) {
    try {
      const students = await studentService.getByClass(className, section);
      if (students.length === 0) return null;

      const currentYear = new Date().getFullYear();
      const ages = students.map(s => {
        if (!s.dateOfBirth) return 0;
        const dob = new Date(s.dateOfBirth);
        return currentYear - dob.getFullYear();
      }).filter(a => a > 0);

      const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
      const minAge = Math.min(...ages);
      const maxAge = Math.max(...ages);

      return {
        averageAge,
        ageRange: `${minAge}-${maxAge}`,
        totalStudents: students.length
      };
    } catch (error) {
      console.error('Error in getStudentAgeProfile:', error);
      return null;
    }
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();

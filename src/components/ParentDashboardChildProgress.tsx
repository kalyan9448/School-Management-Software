import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Calendar,
  Loader,
  ChevronDown,
  Award,
} from 'lucide-react';
import {
  studentService,
  examScoreService,
  attendanceService,
  assignmentSubmissionService,
  ExamScore,
  AttendanceRecord,
  AssignmentSubmission,
} from '../utils/centralDataService';
import { useAuth } from '../contexts/AuthContext';

interface ChildProgress {
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  attendance: {
    presentCount: number;
    totalDays: number;
    percentage: number;
    monthlyBreakdown: Record<string, number>;
  };
  homework: {
    completedCount: number;
    totalCount: number;
    percentage: number;
  };
  examScores: {
    recentScores: ExamScore[];
    subjectWiseAverage: Record<string, { average: number; count: number }>;
    overallAverage: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  alerts: Array<{
    type: 'warning' | 'success' | 'info';
    title: string;
    message: string;
    date: string;
  }>;
}

export function ParentDashboardChildProgress({ targetChildId }: { targetChildId?: string | null }) {
  const { user } = useAuth();
  const [childrenProgress, setChildrenProgress] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(targetChildId || null);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadChildrenProgress = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Get parent's children
        const children = await studentService.getByParentId(user.id);

        // Load progress data for each child
        const progressData: ChildProgress[] = [];

        for (const child of children) {
          try {
            // Load attendance data
            const attendanceRecords = await attendanceService.getByStudent(child.id);
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const monthlyRecords = attendanceRecords.filter(r =>
              r.date.startsWith(currentMonth)
            );
            const presentCount = monthlyRecords.filter(r => r.status === 'present').length;
            const attendancePercentage =
              monthlyRecords.length > 0
                ? Math.round((presentCount / monthlyRecords.length) * 100)
                : 0;

            // Build monthly breakdown (last 6 months)
            const monthlyBreakdown: Record<string, number> = {};
            for (let i = 5; i >= 0; i--) {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const monthKey = date.toISOString().slice(0, 7);
              const monthRecords = attendanceRecords.filter(r =>
                r.date.startsWith(monthKey)
              );
              const monthPresent = monthRecords.filter(r => r.status === 'present').length;
              monthlyBreakdown[monthKey] =
                monthRecords.length > 0
                  ? Math.round((monthPresent / monthRecords.length) * 100)
                  : 0;
            }

            // Load homework/assignment data
            const submissions = await assignmentSubmissionService.getByStudent(child.id);
            const completedCount = submissions.filter(s => s.submitted).length;
            const totalCount = submissions.length;
            const homeworkPercentage =
              totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            // Load exam scores
            const scores = await examScoreService.getByStudent(child.id);
            const recentScores = scores.slice(0, 5); // Get 5 most recent

            // Calculate subject-wise averages
            const subjectWiseAverage: Record<string, { average: number; count: number }> = {};
            let totalScore = 0;
            for (const score of scores) {
              if (!subjectWiseAverage[score.subjectId]) {
                subjectWiseAverage[score.subjectId] = { average: 0, count: 0 };
              }
              subjectWiseAverage[score.subjectId].average += score.percentage;
              subjectWiseAverage[score.subjectId].count += 1;
              totalScore += score.percentage;
            }

            // Finalize subject averages
            Object.keys(subjectWiseAverage).forEach(subjectId => {
              const data = subjectWiseAverage[subjectId];
              data.average = Math.round(data.average / data.count);
            });

            const overallAverage =
              scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

            // Determine trend
            let trend: 'improving' | 'declining' | 'stable' = 'stable';
            if (scores.length > 1) {
              const recent5 = scores.slice(0, 5);
              const older5 = scores.slice(Math.max(0, scores.length - 10), Math.max(5, scores.length - 5));
              if (recent5.length > 0 && older5.length > 0) {
                const recentAvg = recent5.reduce((sum, s) => sum + s.percentage, 0) / recent5.length;
                const olderAvg = older5.reduce((sum, s) => sum + s.percentage, 0) / older5.length;
                if (recentAvg > olderAvg + 5) {
                  trend = 'improving';
                } else if (recentAvg < olderAvg - 5) {
                  trend = 'declining';
                }
              }
            }

            // Generate alerts
            const alerts = [];

            if (attendancePercentage < 75) {
              alerts.push({
                type: 'warning' as const,
                title: 'Low Attendance',
                message: `Attendance is ${attendancePercentage}%. Please ensure regular presence.`,
                date: new Date().toISOString(),
              });
            }

            if (homeworkPercentage < 70) {
              alerts.push({
                type: 'warning' as const,
                title: 'Low Homework Completion',
                message: `Only ${homeworkPercentage}% of homework is completed. Please encourage timely submission.`,
                date: new Date().toISOString(),
              });
            }

            if (recentScores.length > 0 && recentScores[0].percentage < 40) {
              alerts.push({
                type: 'warning' as const,
                title: 'Poor Academic Performance',
                message: `Recent exam score is ${recentScores[0].percentage}%. Please consider additional support.`,
                date: recentScores[0].createdAt,
              });
            } else if (recentScores.length > 0 && recentScores[0].percentage >= 80) {
              alerts.push({
                type: 'success' as const,
                title: 'Excellent Performance',
                message: `Great job! Recent exam score is ${recentScores[0].percentage}%.`,
                date: recentScores[0].createdAt,
              });
            }

            if (trend === 'improving' && scores.length > 5) {
              alerts.push({
                type: 'success' as const,
                title: 'Improving Trend',
                message: 'Academic performance is showing improvement. Great progress!',
                date: new Date().toISOString(),
              });
            } else if (trend === 'declining' && scores.length > 5) {
              alerts.push({
                type: 'warning' as const,
                title: 'Declining Trend',
                message: 'Academic performance is declining. Please take appropriate action.',
                date: new Date().toISOString(),
              });
            }

            progressData.push({
              studentId: child.id,
              studentName: child.name || 'Unknown',
              class: child.class || 'N/A',
              section: child.section || 'N/A',
              attendance: {
                presentCount,
                totalDays: monthlyRecords.length,
                percentage: attendancePercentage,
                monthlyBreakdown,
              },
              homework: {
                completedCount,
                totalCount,
                percentage: homeworkPercentage,
              },
              examScores: {
                recentScores,
                subjectWiseAverage,
                overallAverage,
                trend,
              },
              alerts: alerts.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              ),
            });
          } catch (error) {
            console.error(`Error loading progress for student ${child.id}:`, error);
          }
        }

        setChildrenProgress(progressData);
        // Prioritize targetChildId if provided
        if (targetChildId && progressData.some(p => p.studentId === targetChildId)) {
          setSelectedChildId(targetChildId);
        } else if (progressData.length > 0) {
          setSelectedChildId(progressData[0].studentId);
        }
      } catch (error) {
        console.error('Error loading children progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChildrenProgress();
  }, [user?.id, targetChildId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (childrenProgress.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No children found in your profile</p>
      </div>
    );
  }

  const selectedChild = childrenProgress.find(c => c.studentId === selectedChildId);

  return (
    <div className="w-full space-y-6">
      {/* Child Selector */}
      {childrenProgress.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex gap-2 flex-wrap">
            {childrenProgress.map(child => (
              <button
                key={child.studentId}
                onClick={() => setSelectedChildId(child.studentId)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedChildId === child.studentId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {child.studentName} ({child.class}-{child.section})
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedChild && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md p-6">
            <h2 className="text-3xl font-bold">{selectedChild.studentName}</h2>
            <p className="text-blue-100">
              Class {selectedChild.class} - Section {selectedChild.section}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attendance Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Attendance
                </h3>
                <span
                  className={`text-2xl font-bold ${
                    selectedChild.attendance.percentage >= 75 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {selectedChild.attendance.percentage}%
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {selectedChild.attendance.presentCount} / {selectedChild.attendance.totalDays} days
                present
              </p>
              {selectedChild.attendance.percentage >= 75 ? (
                <div className="flex items-center gap-1 text-green-600 text-sm mt-2">
                  <CheckCircle className="w-4 h-4" />
                  Good attendance
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" />
                  Below target
                </div>
              )}
            </div>

            {/* Homework Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Homework
                </h3>
                <span
                  className={`text-2xl font-bold ${
                    selectedChild.homework.percentage >= 70 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {selectedChild.homework.percentage}%
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {selectedChild.homework.completedCount} / {selectedChild.homework.totalCount}{' '}
                completed
              </p>
              {selectedChild.homework.percentage >= 70 ? (
                <div className="flex items-center gap-1 text-green-600 text-sm mt-2">
                  <CheckCircle className="w-4 h-4" />
                  On track
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" />
                  Needs attention
                </div>
              )}
            </div>

            {/* Overall Exam Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Exam Average
                </h3>
                <span className="text-2xl font-bold text-blue-600">
                  {selectedChild.examScores.overallAverage}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {selectedChild.examScores.trend === 'improving' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Improving</span>
                  </>
                )}
                {selectedChild.examScores.trend === 'declining' && (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Declining</span>
                  </>
                )}
                {selectedChild.examScores.trend === 'stable' && (
                  <span className="text-gray-600">Stable</span>
                )}
              </div>
            </div>
          </div>

          {/* Exam Scores by Subject */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Subject-wise Performance</h3>
            <div className="space-y-3">
              {Object.entries(selectedChild.examScores.subjectWiseAverage).map(
                ([subjectId, data]) => (
                  <div key={subjectId}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{subjectId}</span>
                      <span className="text-sm font-bold text-gray-800">{data.average}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          data.average >= 80
                            ? 'bg-green-600'
                            : data.average >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-600'
                        }`}
                        style={{ width: `${data.average}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Recent Exam Scores */}
          {selectedChild.examScores.recentScores.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Exam Results</h3>
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-sm font-semibold text-gray-700 pb-2">
                        Exam Type
                      </th>
                      <th className="text-left text-sm font-semibold text-gray-700 pb-2">
                        Subject
                      </th>
                      <th className="text-left text-sm font-semibold text-gray-700 pb-2">
                        Marks
                      </th>
                      <th className="text-left text-sm font-semibold text-gray-700 pb-2">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChild.examScores.recentScores.map((score, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">{score.examType}</td>
                        <td className="py-3 text-sm text-gray-900">{score.subjectId}</td>
                        <td className="py-3 text-sm font-medium text-gray-900">
                          {score.marksObtained}/{score.totalMarks} ({score.percentage}%)
                        </td>
                        <td className="py-3 text-sm font-bold">
                          <span
                            className={`px-2 py-1 rounded ${
                              score.grade === 'A+' || score.grade === 'A'
                                ? 'bg-green-100 text-green-800'
                                : score.grade === 'B+' || score.grade === 'B'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {score.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alerts & Notifications */}
          {selectedChild.alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Alerts & Notifications</h3>
              <div className="space-y-3">
                {selectedChild.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'warning'
                        ? 'bg-red-50 border-red-400'
                        : alert.type === 'success'
                          ? 'bg-green-50 border-green-400'
                          : 'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {alert.type === 'warning' && (
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        {alert.type === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p
                            className={`font-semibold ${
                              alert.type === 'warning'
                                ? 'text-red-800'
                                : alert.type === 'success'
                                  ? 'text-green-800'
                                  : 'text-blue-800'
                            }`}
                          >
                            {alert.title}
                          </p>
                          <p
                            className={`text-sm mt-1 ${
                              alert.type === 'warning'
                                ? 'text-red-700'
                                : alert.type === 'success'
                                  ? 'text-green-700'
                                  : 'text-blue-700'
                            }`}
                          >
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

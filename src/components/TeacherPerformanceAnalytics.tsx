import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  ArrowLeft,
  User,
  BookOpen,
  Trophy,
  Zap
} from 'lucide-react';
import { quizService, studentService } from '../utils/centralDataService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface TeacherPerformanceAnalyticsProps {
  teacherEmail: string;
  selectedClass?: { 
    class: string; 
    section: string; 
    subject?: string; 
  };
}

export function TeacherPerformanceAnalytics({ teacherEmail, selectedClass: initialClass }: TeacherPerformanceAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'class' | 'students' | 'leaderboard'>('class');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(initialClass);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  useEffect(() => {
    const classes = quizService.getTeacherClasses(teacherEmail);
    setMyClasses(classes);
    if (!selectedClass && classes.length > 0) {
      setSelectedClass(classes[0]);
    }
  }, [teacherEmail]);

  useEffect(() => {
    if (selectedClass) {
      const data = quizService.getClassPerformance(selectedClass.class, selectedClass.section, selectedClass.subject);
      setPerformanceData(data);
      
      const classQuizzes = quizService.getQuizzesByClass(selectedClass.class, selectedClass.section)
        .filter(q => q.subject === selectedClass.subject);
      setQuizzes(classQuizzes);
    }
    setLeaderboard(quizService.getTeacherLeaderboard());
  }, [selectedClass]);

  const stats = {
    averageScore: performanceData.length > 0 
      ? Math.round(performanceData.reduce((sum, s) => sum + s.averageScore, 0) / performanceData.length)
      : 0,
    completionRate: performanceData.length > 0 && quizzes.length > 0
      ? Math.round((performanceData.reduce((sum, s) => sum + s.completedQuizzes, 0) / (performanceData.length * quizzes.length)) * 100)
      : 0,
    topPerformers: [...performanceData].sort((a, b) => b.averageScore - a.averageScore).slice(0, 3),
    lowPerformers: [...performanceData].sort((a, b) => a.averageScore - b.averageScore).slice(0, 3),
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

  if (selectedStudentId) {
    const student = performanceData.find(s => s.studentId === selectedStudentId);
    if (!student) return null;

    const progressData = student.results.map((r: any, index: number) => ({
      name: `Quiz ${index + 1}`,
      score: Math.round((r.score / r.total) * 100)
    }));

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedStudentId(null)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 text-center sm:text-left">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl font-bold flex-shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-sm text-gray-500 font-medium">Roll No: {student.rollNo}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">{selectedClass?.class}-{selectedClass?.section} | {selectedClass?.subject}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-purple-600 text-xs font-bold uppercase mb-1">Avg Score</p>
              <h3 className="text-2xl font-bold text-purple-900">{student.averageScore}%</h3>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-600 text-xs font-bold uppercase mb-1">Completed</p>
              <h3 className="text-2xl font-bold text-green-900">{student.completedQuizzes} / {student.totalQuizzes}</h3>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-blue-600 text-xs font-bold uppercase mb-1">Latest</p>
              <h3 className="text-2xl font-bold text-blue-900">
                {student.results.length > 0 
                  ? `${Math.round((student.results[student.results.length - 1].score / student.results[student.results.length - 1].total) * 100)}%` 
                  : 'N/A'
                }
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Progress Over Time</h3>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Progress Over Time</h3>
              <div className="w-full overflow-hidden flex justify-center">
                <LineChart 
                  width={320} 
                  height={200} 
                  data={progressData} 
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  key={`student-chart-${student.studentId}`}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Topic-wise Performance</h3>
              <div className="space-y-3">
                {student.results.map((r: any, i: number) => {
                  const quiz = quizzes.find(q => q.id === r.quizId);
                  const percentage = Math.round((r.score / r.total) * 100);
                  return (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          percentage >= 80 ? 'bg-green-100 text-green-600' : 
                          percentage >= 60 ? 'bg-yellow-100 text-yellow-600' : 
                          'bg-red-100 text-red-600'
                        }`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{quiz?.topic || 'Unknown Quiz'}</p>
                          <p className="text-xs text-gray-500">{new Date(r.completedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{percentage}%</p>
                        <p className="text-xs text-gray-500">{r.score}/{r.total} marks</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Selector & Tabs */}
      <div className="flex flex-col gap-5">
        <div className="bg-gray-100 p-1.5 rounded-2xl">
          <div className="flex bg-gray-100/50 rounded-xl overflow-x-auto no-scrollbar">
            <div className="flex w-full gap-1 p-0.5">
              {[
                { id: 'class', label: 'Analytics' },
                { id: 'students', label: 'Tracking' },
                { id: 'leaderboard', label: 'Rankings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-white text-purple-600 shadow-lg shadow-purple-100 transform scale-[1.02]' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {myClasses.length > 0 && (
          <div className="relative z-[60] mt-2">
            <button
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="w-full bg-white px-6 py-5 rounded-[2rem] border-2 border-gray-100 shadow-xl shadow-purple-50/50 transition-all hover:border-purple-200 focus:border-purple-500 text-left group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-100/40 transition-colors" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-white rounded-2xl flex items-center justify-center text-purple-600 group-hover:from-purple-100 transition-all shadow-inner border border-purple-100/50 flex-shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Live Session Manager</p>
                  </div>
                  <p className="text-lg font-black text-gray-900 truncate tracking-tight">
                    {selectedClass ? `${selectedClass.class}-${selectedClass.section} • ${selectedClass.subject}` : 'Select Class'}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isClassDropdownOpen ? 'bg-purple-600 text-white rotate-90' : 'bg-gray-50 text-gray-400'}`}>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>

            {isClassDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="max-h-60 overflow-y-auto p-2 no-scrollbar">
                  {myClasses.map((cls, idx) => {
                    const isSelected = selectedClass?.class === cls.class && selectedClass?.section === cls.section && selectedClass?.subject === cls.subject;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                          isSelected 
                            ? 'bg-purple-600 text-white' 
                            : 'hover:bg-purple-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>{cls.class}-{cls.section}</p>
                          <p className={`text-[10px] font-bold ${isSelected ? 'text-purple-100' : 'text-gray-400'} uppercase`}>{cls.subject}</p>
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 ml-auto text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'class' && (
        <div className="space-y-6">
          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" /> +5%
                </span>
              </div>
              <p className="text-gray-500 text-sm">Class Average</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.averageScore}%</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  Target: 85%
                </span>
              </div>
              <p className="text-gray-500 text-sm">Completion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.completionRate}%</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-500 text-sm">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900">{performanceData.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-gray-500 text-sm">Quizzes Assigned</p>
              <h3 className="text-2xl font-bold text-gray-900">{quizzes.length}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Class score distribution</h3>
              <div className="w-full overflow-hidden flex flex-col items-center">
                {performanceData.length > 0 ? (
                  <>
                    <BarChart 
                      width={320}
                      height={200}
                      data={[
                        { range: '0-20', count: performanceData.filter(s => s.averageScore < 20).length },
                        { range: '21-40', count: performanceData.filter(s => s.averageScore >= 20 && s.averageScore < 40).length },
                        { range: '41-60', count: performanceData.filter(s => s.averageScore >= 40 && s.averageScore < 60).length },
                        { range: '61-80', count: performanceData.filter(s => s.averageScore >= 60 && s.averageScore < 80).length },
                        { range: '81-100', count: performanceData.filter(s => s.averageScore >= 80).length },
                      ]}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      key={`distribution-${selectedClass?.class}-${selectedClass?.section}-${selectedClass?.subject}`}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={25} />
                    </BarChart>
                    <div className="mt-8 grid grid-cols-3 gap-2 text-[10px] sm:text-xs text-center text-gray-500">
                      <div className="bg-gray-50 p-1 rounded">Low: {performanceData.filter(s => s.averageScore < 40).length}</div>
                      <div className="bg-gray-50 p-1 rounded">Mid: {performanceData.filter(s => s.averageScore >= 40 && s.averageScore < 70).length}</div>
                      <div className="bg-gray-50 p-1 rounded">High: {performanceData.filter(s => s.averageScore >= 70).length}</div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No data available for distribution
                  </div>
                )}
              </div>
            </div>

            {/* Performance Ranking */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Top & low performers</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3">Top Performers</p>
                  <div className="space-y-2">
                    {stats.topPerformers.map((student, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-green-200 text-green-700 text-xs font-bold rounded-full flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                        <span className="font-bold text-green-700">{student.averageScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">Needs Attention</p>
                  <div className="space-y-2">
                    {stats.lowPerformers.map((student, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-red-200 text-red-700 text-xs font-bold rounded-full flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                        <span className="font-bold text-red-700">{student.averageScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Roll No</th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase text-center">Quizzes</th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase text-center">Avg. Score</th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {performanceData.map((student) => {
                  const isPending = student.completedQuizzes < student.totalQuizzes;
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[120px]">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-sm">{student.rollNo}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <span className="font-bold text-gray-900">{student.completedQuizzes}</span>
                          <span className="text-gray-400">/ {student.totalQuizzes}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold text-sm ${
                            student.averageScore >= 80 ? 'text-green-600' : 
                            student.averageScore >= 60 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {student.averageScore}%
                          </span>
                          <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                student.averageScore >= 80 ? 'bg-green-500' : 
                                student.averageScore >= 60 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}
                              style={{ width: `${student.averageScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-700">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> Done
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedStudentId(student.studentId)}
                          className="text-purple-600 hover:text-purple-700 font-bold text-xs"
                        >
                          Insights
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Stats Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
              <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">My Performance</h4>
                  <p className="text-purple-100 text-sm">March 2024</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                  <p className="text-purple-100 text-xs mb-1">Student Outcomes</p>
                  <p className="text-2xl font-bold">92%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                  <p className="text-purple-100 text-xs mb-1">Engagement</p>
                  <p className="text-2xl font-bold">95%</p>
                </div>
              </div>
              
              <button className="w-full mt-6 py-3 bg-white text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition-colors">
                View Detailed Report
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Milestones</h3>
              <div className="space-y-4">
                {[
                  { label: 'Perfect Attendance Week', date: 'Mar 12', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
                  { label: 'Top Subject: Math', date: 'Mar 15', icon: <Award className="w-5 h-5 text-purple-500" /> },
                  { label: 'High Quiz Engagement', date: 'Mar 18', icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {m.icon}
                      <span className="text-sm font-medium text-gray-700">{m.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{m.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Teacher Leaderboard */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Top Performing Teachers</h3>
              <select className="bg-gray-50 border-none rounded-lg text-sm font-medium text-purple-600 focus:ring-0">
                <option>This Month</option>
                <option>Last Month</option>
                <option>All Time</option>
              </select>
            </div>
            <div className="divide-y divide-gray-50">
              {leaderboard.map((teacher, i) => (
                <div key={teacher.id} className={`flex items-center justify-between p-6 transition-colors ${teacher.name === 'John Teacher' ? 'bg-purple-50/50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? 'bg-yellow-400 text-white' : 
                      i === 1 ? 'bg-gray-300 text-white' : 
                      i === 2 ? 'bg-orange-300 text-white' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-500 font-bold">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        {teacher.name}
                        {teacher.name === 'John Teacher' && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase">You</span>}
                      </h4>
                      <p className="text-gray-500 text-sm">{teacher.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12 text-right">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Outcomes</p>
                      <p className="font-bold text-gray-900">{teacher.score}%</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400 mb-1">Engagement</p>
                      <p className="font-bold text-gray-900">{teacher.engagement}%</p>
                    </div>
                    <div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  BarChart2,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { studentService, attendanceService } from '../utils/centralDataService';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameDay,
  subDays,
  addDays,
  isToday,
  parseISO
} from 'date-fns';

interface AttendanceOverviewProps {
  classInfo: {
    class: string;
    section: string;
    subject: string;
  };
  onMarkAttendance: (date?: string) => void;
  onBack: () => void;
}

export function AttendanceOverview({ classInfo, onMarkAttendance, onBack }: AttendanceOverviewProps) {
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load students
      const classStudents = await studentService.getByClass(classInfo.class, classInfo.section);
      setStudents(classStudents);

      // Load attendance records based on view type
      let startDate = selectedDate;
      let endDate = selectedDate;

      if (viewType === 'weekly') {
        const start = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
        const end = endOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
        startDate = format(start, 'yyyy-MM-dd');
        endDate = format(end, 'yyyy-MM-dd');
      } else if (viewType === 'monthly') {
        const start = startOfMonth(parseISO(selectedDate));
        const end = endOfMonth(parseISO(selectedDate));
        startDate = format(start, 'yyyy-MM-dd');
        endDate = format(end, 'yyyy-MM-dd');
      }

      const records = await (attendanceService as any).getByClassRange(
        classInfo.class, 
        classInfo.section, 
        startDate, 
        endDate
      );
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, viewType, classInfo.class, classInfo.section]);

  const getDayStatus = (studentId: string, date: string) => {
    return attendanceRecords.find(r => r.studentId === studentId && r.date === date)?.status;
  };

  const getStudentStats = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === studentId);
    const total = studentRecords.length;
    const present = studentRecords.filter(r => r.status === 'present').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;
    const late = studentRecords.filter(r => r.status === 'late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, percentage };
  };

  const renderDailyView = () => {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50 border-b border-purple-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => {
                const status = getDayStatus(student.id, selectedDate);
                const record = attendanceRecords.find(r => r.studentId === student.id && r.date === selectedDate);
                return (
                  <tr key={student.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.rollNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {status ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'present' ? 'bg-green-100 text-green-800' :
                          status === 'absent' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Not Marked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {record?.remarks || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const start = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
    const end = endOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50 border-b border-purple-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase sticky left-0 bg-purple-50">Student</th>
                {days.map(day => (
                  <th key={day.toISOString()} className={`px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase min-w-[80px] ${isToday(day) ? 'bg-purple-100' : ''}`}>
                    {format(day, 'EEE')}<br/>{format(day, 'dd')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-purple-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="max-w-[120px] truncate">{student.name}</div>
                  </td>
                  {days.map(day => {
                    const status = getDayStatus(student.id, format(day, 'yyyy-MM-dd'));
                    return (
                      <td key={day.toISOString()} className={`px-2 py-4 whitespace-nowrap text-center ${isToday(day) ? 'bg-purple-50/30' : ''}`}>
                        {status === 'present' ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> :
                         status === 'absent' ? <XCircle className="w-5 h-5 text-red-500 mx-auto" /> :
                         status === 'late' ? <AlertCircle className="w-5 h-5 text-orange-500 mx-auto" /> :
                         <div className="w-2 h-2 rounded-full bg-gray-200 mx-auto" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50 border-b border-purple-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Present</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Absent</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Late</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => {
                const stats = getStudentStats(student.id);
                return (
                  <tr key={student.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.rollNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">{stats.present}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-semibold">{stats.absent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-orange-600 font-semibold">{stats.late}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 hidden md:block">
                          <div 
                            className={`h-1.5 rounded-full ${stats.percentage > 75 ? 'bg-green-500' : stats.percentage > 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-bold ${stats.percentage > 75 ? 'text-green-600' : stats.percentage > 40 ? 'text-orange-600' : 'text-red-600'}`}>
                          {stats.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const totalPresent = attendanceRecords.filter(r => r.date === selectedDate && r.status === 'present').length;
  const avgAttendance = students.length > 0 ? Math.round((totalPresent / students.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Attendance Overview</h1>
                <p className="text-purple-200">
                  Class {classInfo.class}-{classInfo.section} | {classInfo.subject}
                </p>
              </div>
            </div>
            <button
              onClick={() => onMarkAttendance(isToday(parseISO(selectedDate)) ? undefined : selectedDate)}
              className="px-6 py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-purple-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {isToday(parseISO(selectedDate)) ? "Mark Today's Attendance" : "Mark Attendance for this Date"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">View Period</label>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`flex-1 py-2 px-6 rounded-lg text-sm font-medium transition-all ${
                    viewType === type 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-500 hover:text-purple-600'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), viewType === 'weekly' ? 7 : viewType === 'monthly' ? 30 : 1), 'yyyy-MM-dd'))}
                className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none min-w-[160px]"
                />
              </div>
              <button 
                onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), viewType === 'weekly' ? 7 : viewType === 'monthly' ? 30 : 1), 'yyyy-MM-dd'))}
                className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1"></div>
          
          <div className="text-right hidden lg:block">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Selected Filter</div>
            <div className="text-lg font-bold text-purple-900">
              {viewType === 'daily' ? format(parseISO(selectedDate), 'MMMM dd, yyyy') :
               viewType === 'weekly' ? `Week of ${format(startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), 'MMM dd')} - ${format(endOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), 'MMM dd')}` :
               format(parseISO(selectedDate), 'MMMM yyyy')}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-600">{avgAttendance}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present Today</p>
              <p className="text-2xl font-bold text-purple-600">{attendanceRecords.filter(r => r.date === selectedDate && r.status === 'present').length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Absents</p>
              <p className="text-2xl font-bold text-red-600">{attendanceRecords.filter(r => r.date === selectedDate && r.status === 'absent').length}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-gray-500 font-medium italic">Synchronizing attendance records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-20 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No Students Found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">No students are currently enrolled in this class-section.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-600" />
                Attendance List
              </h2>
              <span className="text-sm text-gray-500">{students.length} students enrolled</span>
            </div>
            
            {viewType === 'daily' && renderDailyView()}
            {viewType === 'weekly' && renderWeeklyView()}
            {viewType === 'monthly' && renderMonthlyView()}
          </>
        )}
      </div>
    </div>
  );
}

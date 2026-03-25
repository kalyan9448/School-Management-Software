import { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, XCircle, AlertCircle, Calendar, Users, Filter, Loader2 } from 'lucide-react';
import { studentService, attendanceService } from '../utils/centralDataService';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  admissionNo: string;
  attendance: 'present' | 'absent' | 'late' | null;
}

interface AttendanceMarkingProps {
  classInfo: {
    class: string;
    section: string;
    subject: string;
    students: number;
  };
  onBack: () => void;
}

export function AttendanceMarking({ classInfo, onBack }: AttendanceMarkingProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'late' | 'unmarked'>('all');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [students, setStudents] = useState<Student[]>([]);

  // Load real students for this class/section, and pre-fill any existing attendance for the selected date
  const loadStudentsForDate = async (date: string) => {
    setLoading(true);
    try {
      // 1. Load students for this class/section from Firestore
      let sourceStudents = await studentService.getByClass(classInfo.class, classInfo.section);

      // Fallback: if no students found by class filter, load all and filter
      if (sourceStudents.length === 0) {
        const allStudents = await studentService.getAll();
        sourceStudents = allStudents.filter(
          (s: any) =>
            s.class?.toString().trim() === classInfo.class.trim() &&
            s.section?.toString().trim() === classInfo.section.trim()
        );
      }

      // 2. Load existing attendance records for this date + class/section from Firestore
      const todayRecords = await attendanceService.getByClass(classInfo.class, classInfo.section, date);

      // 3. Map to component's Student interface with pre-filled attendance
      const mapped: Student[] = sourceStudents.map((s: any, idx: number) => {
        const existing = todayRecords.find(
          (r: any) => r.studentId === s.id || r.admissionNo === s.admissionNo
        );
        return {
          id: s.id || `student-${idx}`,
          name: s.name,
          rollNo: s.rollNo || String(idx + 1).padStart(2, '0'),
          admissionNo: s.admissionNo || '-',
          attendance: existing?.status || null,
        };
      });

      setStudents(mapped);
    } catch (e) {
      console.error('AttendanceMarking: Failed to load students', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, classInfo.class, classInfo.section]);

  const markAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(students.map(student =>
      student.id === studentId ? { ...student, attendance: status } : student
    ));
    setSaveStatus('idle');
  };

  const markAllPresent = () => {
    setStudents(students.map(student => ({ ...student, attendance: 'present' })));
    setSaveStatus('idle');
  };

  const markAllAbsent = () => {
    setStudents(students.map(student => ({ ...student, attendance: 'absent' })));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    const unmarked = students.filter(s => s.attendance === null);
    if (unmarked.length > 0) {
      if (!confirm(`${unmarked.length} students are unmarked. Do you want to save anyway?`)) {
        return;
      }
    }

    setSaveStatus('saving');

    try {
      // Build new records for marked students
      const newRecords = students
        .filter(s => s.attendance !== null)
        .map(s => ({
          id: `${selectedDate}-${classInfo.class}-${classInfo.section}-${s.id}`,
          date: selectedDate,
          class: classInfo.class,
          section: classInfo.section,
          subject: classInfo.subject,
          studentId: s.id,
          studentName: s.name,
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          status: s.attendance,
          markedAt: new Date().toISOString(),
        }));

      // Save to Firestore
      await attendanceService.markAttendance(newRecords);

      setSaveStatus('saved');
      setTimeout(() => {
        onBack();
      }, 800);
    } catch (e) {
      console.error('AttendanceMarking: Failed to save', e);
      alert('Failed to save attendance. Please try again.');
      setSaveStatus('idle');
    }
  };

  const getStats = () => {
    const present = students.filter(s => s.attendance === 'present').length;
    const absent = students.filter(s => s.attendance === 'absent').length;
    const late = students.filter(s => s.attendance === 'late').length;
    const unmarked = students.filter(s => s.attendance === null).length;
    return { present, absent, late, unmarked };
  };

  const stats = getStats();

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.rollNo.includes(searchQuery) ||
                         student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'unmarked' && student.attendance === null) ||
                         student.attendance === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-white mb-1">Mark Attendance</h1>
              <p className="text-purple-200">
                Class {classInfo.class}-{classInfo.section} | {classInfo.subject}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Date and Quick Actions */}
        <div className="bg-white rounded-xl shadow-md border border-purple-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">
                {students.length > 0 ? `${students.length} students loaded` : 'No students found for this class'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                disabled={loading || students.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Mark All Present
              </button>
              <button
                onClick={markAllAbsent}
                disabled={loading || students.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Mark All Absent
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <p className="text-gray-600">Total</p>
            </div>
            <p className="text-gray-900 font-bold text-xl">{students.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-gray-600">Present</p>
            </div>
            <p className="text-green-600 font-bold text-xl">{stats.present}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className="text-gray-600">Absent</p>
            </div>
            <p className="text-red-600 font-bold text-xl">{stats.absent}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-orange-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-gray-600">Late</p>
            </div>
            <p className="text-orange-600 font-bold text-xl">{stats.late}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <p className="text-gray-600">Unmarked</p>
            </div>
            <p className="text-gray-600 font-bold text-xl">{stats.unmarked}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, roll no, or admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Students</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="unmarked">Unmarked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-purple-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-medium">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-12 h-12 mb-3" />
              <p className="font-semibold text-lg">No students found</p>
              <p className="text-sm">No students enrolled in Class {classInfo.class}-{classInfo.section}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50 border-b border-purple-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-700">Roll No</th>
                    <th className="px-6 py-3 text-left text-gray-700">Student Name</th>
                    <th className="px-6 py-3 text-left text-gray-700">Admission No</th>
                    <th className="px-6 py-3 text-center text-gray-700">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">{student.rollNo}</td>
                      <td className="px-6 py-4 text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-gray-600">{student.admissionNo}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => markAttendance(student.id, 'present')}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              student.attendance === 'present'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Present
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, 'absent')}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              student.attendance === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            Absent
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, 'late')}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              student.attendance === 'late'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4" />
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={students.length === 0 || saveStatus === 'saving'}
            className={`px-6 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2 ${
              saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-50'
            }`}
          >
            {saveStatus === 'saving' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : saveStatus === 'saved' ? (
              <><CheckCircle className="w-5 h-5" /> Saved!</>
            ) : (
              <><Save className="w-5 h-5" /> Save Attendance</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



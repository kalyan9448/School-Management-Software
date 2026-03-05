import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle, XCircle, AlertCircle, Calendar, Users, Filter } from 'lucide-react';

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
  
  // Sample students data
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Aarav Sharma', rollNo: '01', admissionNo: 'ADM20240001', attendance: null },
    { id: '2', name: 'Diya Patel', rollNo: '02', admissionNo: 'ADM20240002', attendance: null },
    { id: '3', name: 'Arjun Kumar', rollNo: '03', admissionNo: 'ADM20240003', attendance: null },
    { id: '4', name: 'Ananya Reddy', rollNo: '04', admissionNo: 'ADM20240004', attendance: null },
    { id: '5', name: 'Vihaan Singh', rollNo: '05', admissionNo: 'ADM20240005', attendance: null },
    { id: '6', name: 'Isha Gupta', rollNo: '06', admissionNo: 'ADM20240006', attendance: null },
    { id: '7', name: 'Reyansh Verma', rollNo: '07', admissionNo: 'ADM20240007', attendance: null },
    { id: '8', name: 'Saanvi Joshi', rollNo: '08', admissionNo: 'ADM20240008', attendance: null },
    { id: '9', name: 'Aditya Mehta', rollNo: '09', admissionNo: 'ADM20240009', attendance: null },
    { id: '10', name: 'Kiara Desai', rollNo: '10', admissionNo: 'ADM20240010', attendance: null },
  ]);

  const markAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(students.map(student => 
      student.id === studentId ? { ...student, attendance: status } : student
    ));
  };

  const markAllPresent = () => {
    setStudents(students.map(student => ({ ...student, attendance: 'present' })));
  };

  const markAllAbsent = () => {
    setStudents(students.map(student => ({ ...student, attendance: 'absent' })));
  };

  const handleSave = () => {
    const unmarked = students.filter(s => s.attendance === null);
    if (unmarked.length > 0) {
      if (!confirm(`${unmarked.length} students are unmarked. Do you want to save anyway?`)) {
        return;
      }
    }
    
    alert('Attendance saved successfully!');
    onBack();
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
            </div>
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark All Present
              </button>
              <button
                onClick={markAllAbsent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
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
            <p className="text-gray-900">{students.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-gray-600">Present</p>
            </div>
            <p className="text-green-600">{stats.present}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className="text-gray-600">Absent</p>
            </div>
            <p className="text-red-600">{stats.absent}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-orange-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-gray-600">Late</p>
            </div>
            <p className="text-orange-600">{stats.late}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <p className="text-gray-600">Unmarked</p>
            </div>
            <p className="text-gray-600">{stats.unmarked}</p>
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
                    <td className="px-6 py-4 text-gray-900">{student.rollNo}</td>
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
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

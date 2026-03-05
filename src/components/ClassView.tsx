import { useState } from 'react';
import { ArrowLeft, Users, Calendar, TrendingUp, Mail, Phone, Download, Search, Filter } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  admissionNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  attendance: number;
  lastAttendance: string;
}

interface ClassViewProps {
  classInfo: {
    class: string;
    section: string;
    subject: string;
    students: number;
  };
  onBack: () => void;
}

export function ClassView({ classInfo, onBack }: ClassViewProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'performance'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample students data
  const students: Student[] = [
    {
      id: '1',
      name: 'Aarav Sharma',
      rollNo: '01',
      admissionNo: 'ADM20240001',
      parentName: 'Rajesh Sharma',
      parentPhone: '+91 98765 43210',
      parentEmail: 'rajesh.sharma@email.com',
      attendance: 95,
      lastAttendance: '2024-11-28',
    },
    {
      id: '2',
      name: 'Diya Patel',
      rollNo: '02',
      admissionNo: 'ADM20240002',
      parentName: 'Amit Patel',
      parentPhone: '+91 98765 43211',
      parentEmail: 'amit.patel@email.com',
      attendance: 92,
      lastAttendance: '2024-11-28',
    },
    {
      id: '3',
      name: 'Arjun Kumar',
      rollNo: '03',
      admissionNo: 'ADM20240003',
      parentName: 'Suresh Kumar',
      parentPhone: '+91 98765 43212',
      parentEmail: 'suresh.kumar@email.com',
      attendance: 88,
      lastAttendance: '2024-11-28',
    },
    {
      id: '4',
      name: 'Ananya Reddy',
      rollNo: '04',
      admissionNo: 'ADM20240004',
      parentName: 'Ramesh Reddy',
      parentPhone: '+91 98765 43213',
      parentEmail: 'ramesh.reddy@email.com',
      attendance: 97,
      lastAttendance: '2024-11-28',
    },
    {
      id: '5',
      name: 'Vihaan Singh',
      rollNo: '05',
      admissionNo: 'ADM20240005',
      parentName: 'Vijay Singh',
      parentPhone: '+91 98765 43214',
      parentEmail: 'vijay.singh@email.com',
      attendance: 90,
      lastAttendance: '2024-11-28',
    },
    {
      id: '6',
      name: 'Isha Gupta',
      rollNo: '06',
      admissionNo: 'ADM20240006',
      parentName: 'Ravi Gupta',
      parentPhone: '+91 98765 43215',
      parentEmail: 'ravi.gupta@email.com',
      attendance: 94,
      lastAttendance: '2024-11-28',
    },
    {
      id: '7',
      name: 'Reyansh Verma',
      rollNo: '07',
      admissionNo: 'ADM20240007',
      parentName: 'Anil Verma',
      parentPhone: '+91 98765 43216',
      parentEmail: 'anil.verma@email.com',
      attendance: 86,
      lastAttendance: '2024-11-27',
    },
    {
      id: '8',
      name: 'Saanvi Joshi',
      rollNo: '08',
      admissionNo: 'ADM20240008',
      parentName: 'Prakash Joshi',
      parentPhone: '+91 98765 43217',
      parentEmail: 'prakash.joshi@email.com',
      attendance: 93,
      lastAttendance: '2024-11-28',
    },
    {
      id: '9',
      name: 'Aditya Mehta',
      rollNo: '09',
      admissionNo: 'ADM20240009',
      parentName: 'Kiran Mehta',
      parentPhone: '+91 98765 43218',
      parentEmail: 'kiran.mehta@email.com',
      attendance: 89,
      lastAttendance: '2024-11-28',
    },
    {
      id: '10',
      name: 'Kiara Desai',
      rollNo: '10',
      admissionNo: 'ADM20240010',
      parentName: 'Manish Desai',
      parentPhone: '+91 98765 43219',
      parentEmail: 'manish.desai@email.com',
      attendance: 96,
      lastAttendance: '2024-11-28',
    },
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNo.includes(searchQuery) ||
    student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const averageAttendance = students.reduce((sum, s) => sum + s.attendance, 0) / students.length;

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
              <h1 className="text-white mb-1">Class Details</h1>
              <p className="text-purple-200">
                Class {classInfo.class}-{classInfo.section} | {classInfo.subject}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Students</p>
                <p className="text-gray-900">{students.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Avg Attendance</p>
                <p className="text-gray-900">{averageAttendance.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Present Today</p>
                <p className="text-gray-900">{students.filter(s => s.lastAttendance === '2024-11-28').length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Low Attendance</p>
                <p className="text-gray-900">{students.filter(s => s.attendance < 90).length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 px-6 py-4 transition-colors ${
                  activeTab === 'students'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Students List</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex-1 px-6 py-4 transition-colors ${
                  activeTab === 'attendance'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Attendance Report</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`flex-1 px-6 py-4 transition-colors ${
                  activeTab === 'performance'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Performance</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'students' && (
              <div>
                {/* Search Bar */}
                <div className="mb-6 flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-50 border-b border-purple-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-700">Roll No</th>
                        <th className="px-4 py-3 text-left text-gray-700">Student Name</th>
                        <th className="px-4 py-3 text-left text-gray-700">Admission No</th>
                        <th className="px-4 py-3 text-left text-gray-700">Parent Name</th>
                        <th className="px-4 py-3 text-left text-gray-700">Contact</th>
                        <th className="px-4 py-3 text-center text-gray-700">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-4 py-4 text-gray-900">{student.rollNo}</td>
                          <td className="px-4 py-4 text-gray-900">{student.name}</td>
                          <td className="px-4 py-4 text-gray-600">{student.admissionNo}</td>
                          <td className="px-4 py-4 text-gray-600">{student.parentName}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span className="text-xs">{student.parentPhone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span className="text-xs">{student.parentEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                              student.attendance >= 95 ? 'bg-green-100 text-green-700' :
                              student.attendance >= 85 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.attendance}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-900 mb-2">Attendance Report</h3>
                <p className="text-gray-600 mb-6">View detailed attendance records and patterns</p>
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Generate Report
                </button>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-900 mb-2">Performance Analytics</h3>
                <p className="text-gray-600 mb-6">Track student progress and performance metrics</p>
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  View Analytics
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

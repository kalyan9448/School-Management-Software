import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Eye, CheckCircle, Clock, XCircle, UserPlus, Calendar, Phone, Mail, Grid3x3, List } from 'lucide-react';
import { AdmissionForm } from './AdmissionForm';
import { admissionAPI } from '../utils/api';

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  parentName: string;
  phone: string;
  email: string;
  classApplied: string;
  classAllotted: string;
  status: 'enquiry' | 'in-process' | 'confirmed' | 'admitted';
  appliedDate: string;
}

export function AdmissionModule() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [usingLocalData, setUsingLocalData] = useState(false);

  // Load admissions from backend
  useEffect(() => {
    if (view === 'list') {
      loadAdmissions();
    }
  }, [view]);

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      setServerError(null);
      setUsingLocalData(false);
      
      const response = await admissionAPI.getAll();
      console.log('Admissions loaded:', response);
      setStudents(response.admissions || []);
    } catch (error: any) {
      console.error('Failed to load admissions:', error);
      
      // Always use demo data when backend is not available
      setServerError('⚠️ Backend server is not responding. Using local demo mode.');
      setUsingLocalData(true);
      
      // Load demo data
      const demoAdmissions: Student[] = [
        {
          id: '1',
          admissionNo: 'ADM2024001',
          name: 'Aarav Sharma',
          dob: '2019-05-15',
          gender: 'Male',
          bloodGroup: 'A+',
          parentName: 'Mr. Rajesh Sharma',
          phone: '+91 98765 43210',
          email: 'rajesh.sharma@email.com',
          classApplied: 'Nursery',
          classAllotted: 'Nursery',
          status: 'admitted',
          appliedDate: '2024-01-10',
        },
        {
          id: '2',
          admissionNo: 'ADM2024002',
          name: 'Diya Patel',
          dob: '2018-08-22',
          gender: 'Female',
          bloodGroup: 'B+',
          parentName: 'Mrs. Priya Patel',
          phone: '+91 98765 43211',
          email: 'priya.patel@email.com',
          classApplied: 'LKG',
          classAllotted: 'LKG',
          status: 'admitted',
          appliedDate: '2024-01-12',
        },
        {
          id: '3',
          admissionNo: 'ADM2024003',
          name: 'Arjun Kumar',
          dob: '2020-03-10',
          gender: 'Male',
          bloodGroup: 'O+',
          parentName: 'Mr. Suresh Kumar',
          phone: '+91 98765 43212',
          email: 'suresh.kumar@email.com',
          classApplied: 'Nursery',
          classAllotted: '',
          status: 'confirmed',
          appliedDate: '2024-02-01',
        },
        {
          id: '4',
          admissionNo: '',
          name: 'Ananya Singh',
          dob: '2019-11-05',
          gender: 'Female',
          bloodGroup: 'AB+',
          parentName: 'Mrs. Kavita Singh',
          phone: '+91 98765 43213',
          email: 'kavita.singh@email.com',
          classApplied: 'Nursery',
          classAllotted: '',
          status: 'in-process',
          appliedDate: '2024-02-10',
        },
      ];
      
      setStudents(demoAdmissions);
      localStorage.setItem('admissions_demo_data', JSON.stringify(demoAdmissions));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      enquiry: 'bg-gray-100 text-gray-700 border-gray-300',
      'in-process': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      confirmed: 'bg-purple-100 text-purple-700 border-purple-300',
      admitted: 'bg-green-100 text-green-700 border-green-300',
    };
    return styles[status as keyof typeof styles] || styles.enquiry;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'admitted':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-process':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Function to auto-generate admission number
  const generateAdmissionNumber = () => {
    const currentYear = new Date().getFullYear();
    const admissionCount = students.length + 1;
    return `ADM${currentYear}${admissionCount.toString().padStart(4, '0')}`;
  };

  if (view === 'form') {
    return (
      <AdmissionForm
        student={selectedStudent}
        onBack={() => {
          setView('list');
          setSelectedStudent(null);
        }}
        onSave={async (studentData) => {
          try {
            if (usingLocalData) {
              // Use local storage in demo mode
              const id = `${Date.now()}`;
              const year = new Date().getFullYear();
              const count = students.length + 1;
              const admissionNo = `ADM${year}${count.toString().padStart(4, '0')}`;
              
              const newAdmission = {
                id,
                admissionNo,
                ...studentData,
                appliedDate: new Date().toISOString().split('T')[0],
                status: studentData.status || 'enquiry'
              };
              
              const updatedStudents = selectedStudent
                ? students.map(s => s.id === selectedStudent.id ? { ...s, ...studentData } : s)
                : [...students, newAdmission as Student];
              
              setStudents(updatedStudents);
              localStorage.setItem('admissions_demo_data', JSON.stringify(updatedStudents));
              
              alert(`Admission ${selectedStudent ? 'updated' : 'created'} successfully!\n\n${!selectedStudent ? `Admission Number: ${admissionNo}\n` : ''}Student Name: ${studentData.name}\n\n⚠️ Note: Using local demo mode. Data is saved in browser storage only.`);
              
              setView('list');
              setSelectedStudent(null);
            } else {
              // Use backend API
              if (selectedStudent) {
                await admissionAPI.update(selectedStudent.id, studentData);
                alert('Admission updated successfully!');
              } else {
                const dataToSend = {
                  ...studentData,
                  appliedDate: new Date().toISOString().split('T')[0],
                  status: studentData.status || 'enquiry'
                };
                const response = await admissionAPI.create(dataToSend);
                alert(`Admission created successfully!\n\nAdmission Number: ${response.admission.admissionNo}\nStudent Name: ${studentData.name}\n\nPlease note down the admission number for future reference.`);
              }
              await loadAdmissions();
              setView('list');
              setSelectedStudent(null);
            }
          } catch (error: any) {
            console.error('Save admission error:', error);
            alert(`Failed to save admission: ${error.message || 'Unknown error'}\n\nPlease check the console for details.`);
          }
        }}
      />
    );
  }

  const stats = {
    total: students.length,
    enquiry: students.filter(s => s.status === 'enquiry').length,
    inProcess: students.filter(s => s.status === 'in-process').length,
    confirmed: students.filter(s => s.status === 'confirmed').length,
    admitted: students.filter(s => s.status === 'admitted').length,
  };

  return (
    <div className="p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 min-h-screen">
      {/* Server Error Banner */}
      {serverError && (
        <div className={`mb-6 p-4 rounded-2xl border-2 ${
          usingLocalData 
            ? 'bg-yellow-50 border-yellow-300 text-yellow-800' 
            : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium mb-2">{serverError}</p>
              {usingLocalData && (
                <div className="text-sm space-y-2">
                  <p>
                    You can still create and manage admissions, but data will only be saved in your browser.
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium hover:underline">
                      🔧 Troubleshooting Guide
                    </summary>
                    <div className="mt-2 pl-4 space-y-1 text-xs">
                      <p>• The Supabase Edge Function may need to be deployed</p>
                      <p>• Check browser console for detailed error messages</p>
                      <p>• Verify Supabase project is active and accessible</p>
                      <p>• Check network tab for failed requests</p>
                      <p>• Try refreshing the page after a few moments</p>
                    </div>
                  </details>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setServerError(null);
                loadAdmissions();
              }}
              className="px-3 py-1 bg-white rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Admission Management</h1>
          <p className="text-gray-600">Manage student admissions and applications</p>
          {loading && (
            <p className="text-blue-600 mt-1">⏳ Loading admissions from server...</p>
          )}
          {usingLocalData && !loading && (
            <p className="text-yellow-600 mt-1">📁 Using local demo mode</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          {!loading && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 ${
              usingLocalData 
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
                : 'bg-green-50 border-green-300 text-green-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${usingLocalData ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
              <span className="text-sm">{usingLocalData ? 'Local Mode' : 'Connected'}</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadAdmissions}
            disabled={loading}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <svg className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setView('form')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-5 h-5" />
            New Admission
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-purple-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-purple-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-gray-600 mb-1">Total</p>
            <p className="text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-gray-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-gray-600 mb-1">Enquiry</p>
            <p className="text-gray-900">{stats.enquiry}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-yellow-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-gray-600 mb-1">In Process</p>
            <p className="text-gray-900">{stats.inProcess}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-purple-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-purple-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-gray-600 mb-1">Confirmed</p>
            <p className="text-gray-900">{stats.confirmed}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-green-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200 to-green-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-gray-600 mb-1">Admitted</p>
            <p className="text-gray-900">{stats.admitted}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, admission no, or parent..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="enquiry">Enquiry</option>
              <option value="in-process">In Process</option>
              <option value="confirmed">Confirmed</option>
              <option value="admitted">Admitted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Display */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl shadow-lg border-2 border-gray-100">
          <p className="text-gray-500">Loading admissions...</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-purple-300 p-5 hover:shadow-xl transition-all"
            >
              <div className="space-y-4">
                {/* Header - Student Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-gray-900 mb-1 truncate">{student.name}</h3>
                    <p className="text-gray-500">{student.admissionNo}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border ${getStatusBadge(student.status)}`}>
                    {getStatusIcon(student.status)}
                    <span className="whitespace-nowrap">{student.status.replace('-', ' ').toUpperCase()}</span>
                  </span>
                </div>

                {/* Key Info Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded-xl">
                    <span className="text-gray-600">Class</span>
                    <span className="text-gray-900">Class {student.classApplied}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Parent</span>
                    <span className="text-gray-900 truncate ml-2">{student.parentName}</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl">
                    <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-900 truncate">{student.phone}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-gray-500">Gender</p>
                      <p className="text-gray-900">{student.gender}</p>
                    </div>
                    <div className="text-center border-x border-gray-200">
                      <p className="text-gray-500">Blood</p>
                      <p className="text-gray-900">{student.bloodGroup}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">DOB</p>
                      <p className="text-gray-900 truncate">{student.dob}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-xl">
                    <span className="text-gray-600">Applied</span>
                    <span className="text-gray-900">{student.appliedDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedStudent(student);
                      setView('form');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border-2 border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-purple-300 p-4 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getStatusBadge(student.status)}`}>
                  {getStatusIcon(student.status)}
                </div>

                {/* Student Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  <div>
                    <h4 className="text-gray-900 truncate">{student.name}</h4>
                    <p className="text-gray-500">{student.admissionNo}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Class</p>
                    <p className="text-gray-900">Class {student.classApplied}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Parent</p>
                    <p className="text-gray-900 truncate">{student.parentName}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-900">{student.phone}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Applied</p>
                    <p className="text-gray-900">{student.appliedDate}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border whitespace-nowrap ${getStatusBadge(student.status)}`}>
                  {student.status.replace('-', ' ').toUpperCase()}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedStudent(student);
                      setView('form');
                    }}
                    className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 border-2 border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredStudents.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-3xl shadow-lg border-2 border-gray-100">
          <div className="max-w-md mx-auto">
            <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No Admissions Found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'No admissions match your search criteria. Try adjusting your filters.'
                : 'Get started by creating your first admission using the "New Admission" button above.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setView('form')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
              >
                Create First Admission
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
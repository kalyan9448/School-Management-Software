import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Eye, CheckCircle, Clock, XCircle, UserPlus, Calendar, Phone, Mail, Grid3x3, List, Users } from 'lucide-react';
import { AdmissionForm } from './AdmissionForm';
import { AcademicYear, DEFAULT_YEARS, getActiveAcademicYearId } from '../utils/classUtils';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import { apiClient } from '../services/apiClient';
import { userService, studentService, schoolService, admissionService } from '../utils/centralDataService';
import { doc, setDoc } from 'firebase/firestore';

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  guardianOccupation?: string;
  parentName: string;
  phone: string;
  emergencyContactNumber?: string;
  email: string;
  rollNo?: string;
  classApplied: string;
  classAllotted: string;
  status: 'enquiry' | 'in-process' | 'confirmed' | 'admitted';
  appliedDate: string;
  admissionDate?: string;
  academicYear?: string;

}

interface AdmissionModuleProps {
  initialView?: 'list' | 'form';
  initialData?: any;
}

export function AdmissionModule({ initialView = 'list', initialData }: AdmissionModuleProps = {}) {
  const [view, setView] = useState<'list' | 'form'>(initialView);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialData || null);
  const [selectedYear, setSelectedYear] = useState<string>(getActiveAcademicYearId());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('admitted');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const { user } = useAuth();

  const getResolvedSchoolId = () => user?.school_id?.trim() || sessionStorage.getItem('active_school_id')?.trim() || '';

  const syncSchoolContext = async (schoolId: string) => {
    if (!schoolId) return;

    sessionStorage.setItem('active_school_id', schoolId);

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        school_id: schoolId,
        role: user?.role || 'admin',
        email: user?.email || currentUser.email || '',
      }, { merge: true });
    } catch (error) {
      console.warn('[AdmissionModule] Could not persist school context to user profile:', error);
    }

    try {
      const token = await currentUser.getIdToken();
      const apiBase = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001').replace(/\/$/, '');
      await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.warn('[AdmissionModule] Backend claim sync failed:', error);
    }

    try {
      await currentUser.getIdToken(true);
    } catch (error) {
      console.warn('[AdmissionModule] Token refresh failed:', error);
    }
  };

  const mapAdmissionRecord = (s: any): Student => ({
    id: s.id,
    admissionNo: s.admissionNo || '',
    name: s.name || '',
    dob: s.dob || s.dateOfBirth || '',
    gender: s.gender || '',
    bloodGroup: s.bloodGroup || '',
    fatherName: s.fatherName || '',
    motherName: s.motherName || '',
    guardianName: s.guardianName || '',
    fatherOccupation: s.fatherOccupation || '',
    motherOccupation: s.motherOccupation || '',
    guardianOccupation: s.guardianOccupation || '',
    parentName: s.fatherName || s.parentName || '',
    phone: s.phone || s.parentPhone || '',
    emergencyContactNumber: s.emergencyContactNumber || '',
    email: s.email || s.parentEmail || '',
    rollNo: s.rollNo || '',
    classApplied: s.classApplied || s.class || '',
    classAllotted: s.classAllotted || s.class || '',
    status: (s.status as Student['status']) || 'enquiry',
    appliedDate: s.appliedDate || s.admissionDate || '',
    admissionDate: s.admissionDate || '',
    academicYear: s.academicYear || '',
  });

  const loadLegacyAdmissionsFromStudents = async () => {
    const firestoreStudents = await studentService.getAll();
    setStudents(firestoreStudents.map(mapAdmissionRecord));
  };

  const loadAdmissionsFromBackend = async () => {
    const response = await apiClient.get('/api/school-admin/admissions');
    const records = Array.isArray(response.data?.admissions) ? response.data.admissions : [];
    setStudents(records.map(mapAdmissionRecord));
  };

  // Load data
  useEffect(() => {
    // Load academic years
    setAcademicYears(DEFAULT_YEARS);

    if (view === 'list') {
      loadAdmissions();
    }
  }, [view, selectedYear, user]);

  useEffect(() => {
    setView(initialView);
    setSelectedStudent(initialData || null);
  }, [initialView, initialData]);

  // Migration logic to fix missing admission numbers
  useEffect(() => {
    if (students.length > 0) {
      const hasMissingIds = students.some(s => !s.admissionNo || s.admissionNo.trim() === '');
      if (hasMissingIds) {
        const fixIds = async () => {
          const currentYear = new Date().getFullYear();
          const currentSchoolId = user?.school_id || sessionStorage.getItem('active_school_id');
          const currentSchool = currentSchoolId ? await schoolService.getById(currentSchoolId) : null;
          const schoolCode = currentSchool?.schoolCode || 'ADM';
          const updatedStudents = students.map((s, index) => {
            if (!s.admissionNo || s.admissionNo.trim() === '') {
              return { ...s, admissionNo: `${schoolCode}-${currentYear}-${(index + 1).toString().padStart(4, '0')}` };
            }
            return s;
          });
          setStudents(updatedStudents);
        };
        fixIds();
      }
    }
  }, [students, user?.school_id]);

  const loadAdmissions = async (hasRetried = false) => {
    try {
      setLoading(true);
      setServerError(null);

      const resolvedSchoolId = getResolvedSchoolId();

      // Always keep session school context aligned with the authenticated user.
      if (resolvedSchoolId && sessionStorage.getItem('active_school_id') !== resolvedSchoolId) {
        sessionStorage.setItem('active_school_id', resolvedSchoolId);
      }

      if (!resolvedSchoolId) {
        // School context not ready yet — will re-fire once auth resolves user.
        setStudents([]);
        setLoading(false);
        return;
      }

      try {
        await loadAdmissionsFromBackend();
        return;
      } catch (backendError) {
        console.warn('[AdmissionModule] Backend admissions load failed, falling back to Firestore:', backendError);
      }

      const firestoreAdmissions = await admissionService.getAll();
      setStudents(firestoreAdmissions.map(mapAdmissionRecord));
    } catch (error: any) {
      console.error('Failed to load admissions:', error);

      const resolvedSchoolId = getResolvedSchoolId();
      if (error?.code === 'permission-denied' && resolvedSchoolId && !hasRetried) {
        await syncSchoolContext(resolvedSchoolId);
        await loadAdmissions(true);
        return;
      }

      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        try {
          await loadLegacyAdmissionsFromStudents();
          setServerError(null);
          return;
        } catch (fallbackError) {
          console.error('Failed to load legacy admissions from students:', fallbackError);
        }
      }

      setServerError(
        error?.code === 'permission-denied'
          ? 'Could not access admissions for the active school. School context was refreshed; please try again.'
          : 'Failed to load admissions from Firestore. Please try again.'
      );
      setStudents([]);
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
    // If student has no academic year recorded, assume current for demo purposes
    const studentYear = student.academicYear || getActiveAcademicYearId();
    const matchesYear = studentYear === selectedYear;
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesYear && matchesFilter;
  });

  // Function to auto-generate admission number
  const generateAdmissionNumber = async () => {
    const currentYear = new Date().getFullYear();
    const admissionCount = students.length + 1;
    const currentSchoolId = getResolvedSchoolId();
    const currentSchool = currentSchoolId ? await schoolService.getById(currentSchoolId) : null;
    const schoolCode = currentSchool?.schoolCode || 'ADM';
    return `${schoolCode}-${currentYear}-${admissionCount.toString().padStart(4, '0')}`;
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
            const resolvedSchoolId = getResolvedSchoolId();

            // Ensure school context before any Firestore write
            if (resolvedSchoolId && sessionStorage.getItem('active_school_id') !== resolvedSchoolId) {
              sessionStorage.setItem('active_school_id', resolvedSchoolId);
            }
            if (!resolvedSchoolId) {
              alert('School context is not available. Please reload the page and try again.');
              return;
            }

            // Sync JWT claims so Firestore rules see the correct school_id
            await syncSchoolContext(resolvedSchoolId);

            let savedId: string;

            if (selectedStudent) {
              // Update existing admission in Firestore
              await admissionService.update(selectedStudent.id, {
                ...studentData,
              });
              savedId = selectedStudent.id;
              alert('Admission updated successfully!');
            } else {
              // Create new admission — try backend first (Admin SDK bypasses rules),
              // then fall back to direct Firestore client SDK.
              const admissionNo = studentData.admissionNo?.trim() || await generateAdmissionNumber();
              const admissionPayload = {
                ...studentData,
                admissionNo,
                appliedDate: new Date().toISOString().split('T')[0],
                status: studentData.status || 'enquiry',
              };

              let created: any = null;
              let backendError: any = null;
              try {
                const resp = await apiClient.post('/api/school-admin/admissions', admissionPayload);
                created = resp.data?.admission || resp.data;
              } catch (backendErr: any) {
                backendError = backendErr;
                console.warn('[AdmissionModule] Backend create failed, falling back to Firestore:', backendErr);
              }

              if (!created?.id) {
                try {
                  created = await admissionService.create(admissionPayload);
                } catch (firestoreErr: any) {
                  // Both backend and Firestore failed — give a clear message
                  const isPermission = firestoreErr?.code === 'permission-denied' || firestoreErr?.message?.includes('permissions');
                  if (isPermission) {
                    throw new Error(
                      'Permission denied by Firestore.\n\n' +
                      'To fix this, do ONE of the following:\n' +
                      '1. Start the backend server: cd backend && node src/index.js\n' +
                      '2. Deploy Firestore rules: firebase deploy --only firestore:rules\n' +
                      '3. Log out and log back in (so JWT claims get refreshed)'
                    );
                  }
                  throw firestoreErr;
                }
              }

              savedId = created.id;
              alert(`Admission created successfully!\n\nAdmission Number: ${admissionNo}\nStudent Name: ${studentData.name}`);
            }

            await loadAdmissions();
            setView('list');
            setSelectedStudent(null);

            // --- PROVISIONING LOGIC ---
            // Only create login accounts and student record if the student is marked as "Admitted"
            if (studentData.status === 'admitted') {
              // 0. Also create a record in the students collection
              const createdStudent = await studentService.create({
                admissionNo: studentData.admissionNo,
                name: studentData.name,
                dateOfBirth: studentData.dob,
                gender: studentData.gender,
                bloodGroup: studentData.bloodGroup,
                fatherName: studentData.fatherName || studentData.parentName,
                motherName: studentData.motherName,
                parentPhone: studentData.phone,
                parentEmail: studentData.parentEmail || studentData.email,
                email: studentData.email,
                address: studentData.address,
                class: studentData.classAllotted || studentData.classApplied,
                section: studentData.section,
                rollNo: studentData.rollNo,
                admissionDate: studentData.admissionDate || new Date().toISOString().split('T')[0],
                academicYear: studentData.academicYear,
                status: 'active',
              });
              const studentId = createdStudent.id;
              
              // 1. Provision Student Login Account (Only if email is provided)
              if (studentData.email) {
                await userService.create({
                  email: studentData.email,
                  name: studentData.name,
                  role: 'student',
                  school_id: user?.school_id,
                  isFirstLogin: true
                });
              }

              // 2. Provision/Link Parent Login Account
              const allUsers = await userService.getAll();
              const existingParent = allUsers.find((u: any) => u.email === studentData.parentEmail && u.role === 'parent');
              let parentUserId = '';

              if (existingParent) {
                parentUserId = existingParent.id;
                // Link student to existing parent account
                const currentChildren = existingParent.childrenIds || [];
                if (!currentChildren.includes(studentId)) {
                  await userService.update(existingParent.id, {
                    childrenIds: [...currentChildren, studentId]
                  });
                }
              } else if (studentData.parentEmail) {
                // Create new parent account and link student
                const createdParent = await userService.create({
                  email: studentData.parentEmail,
                  name: studentData.parentName || studentData.guardianName || 'Parent',
                  role: 'parent',
                  school_id: user?.school_id,
                  childrenIds: [studentId],
                  isFirstLogin: true
                });
                parentUserId = createdParent.id;
              }

              // 3. Link parent back to student record
              if (parentUserId) {
                await studentService.update(studentId, { parentId: parentUserId });
              }
              
              console.log('Automated provisioning completed for:', studentData.email, studentData.parentEmail);
            }
            // --------------------------
          } catch (error: any) {
            console.error('Save admission error:', error);
            alert(`Failed to save admission: ${error.message || 'Unknown error'}\n\nPlease check the console for details.`);
          }
        }}
      />
    );
  }

  const renderViewDetailsModal = () => {
    if (!viewingStudent) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${getStatusBadge(viewingStudent.status)}`}>
                {getStatusIcon(viewingStudent.status)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingStudent.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 font-medium">{viewingStudent.admissionNo || 'Pending ID'}</p>
                  <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-500 uppercase">
                    School Code: {viewingStudent.admissionNo?.split('-')[0] || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setViewingStudent(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Status Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                <p className="text-purple-900 font-bold capitalize">{viewingStudent.status.replace('-', ' ')}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Applied For</p>
                <p className="text-blue-900 font-bold">{viewingStudent.classApplied}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">Allotted</p>
                <p className="text-green-900 font-bold">{viewingStudent.classAllotted || 'Not Yet'}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                <p className="text-yellow-600 text-xs font-bold uppercase tracking-wider mb-1">Applied On</p>
                <p className="text-yellow-900 font-bold">{viewingStudent.appliedDate}</p>
              </div>
            </div>

            {/* Student Details */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Date of Birth</p>
                  <p className="text-gray-900 font-medium">{viewingStudent.dob}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Gender</p>
                  <p className="text-gray-900 font-medium">{viewingStudent.gender}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Blood Group</p>
                  <p className="text-gray-900 font-medium">{viewingStudent.bloodGroup}</p>
                </div>
              </div>
            </div>

            {/* Parent Contact */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Guardian Information
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold">{viewingStudent.parentName}</p>
                      <p className="text-gray-500 text-sm">Primary Guardian</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-2xl">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase">Phone Number</p>
                      <p className="text-gray-900 font-medium">{viewingStudent.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-2xl">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase">Email Address</p>
                      <p className="text-gray-900 font-medium break-all">{viewingStudent.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  setSelectedStudent(viewingStudent);
                  setViewingStudent(null);
                  setView('form');
                }}
                className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Edit className="w-5 h-5" />
                Modify Details
              </button>
              <button
                onClick={() => setViewingStudent(null)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        <div className="mb-6 p-4 rounded-2xl border-2 bg-red-50 border-red-300 text-red-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="flex-1 font-medium">{serverError}</p>
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
          <h1 className="text-gray-900 mb-2">Admitted Students List</h1>
          <p className="text-gray-600">View and manage the list of successfully admitted students</p>
          {loading && (
            <p className="text-blue-600 mt-1">⏳ Loading admissions from server...</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          {!loading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 bg-green-50 border-green-300 text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm">Connected</span>
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
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
              title="Grid View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedStudent(null);
              setView('form');
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-5 h-5" />
            New Admission
          </button>
        </div>
      </div>

      {/* Stats Cards Removed to focus on Admitted List */}

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-700">Filter by Academic Year:</span>
          </div>
          <div className="relative flex-1 md:max-w-xs">
            <select
              value={selectedYear}
              onChange={(e) => {
                setLoading(true);
                setTimeout(() => {
                  setSelectedYear(e.target.value);
                  setLoading(false);
                }, 400); // Simulate dynamic loading
              }}
              className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white font-medium text-gray-700"
            >
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name} {year.status === 'active' ? '(Current)' : ''}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
                    <span className="text-gray-900">{student.classApplied}</span>
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
                    <span className="text-gray-600">Admitted On</span>
                    <span className="text-gray-900">{student.admissionDate || student.appliedDate}</span>
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
                    onClick={() => setViewingStudent(student)}
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
                    <p className="text-gray-900">{student.classApplied}</p>
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
                    <p className="text-gray-500">Admitted On</p>
                    <p className="text-gray-900">{student.admissionDate || student.appliedDate}</p>
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
                    onClick={() => setViewingStudent(student)}
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
              {students.some(s => s.academicYear === selectedYear)
                ? 'No admissions match your selected status. Try adjusting your filters.'
                : `No admitted students found for the academic year ${selectedYear}.`}
            </p>
            {filteredStudents.length === 0 && (
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setView('form');
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
              >
                New Admission for {selectedYear}
              </button>
            )}
          </div>
        </div>
      )}

      {renderViewDetailsModal()}
    </div>
  );
}
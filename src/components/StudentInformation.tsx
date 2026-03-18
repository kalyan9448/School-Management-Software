import { useState, useEffect, useCallback } from 'react';
import { Search, User, Phone, Mail, MapPin, Calendar, Heart, DollarSign, Users, Bus, AlertCircle, Activity, FileText, X, Check, Download, Send, TrendingUp, Grid3x3, List, Edit, Trash2, Plus, ChevronLeft, ChevronRight, MapPin as MapPinIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import { demoStudents, Student, getStudents, saveStudents } from './StudentInformationData';
import { AcademicYear, getUniqueClasses, getSectionsForClass } from '../utils/classUtils';
import { AdmissionForm } from './AdmissionForm';

// --- Feature 3: CSV Export Utility ---
function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  rollNo: string;
  parentPhone: string;
  status: 'present' | 'absent' | 'late';
}

interface MonthlyAttendance {
  studentName: string;
  rollNo: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  percentage: number;
}

interface StudentInformationProps {
  onNavigate?: (view: string) => void;
  initialTab?: 'profiles' | 'attendance';
  initialClass?: string;
  initialSection?: string;
}

export function StudentInformation({ 
  onNavigate, 
  initialTab = 'attendance',
  initialClass = 'all',
  initialSection = 'all'
}: StudentInformationProps = {}) {
  const [activeMainTab, setActiveMainTab] = useState<'profiles' | 'attendance'>(initialTab);
  const [attendanceTab, setAttendanceTab] = useState<'daily' | 'monthly'>('daily');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [profileClassFilter, setProfileClassFilter] = useState<string>('all'); // Class filter for profiles

  // Academic Year selection
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  // Add/Edit/Delete state
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null); // Student being edited
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [view, setView] = useState<'list' | 'edit'>('list'); // 'list' for student list/attendance, 'edit' for AdmissionForm

  useEffect(() => {
    const storedYears = localStorage.getItem('school_academic_years');
    if (storedYears) {
      const years = JSON.parse(storedYears);
      setAcademicYears(years);
      const active = years.find((y: any) => y.status === 'active')?.id || years[0]?.id || '';
      if (!selectedAcademicYear) setSelectedAcademicYear(active);
    }
  }, [selectedAcademicYear]);

  // Robust student loading function
  const loadDynamicStudents = useCallback(() => {
    try {
      const baseStudents = getStudents(); // Get from persistent central store
      const localAdmissions = localStorage.getItem('admissions_demo_data');

      if (localAdmissions) {
        const admissions = JSON.parse(localAdmissions);
        // Filter for only admitted or confirmed students
        const admittedStudents = admissions.filter((a: any) =>
          a.status === 'admitted' || a.status === 'confirmed'
        );

        // Map admissions to Student interface
        const mappedStudents: Student[] = admittedStudents.map((adm: any) => ({
          id: adm.id,
          admissionNo: adm.admissionNo || `ADM${new Date().getFullYear()}${String(Math.floor(Math.random() * 9000) + 1000)}`,
          name: adm.name,
          class: adm.classAllotted || adm.classApplied || adm.class || '1',
          section: adm.section || 'A',
          rollNo: adm.rollNo || '0',
          dob: adm.dob || '',
          gender: adm.gender || 'Male',
          bloodGroup: adm.bloodGroup || 'O+',
          fatherName: adm.fatherName || '',
          motherName: adm.motherName || '',
          guardianName: adm.guardianName || '',
          fatherOccupation: adm.fatherOccupation || '',
          motherOccupation: adm.motherOccupation || '',
          guardianOccupation: adm.guardianOccupation || '',
          parentName: adm.parentName || adm.fatherName || adm.guardianName || '',
          phone: adm.phone || '',
          emergencyContactNumber: adm.emergencyContactNumber || '',
          email: adm.email || '',
          address: adm.address || '',
          admissionDate: adm.admissionDate || '',
          academicYear: adm.academicYear || '', // From admission form
          feeStatus: adm.feeStatus || 'pending',
          totalFee: adm.totalFee || 50000,
          paidFee: adm.paidFee || 0,
          dueFee: adm.dueFee || 50000,
          attendance: adm.attendance || 0,
          presentDays: adm.presentDays || 0,
          totalDays: adm.totalDays || 60,
          classTeacher: adm.classTeacher || '',
          classTeacherContact: adm.classTeacherContact || '',
          transportRoute: adm.transportRoute || '',
          busNumber: adm.busNumber || '',
          documents: adm.documents || {},
          academicHistory: adm.academicHistory || [],
          medicalInfo: adm.medicalInfo || {
            allergies: [],
            conditions: [],
            emergencyContact: adm.parentName || adm.fatherName || '',
            emergencyPhone: adm.emergencyContactNumber || adm.phone || '',
          },
        }));

        // Merging Strategy
        const mergedStudents = [...baseStudents];

        mappedStudents.forEach(dynamicStudent => {
          const index = mergedStudents.findIndex(s => s.id === dynamicStudent.id);
          if (index !== -1) {
            // Let StudentPromotionTool have precedence over Admissions if history exists
            if (mergedStudents[index].academicHistory && mergedStudents[index].academicHistory.length > 0) {
              // Do not overwrite academicYear and class from admission if it was promoted
              mergedStudents[index] = { ...dynamicStudent, academicYear: mergedStudents[index].academicYear, class: mergedStudents[index].class, section: mergedStudents[index].section, academicHistory: mergedStudents[index].academicHistory };
            } else {
              mergedStudents[index] = dynamicStudent;
            }
          } else {
            mergedStudents.push(dynamicStudent);
          }
        });

        setStudents(mergedStudents);
        saveStudents(mergedStudents); // Update central persistent store too!
        return;
      }

      setStudents(baseStudents);
    } catch (error) {
      console.error("Failed to load admissions data", error);
      setStudents(getStudents());
    }
  }, []);

  // Sync data on mount
  useEffect(() => {
    loadDynamicStudents();
  }, [loadDynamicStudents]);

  // Attendance and Search state
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  // Pagination state for attendance table
  const [currentPage, setCurrentPage] = useState(0);
  const studentsPerPage = 6;

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Update attendance list when class/section or students change
  useEffect(() => {
    const classFiltered = students.filter(s =>
      (selectedClass === 'all' || s.class.toString() === selectedClass.toString()) &&
      (selectedSection === 'all' || (s.section || 'A') === selectedSection)
    );

    const records: AttendanceRecord[] = classFiltered.map(s => ({
      studentId: s.id,
      studentName: s.name,
      rollNo: s.rollNo || '0',
      parentPhone: s.phone || '',
      status: 'present' // Default to present for new daily sheet
    }));

    setAttendance(records);
    setCurrentPage(0); // Reset pagination on filter change
  }, [selectedClass, selectedSection, students]);

  const monthlyAttendance: MonthlyAttendance[] = attendance.map(record => {
    const student = students.find(s => s.id === record.studentId);
    return {
      studentName: record.studentName,
      rollNo: record.rollNo,
      presentDays: student?.presentDays || 0,
      absentDays: (student?.totalDays || 60) - (student?.presentDays || 0),
      lateDays: 0,
      totalDays: student?.totalDays || 60,
      percentage: student?.attendance || 0
    };
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.includes(searchTerm);

    const matchesClass = profileClassFilter === 'all' || student.class === profileClassFilter;
    const matchesYear = selectedAcademicYear === 'all' || student.academicYear === selectedAcademicYear;

    return matchesSearch && matchesClass && matchesYear;
  });

  const toggleStatus = (studentId: string) => {
    setAttendance(attendance.map(record => {
      if (record.studentId === studentId) {
        const statuses: ('present' | 'absent' | 'late')[] = ['present', 'absent', 'late'];
        const currentIndex = statuses.indexOf(record.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...record, status: statuses[nextIndex] };
      }
      return record;
    }));
  };

  const markAllPresent = () => {
    setAttendance(attendance.map(record => ({ ...record, status: 'present' })));
  };

  const saveAttendance = () => {
    alert(`Attendance saved for Class ${selectedClass}-${selectedSection} on ${selectedDate}`);
  };

  const sendAbsentAlerts = () => {
    const absentStudents = attendance.filter(r => r.status === 'absent');

    if (absentStudents.length === 0) {
      alert('No absent students to notify!');
      return;
    }

    const alertMessage = absentStudents.map(s =>
      `SMS/WhatsApp sent to ${s.parentPhone}:\n"Dear Parent, ${s.studentName} (Roll No: ${s.rollNo}) is marked absent today (${selectedDate}). Please contact the school if this is incorrect."`
    ).join('\n\n');

    alert(`Absent Alerts Sent!\n\n${alertMessage}\n\nTotal alerts sent: ${absentStudents.length}`);
  };

  const getFeeStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const stats = {
    present: attendance.filter(r => r.status === 'present').length,
    absent: attendance.filter(r => r.status === 'absent').length,
    late: attendance.filter(r => r.status === 'late').length,
    total: attendance.length,
  };

  const attendancePercentage = ((stats.present + stats.late) / stats.total * 100).toFixed(1);

  // Helper function to download CSV
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export.');
      return;
    }

    // Extract headers from the first object
    const headers = Object.keys(data[0]);

    // Build CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row =>
        headers.map(fieldName => {
          let cellData = row[fieldName] === null || row[fieldName] === undefined ? '' : String(row[fieldName]);
          // Escape quotes and commas
          cellData = cellData.replace(/"/g, '""');
          if (cellData.search(/("|,|\n)/g) >= 0) {
            cellData = `"${cellData}"`;
          }
          return cellData;
        }).join(',')
      )
    ].join('\n');

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportDailyAttendance = () => {
    const exportData = attendance.map(record => ({
      'Roll No': record.rollNo,
      'Student Name': record.studentName,
      'Parent Phone': record.parentPhone,
      'Status': record.status,
      'Date': selectedDate,
      'Class': selectedClass,
      'Section': selectedSection
    }));
    downloadCSV(exportData, `daily_attendance_${selectedClass}_${selectedSection}_${selectedDate}.csv`);
  };

  const exportMonthlyAttendance = () => {
    const exportData = monthlyAttendance.map(record => ({
      'Roll No': record.rollNo,
      'Student Name': record.studentName,
      'Present Days': record.presentDays,
      'Absent Days': record.absentDays,
      'Late Days': record.lateDays,
      'Total Days': record.totalDays,
      'Percentage': `${record.percentage.toFixed(1)}%`,
      'Month': selectedMonth,
      'Class': selectedClass,
      'Section': selectedSection
    }));
    downloadCSV(exportData, `monthly_attendance_${selectedClass}_${selectedSection}_${selectedMonth}.csv`);
  };

  const exportMonthlyPDF = () => {
    if (monthlyAttendance.length === 0) {
      alert('No data to export.');
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Monthly Attendance Report', 14, 22);

    // Subtitle / Filters
    doc.setFontSize(12);
    doc.text(`Class: ${selectedClass} | Section: ${selectedSection} | Month: ${selectedMonth}`, 14, 30);

    // Summary
    doc.setFontSize(10);
    doc.text(`Average Attendance: ${(monthlyAttendance.reduce((sum, s) => sum + s.percentage, 0) / monthlyAttendance.length).toFixed(1)}%`, 14, 38);
    doc.text(`Below 75%: ${monthlyAttendance.filter(s => s.percentage < 75).length} students`, 14, 44);

    // Table Data setup. We can use autoTable if available, but doing it manually for simplicity if not.
    // Assuming simple text layout or simple primitive table since we don't have jspdf-autotable in package.json

    let yPos = 55;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Headers
    doc.text('Roll', 14, yPos);
    doc.text('Name', 30, yPos);
    doc.text('Present', 90, yPos);
    doc.text('Absent', 115, yPos);
    doc.text('Total', 140, yPos);
    doc.text('Percentage', 165, yPos);

    doc.line(14, yPos + 2, 195, yPos + 2); // Header underline
    yPos += 8;

    doc.setFont('helvetica', 'normal');

    monthlyAttendance.forEach(record => {
      // Pagination check
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(String(record.rollNo), 14, yPos);

      // Truncate name if too long
      const name = record.studentName.length > 25 ? record.studentName.substring(0, 22) + '...' : record.studentName;
      doc.text(name, 30, yPos);

      doc.text(String(record.presentDays), 90, yPos);
      doc.text(String(record.absentDays), 115, yPos);
      doc.text(String(record.totalDays), 140, yPos);
      doc.text(`${record.percentage.toFixed(1)}%`, 165, yPos);

      yPos += 8;
    });

    doc.save(`monthly_attendance_report_${selectedClass}_${selectedSection}_${selectedMonth}.pdf`);
  };

  // Add Student Handler
  const handleAddStudent = () => {
    if (onNavigate) {
      onNavigate('admission-new');
      return;
    }
  };

  // Edit Student Handler
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setView('edit');
  };

  const handleSaveEdit = async (updatedData: any) => {
    try {
      const localAdmissions = localStorage.getItem('admissions_demo_data');
      let admissions = localAdmissions ? JSON.parse(localAdmissions) : [];

      const existingIndex = admissions.findIndex((adm: any) => adm.id === editingStudent?.id);

      if (existingIndex !== -1) {
        // Update existing dynamic record
        admissions[existingIndex] = { ...admissions[existingIndex], ...updatedData };
      } else if (editingStudent) {
        // This was a demo student or new record, add it as a dynamic admitted student
        admissions.push({
          ...editingStudent,
          ...updatedData,
          status: 'admitted',
          id: editingStudent.id || `adm_${Date.now()}`
        });
      }

      localStorage.setItem('admissions_demo_data', JSON.stringify(admissions));

      // Re-load dynamic students from localStorage to sync UI
      loadDynamicStudents();

      alert('Student profile updated successfully!');
      setView('list');
      setEditingStudent(null);
    } catch (error) {
      console.error('Failed to save student edit', error);
      alert('Failed to save changes.');
    }
  };

  // Delete Student Handler
  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      setStudents(students.filter(s => s.id !== studentToDelete.id));
      alert(`Student "${studentToDelete.name}" has been deleted successfully!`);
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };

  if (view === 'edit' && editingStudent) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <AdmissionForm
            student={editingStudent}
            onBack={() => {
              setView('list');
              setEditingStudent(null);
            }}
            onSave={handleSaveEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Student Management</h1>
          <p className="text-gray-600">Manage student profiles and attendance</p>
        </div>

        {/* View Mode Toggle - Only show for profiles */}
        {activeMainTab === 'profiles' && (
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
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveMainTab('attendance')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeMainTab === 'attendance'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Module
          </div>
        </button>
        <button
          onClick={() => setActiveMainTab('profiles')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeMainTab === 'profiles'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student Profiles
          </div>
        </button>
      </div>

      {/* Student Profiles Tab */}
      {activeMainTab === 'profiles' && (
        <>
          {/* Search and Class Filter */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, admission no, or class..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Academic Years</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={profileClassFilter}
                  onChange={(e) => setProfileClassFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Classes</option>
                  {getUniqueClasses(selectedAcademicYear === 'all' ? undefined : selectedAcademicYear).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Count Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-1">Total Students</p>
                <p className="text-3xl font-bold">{filteredStudents.length}</p>
                {profileClassFilter !== 'all' && (
                  <p className="mt-2 text-purple-100">
                    Showing Class {profileClassFilter} students
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Users className="w-12 h-12 text-purple-200" />
                <button
                  onClick={handleAddStudent}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Add Student
                </button>
                <button
                  onClick={() => exportCSV(
                    'students_list.csv',
                    ['Admission No', 'Name', 'Class', 'Section', 'Roll No', 'DOB', 'Gender', 'Phone', 'Address'],
                    filteredStudents.map(s => [
                      s.admissionNo, s.name, s.class, s.section, s.rollNo || '',
                      (s as any).dateOfBirth || '', s.gender, s.phone, s.address
                    ])
                  )}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Students Table */}
          {filteredStudents.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Photo</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Admission No</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Student Name</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Class</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Section</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Roll No</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Parent Name</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Phone</th>
                      <th className="px-6 py-4 text-left text-purple-900 font-semibold">Email</th>
                      <th className="px-6 py-4 text-center text-purple-900 font-semibold">Attendance</th>
                      <th className="px-6 py-4 text-center text-purple-900 font-semibold">Fee Status</th>
                      <th className="px-6 py-4 text-center text-purple-900 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr
                        key={student.id}
                        className={`border-b border-gray-100 hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                      >
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-md">
                            <User className="w-6 h-6" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-purple-700 font-medium">{student.admissionNo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-900 font-medium">{student.name}</p>
                            <p className="text-gray-500 text-sm">{student.gender} • {student.bloodGroup}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                            {student.class}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {student.section}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium">{student.rollNo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{student.parentName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{student.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 text-sm">{student.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-lg font-bold ${getAttendanceColor(student.attendance)}`}>
                              {student.attendance}%
                            </span>
                            <span className="text-xs text-gray-500">
                              {student.presentDays}/{student.totalDays}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFeeStatusBadge(student.feeStatus)}`}>
                              {student.feeStatus === 'paid' ? '✓ Paid' : student.feeStatus === 'partial' ? '◐ Partial' : '⊘ Pending'}
                            </span>
                            {student.dueFee > 0 && (
                              <span className="text-xs text-red-600">
                                ₹{student.dueFee.toLocaleString()} due
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                              title="View Details"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                              title="Edit Student"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(student)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No students found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </>
      )}

      {/* Attendance Module Tab */}
      {activeMainTab === 'attendance' && (
        <>
          {/* Attendance Sub-tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setAttendanceTab('daily')}
              className={`px-6 py-3 border-b-2 transition-colors ${attendanceTab === 'daily'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setAttendanceTab('monthly')}
              className={`px-6 py-3 border-b-2 transition-colors ${attendanceTab === 'monthly'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Monthly Report
            </button>
          </div>

          {/* Daily Attendance */}
          {attendanceTab === 'daily' && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Select Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Classes</option>
                      {getUniqueClasses().map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Select Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Sections</option>
                      {getSectionsForClass(selectedClass).map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={markAllPresent}
                      className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Mark All Present
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-100">Total Students</p>
                    <Users className="w-6 h-6 text-blue-100" />
                  </div>
                  <p className="text-white">{stats.total}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-100">Present</p>
                    <Check className="w-6 h-6 text-green-100" />
                  </div>
                  <p className="text-white">{stats.present}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-red-100">Absent</p>
                    <X className="w-6 h-6 text-red-100" />
                  </div>
                  <p className="text-white">{stats.absent}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-purple-100">Attendance %</p>
                    <TrendingUp className="w-6 h-6 text-purple-100" />
                  </div>
                  <p className="text-white">{attendancePercentage}%</p>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
                {/* Navigation Controls */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">
                      Showing students {currentPage * studentsPerPage + 1} - {Math.min((currentPage + 1) * studentsPerPage, attendance.length)} of {attendance.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className={`p-2 rounded-lg border transition-colors ${currentPage === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      title="Previous"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2 text-gray-700 font-medium">
                      Page {currentPage + 1} of {Math.ceil(attendance.length / studentsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(attendance.length / studentsPerPage) - 1, currentPage + 1))}
                      disabled={currentPage >= Math.ceil(attendance.length / studentsPerPage) - 1}
                      className={`p-2 rounded-lg border transition-colors ${currentPage >= Math.ceil(attendance.length / studentsPerPage) - 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      title="Next"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-gray-700">Roll No</th>
                        <th className="px-6 py-4 text-left text-gray-700">Student Name</th>
                        <th className="px-6 py-4 text-left text-gray-700">Parent Phone</th>
                        <th className="px-6 py-4 text-center text-gray-700">Status</th>
                        <th className="px-6 py-4 text-center text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance
                        .slice(currentPage * studentsPerPage, (currentPage + 1) * studentsPerPage)
                        .map((record) => (
                          <tr key={record.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-700">{record.rollNo}</td>
                            <td className="px-6 py-4 text-gray-900">{record.studentName}</td>
                            <td className="px-6 py-4 text-gray-700">{record.parentPhone}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-4 py-2 rounded-lg border ${getStatusStyle(record.status)} capitalize`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => toggleStatus(record.studentId)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Change
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={saveAttendance}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Save Attendance
                </button>

                {stats.absent > 0 && (
                  <button
                    onClick={sendAbsentAlerts}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send Absent Alerts ({stats.absent})
                  </button>
                )}

                <button
                  onClick={exportDailyAttendance}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export Report
                </button>
              </div>
            </>
          )}

          {/* Monthly Report */}
          {attendanceTab === 'monthly' && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Select Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Classes</option>
                      {getUniqueClasses().map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Select Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Sections</option>
                      {getSectionsForClass(selectedClass).map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Select Month</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <p className="text-gray-600 mb-2">Average Attendance</p>
                  <p className="text-gray-900">
                    {(monthlyAttendance.reduce((sum, s) => sum + s.percentage, 0) / monthlyAttendance.length).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <p className="text-gray-600 mb-2">Total Working Days</p>
                  <p className="text-gray-900">24 days</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <p className="text-gray-600 mb-2">Perfect Attendance</p>
                  <p className="text-gray-900">{monthlyAttendance.filter(s => s.percentage === 100).length} students</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <p className="text-gray-600 mb-2">Below 75%</p>
                  <p className="text-red-600">{monthlyAttendance.filter(s => s.percentage < 75).length} students</p>
                </div>
              </div>

              {/* Monthly Attendance Table */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-gray-700">Roll No</th>
                        <th className="px-6 py-4 text-left text-gray-700">Student Name</th>
                        <th className="px-6 py-4 text-center text-gray-700">Present</th>
                        <th className="px-6 py-4 text-center text-gray-700">Absent</th>
                        <th className="px-6 py-4 text-center text-gray-700">Late</th>
                        <th className="px-6 py-4 text-center text-gray-700">Total Days</th>
                        <th className="px-6 py-4 text-center text-gray-700">Percentage</th>
                        <th className="px-6 py-4 text-center text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyAttendance.map((record, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-700">{record.rollNo}</td>
                          <td className="px-6 py-4 text-gray-900">{record.studentName}</td>
                          <td className="px-6 py-4 text-center text-green-700">{record.presentDays}</td>
                          <td className="px-6 py-4 text-center text-red-700">{record.absentDays}</td>
                          <td className="px-6 py-4 text-center text-yellow-700">{record.lateDays}</td>
                          <td className="px-6 py-4 text-center text-gray-700">{record.totalDays}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={getAttendanceColor(record.percentage)}>
                              {record.percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {record.percentage >= 90 ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Excellent</span>
                            ) : record.percentage >= 75 ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1 justify-center">
                                <AlertCircle className="w-4 h-4" />
                                Average
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1 justify-center">
                                <AlertCircle className="w-4 h-4" />
                                Low
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={exportMonthlyAttendance}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Monthly Report
                </button>

                <button
                  onClick={exportMonthlyPDF}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-gray-900">Student Profile</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-8">
              {/* Basic Info Header */}
              <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-12 h-12" />
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-2">{selectedStudent.name}</h2>
                  <div className="grid grid-cols-2 gap-4 text-gray-600">
                    <p>Admission No: <span className="text-gray-900">{selectedStudent.admissionNo}</span></p>
                    <p>Class: <span className="text-gray-900">{selectedStudent.class}-{selectedStudent.section}</span></p>
                    <p>Roll No: <span className="text-gray-900">{selectedStudent.rollNo}</span></p>
                    <p>DOB: <span className="text-gray-900">{selectedStudent.dob}</span></p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full ${getFeeStatusBadge(selectedStudent.feeStatus)}`}>
                  {selectedStudent.feeStatus.toUpperCase()}
                </span>
              </div>

              {/* Complete Bio-Data */}
              <div className="mb-8">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Complete Bio-Data
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-6">
                  <div>
                    <p className="text-gray-500 mb-1">Full Name</p>
                    <p className="text-gray-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Date of Birth</p>
                    <p className="text-gray-900">{selectedStudent.dob}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Gender</p>
                    <p className="text-gray-900">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Blood Group</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      {selectedStudent.bloodGroup}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">Address</p>
                    <p className="text-gray-900">{selectedStudent.address}</p>
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="mb-8">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Attendance
                </h3>
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-purple-700 mb-1">Overall Attendance</p>
                      <p className={`text-2xl ${getAttendanceColor(selectedStudent.attendance)}`}>
                        {selectedStudent.attendance}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-700 mb-1">Days Present / Total</p>
                      <p className="text-purple-900">
                        {selectedStudent.presentDays} / {selectedStudent.totalDays} days
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${selectedStudent.attendance}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Fee Status */}
              <div className="mb-8">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Fee Status
                </h3>
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-green-700 mb-1">Total Fee</p>
                      <p className="text-green-900">₹{selectedStudent.totalFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-green-700 mb-1">Paid Amount</p>
                      <p className="text-green-900">₹{selectedStudent.paidFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-red-700 mb-1">Due Amount</p>
                      <p className="text-red-900">₹{selectedStudent.dueFee.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${(selectedStudent.paidFee / selectedStudent.totalFee) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Class Teacher Info */}
              <div className="mb-8">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Class Teacher Information
                </h3>
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-blue-700 mb-1">Teacher Name</p>
                      <p className="text-blue-900">{selectedStudent.classTeacher}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Contact Number</p>
                      <p className="text-blue-900">{selectedStudent.classTeacherContact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transport Route */}
              {selectedStudent.transportRoute && (
                <div className="mb-8">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-orange-600" />
                    Transport Information
                  </h3>
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-orange-700 mb-1">Route</p>
                        <p className="text-orange-900">{selectedStudent.transportRoute}</p>
                      </div>
                      <div>
                        <p className="text-orange-700 mb-1">Bus Number</p>
                        <p className="text-orange-900">{selectedStudent.busNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Information */}
              <div className="mb-8">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  Medical Information
                </h3>
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Allergies
                      </p>
                      {selectedStudent.medicalInfo.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.medicalInfo.allergies.map((allergy, index) => (
                            <span key={index} className="px-3 py-1 bg-red-200 text-red-900 rounded-full">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-red-900">No known allergies</p>
                      )}
                    </div>
                    <div>
                      <p className="text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Medical Conditions
                      </p>
                      {selectedStudent.medicalInfo.conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.medicalInfo.conditions.map((condition, index) => (
                            <span key={index} className="px-3 py-1 bg-red-200 text-red-900 rounded-full">
                              {condition}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-red-900">No medical conditions</p>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-red-200 pt-4">
                    <p className="text-red-700 mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-red-700 mb-1">Name</p>
                        <p className="text-red-900">{selectedStudent.medicalInfo.emergencyContact}</p>
                      </div>
                      <div>
                        <p className="text-red-700 mb-1">Phone</p>
                        <p className="text-red-900">{selectedStudent.medicalInfo.emergencyPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div>
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Parent/Guardian Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 mb-1">Father's Name</p>
                      <p className="text-gray-900">{selectedStudent.fatherName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Father's Occupation</p>
                      <p className="text-gray-900">{selectedStudent.fatherOccupation || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Mother's Name</p>
                      <p className="text-gray-900">{selectedStudent.motherName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Mother's Occupation</p>
                      <p className="text-gray-900">{selectedStudent.motherOccupation || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Guardian's Name</p>
                      <p className="text-gray-900">{selectedStudent.guardianName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Guardian's Occupation</p>
                      <p className="text-gray-900">{selectedStudent.guardianOccupation || '-'}</p>
                    </div>
                    <div className="col-span-1 md:col-span-2 border-t border-gray-200 mt-2 pt-4">
                      <p className="text-gray-500 mb-2 font-medium">Contact Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-gray-500">Primary Phone</p>
                            <p className="text-gray-900">{selectedStudent.phone || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-gray-500">Emergency Contact</p>
                            <p className="text-gray-900">{selectedStudent.emergencyContactNumber || selectedStudent.phone || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-gray-500">Email ID</p>
                            <p className="text-gray-900">{selectedStudent.email || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-gray-500">Address</p>
                            <p className="text-gray-900">{selectedStudent.address || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div className="mt-8">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Academic Details
                </h3>
                <div className="bg-indigo-50 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-indigo-700 mb-1">Academic Year</p>
                      <p className="text-indigo-900">{selectedStudent.academicYear || '-'}</p>
                    </div>
                    <div>
                      <p className="text-indigo-700 mb-1">Admission Date</p>
                      <p className="text-indigo-900">{selectedStudent.admissionDate || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Records */}
              {selectedStudent.documents && Object.keys(selectedStudent.documents).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Document Records
                  </h3>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedStudent.documents).map(([key, doc]: [string, any]) => (
                        <div key={key} className="flex items-center gap-3">
                          {doc.file ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-500" />}
                          <span className="text-gray-800 capitalize truncate">{doc.name || key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Confirm Delete</h2>
              <p className="text-center text-gray-600 mb-8">
                Are you sure you want to delete the student <strong>{studentToDelete?.name}</strong>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-500/20"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { studentService } from '../utils/centralDataService';
import { useAuth } from '../contexts/AuthContext';

interface AdmissionFormProps {
  student: any;
  onBack: () => void;
  onSave: (data: any) => Promise<void> | void;
}



export function AdmissionForm({ student, onBack, onSave }: AdmissionFormProps) {
  const { user } = useAuth();
  const { uniqueClasses, sectionsForClass } = useAcademicClasses();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: student?.name || '',
    admissionNo: student?.admissionNo || '',
    dob: student?.dob || '',
    gender: student?.gender || 'Male',
    bloodGroup: student?.bloodGroup || '',
    fatherName: student?.fatherName || '',
    motherName: student?.motherName || '',
    guardianName: student?.guardianName || '',
    fatherOccupation: student?.fatherOccupation || '',
    motherOccupation: student?.motherOccupation || '',
    guardianOccupation: student?.guardianOccupation || '',
    parentName: student?.parentName || '', // Kept for backwards compatibility
    phone: student?.phone || '',
    emergencyContactNumber: student?.emergencyContactNumber || '',
    email: student?.email || '', // Student Login Email
    parentEmail: student?.parentEmail || '', // Guardian Email
    address: student?.address || '',
    classApplied: student?.classApplied || student?.class || '',
    classAllotted: student?.classAllotted || student?.class || '',
    section: student?.section || 'A',
    rollNo: student?.rollNo || '',
    status: student?.status || (student ? 'admitted' : 'enquiry'),
    admissionDate: student?.admissionDate || new Date().toISOString().split('T')[0],
    academicYear: student?.academicYear || '2024-2025',
  });



  // Auto-suggest roll number when class, section or academic year changes
  useEffect(() => {
    if (!student && formData.classAllotted && formData.section && formData.academicYear) {
      const resolvedSchoolId = user?.school_id?.trim() || sessionStorage.getItem('active_school_id')?.trim() || '';

      // Ensure school context is available before querying Firestore
      if (resolvedSchoolId && sessionStorage.getItem('active_school_id') !== resolvedSchoolId) {
        sessionStorage.setItem('active_school_id', resolvedSchoolId);
      }
      if (!resolvedSchoolId) return;

      studentService.getNextRollNumber(formData.classAllotted, formData.section, formData.academicYear)
        .then(nextRoll => {
          setFormData(prev => ({ ...prev, rollNo: nextRoll }));
        })
        .catch(err => console.warn('Could not auto-suggest roll number:', err));
    }
  }, [formData.classAllotted, formData.section, formData.academicYear, student, user]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const resolvedSchoolId = user?.school_id?.trim() || sessionStorage.getItem('active_school_id')?.trim() || '';

    // Ensure school context is available before any Firestore operation
    if (resolvedSchoolId && sessionStorage.getItem('active_school_id') !== resolvedSchoolId) {
      sessionStorage.setItem('active_school_id', resolvedSchoolId);
    }
    if (!resolvedSchoolId) {
      alert('School context is not available yet. Please wait a moment and try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Validate Roll Number Uniqueness
      let isUnique = true;
      try {
        isUnique = await studentService.isRollNumberUnique(
          formData.rollNo,
          formData.classAllotted || formData.classApplied,
          formData.section,
          formData.academicYear,
          student?.id
        );
      } catch (err) {
        console.warn('Roll number uniqueness check failed (proceeding with save):', err);
      }

      if (!isUnique) {
        alert(`Error: Roll Number "${formData.rollNo}" already exists in ${formData.classAllotted || formData.classApplied} - ${formData.section} for academic year ${formData.academicYear}. Please use a unique roll number.`);
        return;
      }

      // Documents are now optional as per user request

      await onSave({
        ...formData,
      });
    } catch (error: any) {
      console.error('Admission submit error:', error);
      alert(`Failed to save admission: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };



  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-gray-900 mb-2">
            {student ? 'Edit Admission' : 'New Admission'}
          </h1>
          <p className="text-gray-600">Fill in the student details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Student Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Blood Group *</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Admission Number {student && '(Read-only)'}</label>
              <input
                type="text"
                name="admissionNo"
                value={formData.admissionNo}
                onChange={handleChange}
                readOnly={!!student}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${student ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="Auto-generated (includes School Code)"
              />
              {!student && (
                <p className="mt-1 text-xs text-gray-500 italic">
                    Note: Prefixed with School Code.
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Roll Number</label>
              <input
                type="text"
                name="rollNo"
                value={formData.rollNo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Suggested: e.g. 031"
              />
              <p className="mt-1 text-xs text-gray-500 italic">Auto-suggested based on class strength.</p>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Student Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="student@school.com"
              />
              <p className="mt-1 text-xs text-gray-500">Only needed for student portal access.</p>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Parent/Guardian Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Father Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter father's name"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Father Occupation</label>
              <input
                type="text"
                name="fatherOccupation"
                value={formData.fatherOccupation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter father's occupation"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Mother Name</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter mother's name"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Mother Occupation</label>
              <input
                type="text"
                name="motherOccupation"
                value={formData.motherOccupation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter mother's occupation"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Guardian Name (If applicable)</label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter guardian's name"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Guardian Occupation</label>
              <input
                type="text"
                name="guardianOccupation"
                value={formData.guardianOccupation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter guardian's occupation"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Primary Parent Name (For backwards compatibility/display) *</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter primary contact name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Primary Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                required
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 9876543210"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Emergency Contact Number</label>
              <input
                type="tel"
                name="emergencyContactNumber"
                value={formData.emergencyContactNumber}
                onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 9876543210"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Guardian Email (For Login) *</label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="parent@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">Used for parent portal login.</p>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter address"
              />
            </div>
          </div>
        </div>

        {/* Admission Details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Admission Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Academic Year *</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2024-2025"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Admission Date</label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Class Applied For *</label>
              <select
                name="classApplied"
                value={formData.classApplied}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Class</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Class Allotted</label>
              <select
                name="classAllotted"
                value={formData.classAllotted}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Not Allotted Yet</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Section *</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Section</option>
                {sectionsForClass(formData.classAllotted || formData.classApplied).map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Roll Number *</label>
              <input
                type="text"
                name="rollNo"
                value={formData.rollNo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter roll number"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="enquiry">Enquiry</option>
                <option value="in-process">In Process</option>
                <option value="confirmed">Confirmed</option>
                <option value="admitted">Admitted</option>
              </select>
            </div>
          </div>
        </div>



        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Saving...' : (student ? 'Update Admission' : 'Create Admission')}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form >
    </div >
  );
}
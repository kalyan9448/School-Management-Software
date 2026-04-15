import { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  Check,
  AlertCircle,
  ChevronDown,
  Save,
  Loader,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  examScoreService,
  studentService,
  classService,
  subjectService,
  notificationService,
  ExamScore,
  Student,
} from '../utils/centralDataService';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

interface MarksRow {
  studentId: string;
  studentName: string;
  rollNo: string;
  marksObtained: number | '';
  totalMarks: number | '';
  tempId?: string;
}

export function TeacherMarksUpload() {
  const { user } = useAuth();
  const { schoolId } = useTenant();

  // Selection state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState<'Unit Test' | 'Mid' | 'Final'>('Unit Test');

  // Data state
  const [classes, setClasses] = useState<Array<{ id: string; class: string }>>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<MarksRow[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const allClasses = await classService.getAll();
        setClasses(allClasses.map(c => ({ id: c.id, class: c.class || `Class ${c.id}` })));
      } catch (error) {
        console.error('Error loading classes:', error);
        setErrorMessage('Failed to load classes');
      }
    };
    loadClasses();
  }, []);

  // Load sections when class is selected
  useEffect(() => {
    if (selectedClass) {
      // Extract unique sections for the selected class
      const uniqueSections = ['A', 'B', 'C', 'D', 'E']; // Common sections
      setSections(uniqueSections);
      setSelectedSection('');
    }
  }, [selectedClass]);

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const allSubjects = await subjectService.getAll();
        setSubjects(allSubjects.map(s => ({ id: s.id, name: s.name || 'Unnamed' })));
      } catch (error) {
        console.error('Error loading subjects:', error);
      }
    };
    loadSubjects();
  }, []);

  // Load students when class and section are selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass || !selectedSection) {
        setStudents([]);
        setMarksData([]);
        return;
      }

      try {
        setLoading(true);
        const classData = classes.find(c => c.id === selectedClass);
        if (!classData) return;

        const classStudents = await studentService.getByClass(classData.class, selectedSection);
        setStudents(classStudents);

        // Initialize marks data with empty marks
        const initialMarks: MarksRow[] = classStudents.map(student => ({
          studentId: student.id,
          studentName: student.name || 'Unknown',
          rollNo: student.rollNo || '-',
          marksObtained: '',
          totalMarks: '',
          tempId: Math.random().toString(),
        }));
        setMarksData(initialMarks);
        setErrorMessage('');
      } catch (error) {
        console.error('Error loading students:', error);
        setErrorMessage('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass, selectedSection, classes]);

  // Update marks for a student
  const updateMarks = (index: number, field: 'marksObtained' | 'totalMarks', value: string) => {
    const updated = [...marksData];
    updated[index][field] = value ? parseFloat(value) : '';
    setMarksData(updated);
  };

  // Save all marks
  const handleSaveMarks = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject || !user) {
      setErrorMessage('Please select class, section, and subject');
      return;
    }

    // Validate all entries have marks
    const invalidRows = marksData.filter(
      row => row.marksObtained === '' || row.totalMarks === '' || row.marksObtained > row.totalMarks
    );

    if (invalidRows.length > 0) {
      setErrorMessage(`${invalidRows.length} student(s) have incomplete or invalid marks`);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const classData = classes.find(c => c.id === selectedClass);
      if (!classData) throw new Error('Selected class not found');

      // Create exam scores for each student
      const scores: Partial<ExamScore>[] = marksData.map(row => ({
        school_id: schoolId,
        studentId: row.studentId,
        classId: selectedClass,
        sectionId: selectedSection,
        subjectId: selectedSubject,
        examType: examType,
        marksObtained: row.marksObtained as number,
        totalMarks: row.totalMarks as number,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      }));

      const createdScores = await examScoreService.createBulk(scores);

      // Notify parents
      for (const score of createdScores) {
        const student = students.find(s => s.id === score.studentId);
        if (student?.parentId) {
          await notificationService.create({
            userId: student.parentId,
            type: 'exam',
            title: 'Exam Marks Released',
            message: `${student.name} scored ${score.marksObtained}/${score.totalMarks} (${score.percentage}%) in ${selectedSubject}`,
            date: new Date().toISOString(),
          });
        }
      }

      setSuccessMessage(`Successfully saved marks for ${createdScores.length} students`);
      setMarksData([]); // Clear form
      setSelectedClass('');
      setSelectedSection('');
      setSelectedSubject('');
    } catch (error) {
      console.error('Error saving marks:', error);
      setErrorMessage('Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    if (!marksData.length) {
      setErrorMessage('Please select a class first');
      return;
    }

    const headers = ['Student Name', 'Roll No', 'Marks Obtained', 'Total Marks'];
    const rows = marksData.map(row => [
      row.studentName,
      row.rollNo,
      '',
      '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-template-${selectedClass}-${selectedSection}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Delete a row
  const deleteRow = (index: number) => {
    const updated = marksData.filter((_, i) => i !== index);
    setMarksData(updated);
  };

  const isFormValid = selectedClass && selectedSection && selectedSubject && marksData.length > 0;
  const filledCount = marksData.filter(
    row => row.marksObtained !== '' && row.totalMarks !== ''
  ).length;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-600" />
          Upload Exam Scores
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Upload marks for students in a specific class and subject
        </p>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Selection Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Class Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.class}
              </option>
            ))}
          </select>
        </div>

        {/* Section Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Section <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select Section</option>
            {sections.map(section => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Subject</option>
            {subjects.map(subj => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Exam Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Exam Type <span className="text-red-500">*</span>
          </label>
          <select
            value={examType}
            onChange={e => setExamType(e.target.value as 'Unit Test' | 'Mid' | 'Final')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Unit Test">Unit Test</option>
            <option value="Mid">Mid</option>
            <option value="Final">Final</option>
          </select>
        </div>
      </div>

      {/* Template Download */}
      <div className="flex gap-2">
        <button
          onClick={handleDownloadTemplate}
          disabled={!isFormValid || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Marks Data Table */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : marksData.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">
              Student Marks ({filledCount}/{marksData.length} filled)
            </h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {showPreview ? (
            // Preview Mode
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Roll No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Marks Obtained
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Total Marks
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marksData.map((row, idx) => {
                    const percentage =
                      row.marksObtained !== '' && row.totalMarks !== ''
                        ? Math.round(((row.marksObtained as number) / (row.totalMarks as number)) * 100)
                        : '-';
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.studentName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.rollNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.marksObtained !== '' ? row.marksObtained : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.totalMarks !== '' ? row.totalMarks : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Edit Mode
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Roll No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Marks Obtained
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Total Marks
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marksData.map((row, idx) => (
                    <tr key={row.tempId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.rollNo}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.marksObtained}
                          onChange={e => updateMarks(idx, 'marksObtained', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Marks"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.totalMarks}
                          onChange={e => updateMarks(idx, 'totalMarks', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Total"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteRow(idx)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Save Button */}
      {marksData.length > 0 && !showPreview && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            onClick={() => {
              setSelectedClass('');
              setSelectedSection('');
              setSelectedSubject('');
              setMarksData([]);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Reset
          </button>
          <button
            onClick={handleSaveMarks}
            disabled={!isFormValid || saving || filledCount === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Marks
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

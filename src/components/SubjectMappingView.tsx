import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SubjectMappingForm, ClassData, SubjectMapping } from './SubjectMappingForm';
import { subjectService, subjectMappingService, academicYearService, SubjectMappingRecord } from '../utils/centralDataService';
import { useAuth } from '../contexts/AuthContext';

export default function SubjectMappingView({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editData, setEditData] = useState<any>(null);

  const [classDataList, setClassDataList] = useState<ClassData[]>([]);
  const { user } = useAuth();

  // Load mappings from Firestore
  useEffect(() => {
    const loadMappings = async () => {
      const schoolId = user?.school_id || sessionStorage.getItem('active_school_id');
      if (!schoolId) return;

      try {
        const activeYear = await academicYearService.getCurrent(schoolId);
        const mappings = await subjectMappingService.getAll(schoolId, activeYear?.id);

        // Group mappings by class + section
        const grouped = mappings.reduce((acc: Record<string, ClassData>, m: SubjectMappingRecord) => {
          const className = `${m.className} ${m.section}`;
          if (!acc[className]) {
            acc[className] = { class: className, subjects: [] };
          }
          acc[className].subjects.push({
            id: m.id,
            name: m.subjectName,
            teacher: m.teacherName,
            teacherEmail: m.teacherEmail,
            periods: m.periods
          });
          return acc;
        }, {} as Record<string, ClassData>);

        setClassDataList(Object.values(grouped));
      } catch (err) {
        console.error('Failed to load subject mappings:', err);
      }
    };
    loadMappings();
  }, [user]);

  // TODO: Persist classDataList changes to Firestore when a subject mapping service is available

  const handleSaveMapping = async (data: { class: string; section: string; subject: string; teacher: string; teacherEmail: string; periods: number }, originalId?: string) => {
    const schoolId = user?.school_id || sessionStorage.getItem('active_school_id') || '';
    const activeYear = await academicYearService.getCurrent(schoolId);
    
    if (!activeYear) {
      alert("No active academic year found. Please set an active academic year in the 'Academic Years' tab first.");
      return;
    }

    try {
      if (originalId) {
        await subjectMappingService.update(originalId, {
          subjectName: data.subject,
          teacherName: data.teacher,
          teacherEmail: data.teacherEmail,
          periods: data.periods
        });
      } else {
        await subjectMappingService.create({
          school_id: schoolId,
          academic_year_id: activeYear?.id || '',
          className: data.class,
          section: data.section,
          subjectName: data.subject,
          teacherName: data.teacher,
          teacherEmail: data.teacherEmail,
          periods: data.periods
        });
      }
      
      // Reload mappings to ensure UI is in sync with Firestore
      window.location.reload(); // Simple way to refresh state
    } catch (err) {
      console.error('Failed to save mapping:', err);
      alert('Failed to save mapping. Please try again.');
    }

    setView('list');
    setEditData(null);
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (confirm(`Are you sure you want to remove this mapping?`)) {
      try {
        await subjectMappingService.delete(mappingId);
        window.location.reload();
      } catch (err) {
        console.error('Failed to delete mapping:', err);
        alert('Failed to delete mapping. Please try again.');
      }
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setView('form');
  };

  const handleEdit = (classData: ClassData, subject: any) => {
    const parts = classData.class.split(' ');
    const sectionName = parts.pop() || '';
    const className = parts.join(' ');

    setEditData({
      class: className,
      section: sectionName,
      originalId: subject.id,
      subject: subject.name,
      teacher: subject.teacher,
      teacherEmail: subject.teacherEmail,
      periods: subject.periods,
    });
    setView('form');
  };

  // Calculate teacher workload from actual data
  const getTeacherWorkload = () => {
    const teacherMap = new Map<string, { subjects: Set<string>, classes: Set<string>, totalPeriods: number }>();

    classDataList.forEach((classData) => {
      classData.subjects.forEach((subject) => {
        if (!teacherMap.has(subject.teacher)) {
          teacherMap.set(subject.teacher, { subjects: new Set(), classes: new Set(), totalPeriods: 0 });
        }
        const teacherData = teacherMap.get(subject.teacher)!;
        teacherData.subjects.add(subject.name);
        teacherData.classes.add(classData.class);
        teacherData.totalPeriods += subject.periods;
      });
    });

    return Array.from(teacherMap.entries()).map(([name, data]) => ({
      name,
      subjects: data.subjects.size,
      classes: data.classes.size,
      totalPeriods: data.totalPeriods,
    })).sort((a, b) => b.totalPeriods - a.totalPeriods);
  };

  // Get all unique classes that should have subjects
  const getUnassignedClasses = () => {
    const expectedSubjects = ['English', 'Mathematics', 'Science', 'Environmental Science'];
    const incomplete: string[] = [];

    classDataList.forEach((classData) => {
      const hasAllCore = expectedSubjects.some(subject =>
        classData.subjects.some(s => s.name === subject)
      );
      if (!hasAllCore || classData.subjects.length < 3) {
        incomplete.push(classData.class);
      }
    });

    return incomplete;
  };

  const teacherWorkload = getTeacherWorkload();
  const unassignedClasses = getUnassignedClasses();

  if (view === 'form') {
    return (
      <SubjectMappingForm
        initialData={editData}
        onSave={handleSaveMapping}
        onCancel={() => {
          setView('list');
          setEditData(null);
        }}
      />
    );
  }

  return (
    <div className={`${isEmbedded ? 'py-4' : 'p-8'} space-y-6`}>
      {!isEmbedded && (
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-gray-900 mb-2">Subject Mapping</h1>
            <p className="text-gray-600">Manage subject and teacher allocations for all classes</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Subject Mapping
          </button>
        </div>
      )}

      {isEmbedded && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 transition-all shadow-md font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Subject Mapping
          </button>
        </div>
      )}

      {/* Subject Mapping by Class */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Current Subject Mappings</h3>

        {classDataList.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <p>No subject mappings have been created yet.</p>
            <p className="text-sm mt-1">Click the "Add Subject Mapping" button to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classDataList.map((classData, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-gray-900 font-medium">{classData.class}</h4>
                  <span className="text-gray-600 text-sm">
                    {classData.subjects.length} subjects mapped
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600 text-sm">Subject</th>
                        <th className="px-4 py-2 text-left text-gray-600 text-sm">Teacher</th>
                        <th className="px-4 py-2 text-left text-gray-600 text-sm">Weekly Periods</th>
                        <th className="px-4 py-2 text-left text-gray-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {classData.subjects.map((subject, subIndex) => (
                        <tr key={subIndex} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{subject.name}</td>
                          <td className="px-4 py-3 text-gray-700">{subject.teacher}</td>
                          <td className="px-4 py-3 text-gray-700">{subject.periods} periods/week</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(classData, subject)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit Mapping"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteMapping((subject as any).id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Remove Mapping"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Workload Overview */}
      {teacherWorkload.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Teacher Workload Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherWorkload.map((teacher, index) => (
              <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-gray-900 font-medium mb-2">{teacher.name}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{teacher.subjects} subjects • {teacher.classes} classes</p>
                  <p className="text-purple-700 font-medium">{teacher.totalPeriods} periods/week</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unassigned Subjects Alert */}
      {unassignedClasses.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium mb-1">Attention Required</p>
              <p className="text-gray-700 text-sm">
                {unassignedClasses.length} class{unassignedClasses.length > 1 ? 'es' : ''} might have incomplete subject mappings (less than 3 subjects or missing core subjects).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
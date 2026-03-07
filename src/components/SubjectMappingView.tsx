import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SubjectMappingForm, ClassData, SubjectMapping } from './SubjectMappingForm';

export default function SubjectMappingView() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editData, setEditData] = useState<any>(null);

  const [classDataList, setClassDataList] = useState<ClassData[]>([]);

  // Load mappings from localStorage or initialize empty
  useEffect(() => {
    const storedMappings = localStorage.getItem('school_subject_mappings');
    if (storedMappings) {
      setClassDataList(JSON.parse(storedMappings));
    }
  }, []);

  // Save to localStorage whenever classDataList changes
  useEffect(() => {
    // Only save if we actually have data, or if we legitimately deleted the last one.
    // A better approach is to always sync, but wait until initial load completes.
    // Since we handle initial load in a separate effect, standard reactive sync is fine.
    if (classDataList.length >= 0) {
      localStorage.setItem('school_subject_mappings', JSON.stringify(classDataList));
    }
  }, [classDataList]);

  const handleSaveMapping = (data: { class: string; section: string; subject: string; teacher: string; periods: number }, originalSubject?: string) => {
    const className = `${data.class} ${data.section}`;
    const newSubject: SubjectMapping = {
      name: data.subject,
      teacher: data.teacher,
      periods: data.periods,
    };

    setClassDataList((prevData) => {
      // Find if we are editing an existing subject
      if (originalSubject) {
        return prevData.map((classItem) => {
          if (classItem.class === className) {
            return {
              ...classItem,
              subjects: classItem.subjects.map((subject) =>
                subject.name === originalSubject ? newSubject : subject
              ),
            };
          }
          return classItem;
        });
      }

      // Add a new subject mapping
      const existingClassIndex = prevData.findIndex((item) => item.class === className);
      if (existingClassIndex >= 0) {
        // Class exists, add subject to it
        const updatedData = [...prevData];
        // Ensure subject name is unique per class
        const subjectExists = updatedData[existingClassIndex].subjects.some(s => s.name === newSubject.name);
        if (subjectExists) {
          alert("This subject is already mapped for this class. Please edit the existing mapping or choose a different subject.");
          return prevData;
        }

        updatedData[existingClassIndex].subjects.push(newSubject);
        return updatedData;
      } else {
        // Class doesn't exist, create new class with subject
        return [...prevData, { class: className, subjects: [newSubject] }];
      }
    });

    setView('list');
    setEditData(null);
  };

  const handleDeleteMapping = (className: string, subjectName: string) => {
    if (confirm(`Are you sure you want to remove ${subjectName} from ${className}?`)) {
      setClassDataList((prevData) => {
        return prevData
          .map((classItem) => {
            if (classItem.class === className) {
              return {
                ...classItem,
                subjects: classItem.subjects.filter((subject) => subject.name !== subjectName),
              };
            }
            return classItem;
          })
          .filter((classItem) => classItem.subjects.length > 0); // Remove classes with no subjects
      });
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setView('form');
  };

  const handleEdit = (classData: ClassData, subject: SubjectMapping) => {
    const parts = classData.class.split(' ');
    const sectionName = parts.pop() || '';
    const className = parts.join(' ');

    setEditData({
      class: className,
      section: sectionName,
      originalSubject: subject.name,
      subject: subject.name,
      teacher: subject.teacher,
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
    <div className="p-8 space-y-6">
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
                                onClick={() => handleDeleteMapping(classData.class, subject.name)}
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
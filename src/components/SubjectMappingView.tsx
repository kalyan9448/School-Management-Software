import { Plus, Edit, Trash2, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface SubjectMapping {
  name: string;
  teacher: string;
  periods: number;
}

interface ClassData {
  class: string;
  subjects: SubjectMapping[];
}

export default function SubjectMappingView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [formData, setFormData] = useState({
    class: '',
    section: '',
    subject: '',
    teacher: '',
    weeklyPeriods: '',
  });

  const [classDataList, setClassDataList] = useState<ClassData[]>([
    {
      class: 'Nursery A',
      subjects: [
        { name: 'English', teacher: 'Ms. Priya Sharma', periods: 5 },
        { name: 'Mathematics', teacher: 'Mr. Raj Kumar', periods: 5 },
        { name: 'Environmental Science', teacher: 'Ms. Anjali Singh', periods: 3 },
        { name: 'Art & Craft', teacher: 'Ms. Neha Gupta', periods: 2 },
      ],
    },
    {
      class: 'LKG A',
      subjects: [
        { name: 'English', teacher: 'Ms. Kavita Desai', periods: 5 },
        { name: 'Mathematics', teacher: 'Mr. Amit Verma', periods: 5 },
        { name: 'Environmental Science', teacher: 'Ms. Ritu Kapoor', periods: 3 },
        { name: 'Music', teacher: 'Mr. Suresh Malhotra', periods: 2 },
      ],
    },
    {
      class: 'UKG A',
      subjects: [
        { name: 'English', teacher: 'Ms. Deepa Nair', periods: 6 },
        { name: 'Mathematics', teacher: 'Mr. Vikram Joshi', periods: 6 },
        { name: 'Science', teacher: 'Ms. Pooja Reddy', periods: 4 },
        { name: 'Computer', teacher: 'Mr. Rahul Mehta', periods: 2 },
      ],
    },
  ]);

  const classes = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
  const sections = ['A', 'B', 'C'];
  const subjects = [
    'English',
    'Mathematics',
    'Science',
    'Environmental Science',
    'Hindi',
    'Computer',
    'Art & Craft',
    'Music',
    'Physical Education',
    'Dance',
  ];
  const teachers = [
    'Ms. Priya Sharma',
    'Mr. Raj Kumar',
    'Ms. Anjali Singh',
    'Ms. Neha Gupta',
    'Ms. Kavita Desai',
    'Mr. Amit Verma',
    'Ms. Ritu Kapoor',
    'Mr. Suresh Malhotra',
    'Ms. Deepa Nair',
    'Mr. Vikram Joshi',
    'Ms. Pooja Reddy',
    'Mr. Rahul Mehta',
  ];

  const handleAddMapping = () => {
    if (!formData.class || !formData.section || !formData.subject || !formData.teacher || !formData.weeklyPeriods) {
      return;
    }

    const className = `${formData.class} ${formData.section}`;
    const newSubject: SubjectMapping = {
      name: formData.subject,
      teacher: formData.teacher,
      periods: parseInt(formData.weeklyPeriods),
    };

    setClassDataList((prevData) => {
      const existingClassIndex = prevData.findIndex((item) => item.class === className);
      
      if (existingClassIndex >= 0) {
        // Class exists, add subject to it
        const updatedData = [...prevData];
        updatedData[existingClassIndex].subjects.push(newSubject);
        return updatedData;
      } else {
        // Class doesn't exist, create new class with subject
        return [...prevData, { class: className, subjects: [newSubject] }];
      }
    });

    setFormData({
      class: '',
      section: '',
      subject: '',
      teacher: '',
      weeklyPeriods: '',
    });
    setShowAddModal(false);
  };

  const handleEditMapping = () => {
    if (!formData.subject || !formData.teacher || !formData.weeklyPeriods) {
      return;
    }

    setClassDataList((prevData) => {
      return prevData.map((classItem) => {
        if (classItem.class === editData.class) {
          return {
            ...classItem,
            subjects: classItem.subjects.map((subject) =>
              subject.name === editData.originalSubject
                ? { name: formData.subject, teacher: formData.teacher, periods: parseInt(formData.weeklyPeriods) }
                : subject
            ),
          };
        }
        return classItem;
      });
    });

    setShowEditModal(false);
    setEditData(null);
    setFormData({
      class: '',
      section: '',
      subject: '',
      teacher: '',
      weeklyPeriods: '',
    });
  };

  const handleDeleteMapping = (className: string, subjectName: string) => {
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
    }));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Subject Mapping</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subject Mapping
        </button>
      </div>

      {/* Subject Mapping by Class */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Current Subject Mappings</h3>
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
                              onClick={() => {
                                setEditData({ class: classData.class, originalSubject: subject.name, subject: subject.name, teacher: subject.teacher, periods: subject.periods });
                                setFormData({ subject: subject.name, teacher: subject.teacher, weeklyPeriods: subject.periods });
                                setShowEditModal(true);
                              }}
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
      </div>

      {/* Teacher Workload Overview */}
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

      {/* Unassigned Subjects Alert */}
      {unassignedClasses.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium mb-1">Attention Required</p>
              <p className="text-gray-700 text-sm">
                {unassignedClasses.length} classes have incomplete subject mappings. Please assign teachers to all subjects.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Mapping Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-medium">Add Subject Mapping</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Class</label>
                <select 
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Section</label>
                <select 
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Section</option>
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Subject</label>
                <select 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Teacher</label>
                <select 
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Weekly Periods</label>
                <input 
                  type="number"
                  value={formData.weeklyPeriods}
                  onChange={(e) => setFormData({ ...formData, weeklyPeriods: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="mt-6">
              <button 
                onClick={handleAddMapping}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Mapping Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-medium">Edit Subject Mapping</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Class</label>
                <input 
                  type="text"
                  value={editData ? editData.class : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Subject</label>
                <select 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Teacher</label>
                <select 
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Weekly Periods</label>
                <input 
                  type="number"
                  value={formData.weeklyPeriods}
                  onChange={(e) => setFormData({ ...formData, weeklyPeriods: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="mt-6">
              <button 
                onClick={handleEditMapping}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Update Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
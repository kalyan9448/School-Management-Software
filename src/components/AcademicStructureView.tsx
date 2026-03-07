import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen, Users, GraduationCap, Copy, ArrowRightLeft } from 'lucide-react';
import { StudentPromotionTool } from './StudentPromotionTool.tsx';
import SubjectMappingView from './SubjectMappingView';
import { AcademicYear, ClassSection, DEFAULT_YEARS, DEFAULT_CLASSES } from '../utils/classUtils';

export function AcademicStructureView() {
  const [activeTab, setActiveTab] = useState<'years' | 'classes' | 'subject-mapping' | 'promotion'>('years');
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);

  // Modal state
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');
  const [baseYearId, setBaseYearId] = useState(''); // Which year to clone structure from

  const [newClassName, setNewClassName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [selectedClassNameForSection, setSelectedClassNameForSection] = useState('');

  useEffect(() => {
    const storedYears = localStorage.getItem('school_academic_years');
    if (storedYears) {
      setAcademicYears(JSON.parse(storedYears));
    } else {
      setAcademicYears(DEFAULT_YEARS);
      localStorage.setItem('school_academic_years', JSON.stringify(DEFAULT_YEARS));
    }

    // Default load classes for "active" year on component mount just for the classes tab demo
    const activeY = DEFAULT_YEARS.find(y => y.status === 'active')?.id || '2024-2025';
    const storedClasses = localStorage.getItem(`school_class_sections_${activeY}`);
    if (storedClasses) {
      setClassSections(JSON.parse(storedClasses));
    } else {
      setClassSections(DEFAULT_CLASSES);
      localStorage.setItem(`school_class_sections_${activeY}`, JSON.stringify(DEFAULT_CLASSES));
    }
  }, []);

  const handleAddAcademicYear = () => {
    if (!newYearName || !newYearStart || !newYearEnd) {
      alert("Please fill all fields.");
      return;
    }

    const newYear: AcademicYear = {
      id: newYearName,
      name: newYearName,
      startDate: newYearStart,
      endDate: newYearEnd,
      status: 'upcoming'
    };

    const updatedYears = [...academicYears, newYear];
    setAcademicYears(updatedYears);
    localStorage.setItem('school_academic_years', JSON.stringify(updatedYears));

    // Duplicate structure if a base year is selected
    if (baseYearId) {
      // Copy Classes
      let baseClasses = localStorage.getItem(`school_class_sections_${baseYearId}`);
      if (!baseClasses && baseYearId === '2024-2025') baseClasses = JSON.stringify(DEFAULT_CLASSES);
      if (baseClasses) {
        localStorage.setItem(`school_class_sections_${newYearName}`, baseClasses);
      }

      // Copy Subject Mappings (handles legacy un-suffixed key if running for first time)
      let baseSubjects = localStorage.getItem(`school_subject_mappings_${baseYearId}`);
      if (!baseSubjects) baseSubjects = localStorage.getItem('school_subject_mappings');
      if (baseSubjects) {
        localStorage.setItem(`school_subject_mappings_${newYearName}`, baseSubjects);
      }
    }

    setShowAddYearModal(false);
    setNewYearName('');
    setNewYearStart('');
    setNewYearEnd('');
    setBaseYearId('');
  };

  const handleAddClass = () => {
    if (!newClassName || !newSectionName || !newClassTeacher) {
      alert("Please fill all fields.");
      return;
    }

    const newClassSection: ClassSection = {
      id: Date.now().toString(),
      className: newClassName,
      section: newSectionName,
      classTeacher: newClassTeacher,
      students: 0,
      capacity: 30
    };

    const activeY = academicYears.find(y => y.status === 'active')?.id || '2024-2025';
    const updatedClasses = [...classSections, newClassSection];
    setClassSections(updatedClasses);
    localStorage.setItem(`school_class_sections_${activeY}`, JSON.stringify(updatedClasses));

    setShowAddClassModal(false);
    setNewClassName('');
    setNewSectionName('');
    setNewClassTeacher('');
  };

  const handleAddSection = () => {
    if (!newSectionName || !newClassTeacher || !selectedClassNameForSection) {
      alert("Please fill all fields.");
      return;
    }

    const newClassSection: ClassSection = {
      id: Date.now().toString(),
      className: selectedClassNameForSection,
      section: newSectionName,
      classTeacher: newClassTeacher,
      students: 0,
      capacity: 30
    };

    const activeY = academicYears.find(y => y.status === 'active')?.id || '2024-2025';
    const updatedClasses = [...classSections, newClassSection];
    setClassSections(updatedClasses);
    localStorage.setItem(`school_class_sections_${activeY}`, JSON.stringify(updatedClasses));

    setShowAddSectionModal(false);
    setNewSectionName('');
    setNewClassTeacher('');
    setSelectedClassNameForSection('');
  };



  if (activeTab === 'promotion') {
    return (
      <div className="p-8">
        <button
          onClick={() => setActiveTab('years')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Academic Structure
        </button>
        <StudentPromotionTool academicYears={academicYears} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Academic Structure</h2>
          <p className="text-gray-600">Manage academic years, classes, sections, and subjects</p>
        </div>

        {activeTab === 'years' && (
          <button
            onClick={() => setActiveTab('promotion')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all font-medium"
          >
            <ArrowRightLeft className="w-5 h-5" />
            Student Promotion Tool
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab('years')}
          className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'years'
            ? 'border-purple-600 text-purple-600 font-medium'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          Academic Years
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'classes'
            ? 'border-purple-600 text-purple-600 font-medium'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          Classes & Sections
        </button>
        <button
          onClick={() => setActiveTab('subject-mapping')}
          className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'subject-mapping'
            ? 'border-purple-600 text-purple-600 font-medium'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          Subject Mapping
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Academic Years Tab */}
        {activeTab === 'years' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 font-semibold text-lg">Manage Academic Years</h3>
              <button
                onClick={() => setShowAddYearModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Academic Year
              </button>
            </div>

            <div className="grid gap-4">
              {academicYears.map((year) => (
                <div key={year.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${year.status === 'active' ? 'bg-green-100 text-green-600' :
                        year.status === 'upcoming' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">{year.name}</h4>
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-medium ${year.status === 'active'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : year.status === 'upcoming'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                          >
                            {year.status.charAt(0).toUpperCase() + year.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-1">
                          {new Date(year.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(year.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button className="p-2 text-gray-400 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors" title="Edit Year">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors" title="Delete Year">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 font-semibold text-lg">Classes & Sections (Active Year)</h3>
              <button
                onClick={() => setShowAddClassModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-sm transition-all font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New Class
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(
                classSections.reduce((acc, curr) => {
                  if (!acc[curr.className]) acc[curr.className] = [];
                  acc[curr.className].push(curr);
                  return acc;
                }, {} as Record<string, ClassSection[]>)
              ).map(([className, sections]) => (
                <div key={className} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 border border-purple-200 rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{className}</h4>
                        <p className="text-sm text-gray-500 font-medium">
                          {sections.length} Section{sections.length !== 1 ? 's' : ''} • {sections.reduce((sum, sec) => sum + sec.students, 0)} Total Students
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClassNameForSection(className);
                        setShowAddSectionModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Section
                    </button>
                  </div>

                  <div className="p-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3 bg-gray-50/30">
                    {sections.map((classSection) => (
                      <div key={classSection.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:border-purple-300 transition-all relative group hover:shadow-md">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-gray-400 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors" title="Edit Section">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors" title="Delete Section">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                              <Users className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-gray-900 font-bold text-lg">
                                Section {classSection.section}
                              </h4>
                              <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                                <span className="text-gray-400 font-medium">Teacher:</span>
                                <span className="font-medium text-gray-800">{classSection.classTeacher}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 pt-5 border-t border-gray-100">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 font-medium">Occupancy</span>
                            <span className="font-bold text-gray-900">{classSection.students} <span className="text-gray-400 font-normal">/ {classSection.capacity}</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${(classSection.students / classSection.capacity) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject Mapping Tab */}
        {activeTab === 'subject-mapping' && (
          <SubjectMappingView isEmbedded={true} />
        )}
      </div>

      {/* Add Academic Year Modal */}
      {showAddYearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Create Academic Year</h3>
              <p className="text-sm text-gray-500 mt-1">Set up a new academic year and clone existing structure.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year Name (e.g., 2025-2026)</label>
                <input
                  type="text"
                  value={newYearName}
                  onChange={e => setNewYearName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="2025-2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newYearStart}
                    onChange={e => setNewYearStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newYearEnd}
                    onChange={e => setNewYearEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Copy className="w-4 h-4 text-gray-400" />
                  Clone Structure From
                </label>
                <p className="text-xs text-gray-500 mb-2">Automatically copy classes, sections, and teacher allocations from a previous year.</p>
                <select
                  value={baseYearId}
                  onChange={e => setBaseYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50"
                >
                  <option value="">Start Fresh (No copying)</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddYearModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAcademicYear}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Add New Class</h3>
              <p className="text-sm text-gray-500 mt-1">Create a new class group with an initial section.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name (e.g., Class 2)</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Class 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Section (e.g., A)</label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
                <input
                  type="text"
                  value={newClassTeacher}
                  onChange={e => setNewClassTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Teacher Name"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddClassModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && selectedClassNameForSection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Add Section to {selectedClassNameForSection}</h3>
              <p className="text-sm text-gray-500 mt-1">Create a new section for this class.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name (e.g., C)</label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="C"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
                <input
                  type="text"
                  value={newClassTeacher}
                  onChange={e => setNewClassTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Teacher Name"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

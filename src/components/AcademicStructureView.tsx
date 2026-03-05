import { useState } from 'react';
import { Plus, Edit, Trash2, BookOpen, Users, GraduationCap } from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
}

interface ClassSection {
  id: string;
  className: string;
  section: string;
  classTeacher: string;
  students: number;
  capacity: number;
}

export function AcademicStructureView() {
  const [activeTab, setActiveTab] = useState<'years' | 'classes' | 'subjects'>('years');
  
  const [academicYears] = useState<AcademicYear[]>([
    { id: '1', name: '2024-2025', startDate: '2024-04-01', endDate: '2025-03-31', status: 'active' },
    { id: '2', name: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', status: 'completed' },
    { id: '3', name: '2025-2026', startDate: '2025-04-01', endDate: '2026-03-31', status: 'upcoming' },
  ]);

  const [classSections] = useState<ClassSection[]>([
    { id: '1', className: 'Nursery', section: 'A', classTeacher: 'Ms. Sarah Johnson', students: 25, capacity: 30 },
    { id: '2', className: 'Nursery', section: 'B', classTeacher: 'Ms. Anjali Verma', students: 22, capacity: 30 },
    { id: '3', className: 'LKG', section: 'A', classTeacher: 'Ms. Emily Davis', students: 28, capacity: 30 },
    { id: '4', className: 'LKG', section: 'B', classTeacher: 'Ms. Sarah Johnson', students: 26, capacity: 30 },
    { id: '5', className: 'UKG', section: 'A', classTeacher: 'Ms. Emily Davis', students: 30, capacity: 30 },
    { id: '6', className: 'UKG', section: 'B', classTeacher: 'Ms. Priya Sharma', students: 27, capacity: 30 },
  ]);

  const subjects = [
    { id: '1', name: 'English', code: 'ENG', type: 'Core' },
    { id: '2', name: 'Mathematics', code: 'MATH', type: 'Core' },
    { id: '3', name: 'Science', code: 'SCI', type: 'Core' },
    { id: '4', name: 'Hindi', code: 'HIN', type: 'Core' },
    { id: '5', name: 'Computer Science', code: 'CS', type: 'Optional' },
    { id: '6', name: 'Art & Craft', code: 'ART', type: 'Optional' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Academic Structure</h2>
          <p className="text-gray-600">Manage academic years, classes, sections, and subjects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('years')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'years'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Academic Years
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'classes'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Classes & Sections
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'subjects'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Subjects
        </button>
      </div>

      {/* Academic Years Tab */}
      {activeTab === 'years' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-900">Academic Years</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus className="w-4 h-4" />
              Add Academic Year
            </button>
          </div>

          <div className="grid gap-4">
            {academicYears.map((year) => (
              <div key={year.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-gray-900">{year.name}</h4>
                      <p className="text-gray-600">
                        {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        year.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : year.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {year.status.charAt(0).toUpperCase() + year.status.slice(1)}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-purple-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes & Sections Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-900">Classes & Sections</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus className="w-4 h-4" />
              Add Class Section
            </button>
          </div>

          <div className="grid gap-4">
            {classSections.map((classSection) => (
              <div key={classSection.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-gray-900">
                        {classSection.className} - Section {classSection.section}
                      </h4>
                      <p className="text-gray-600">Class Teacher: {classSection.classTeacher}</p>
                      <p className="text-gray-500 text-sm">
                        Students: {classSection.students}/{classSection.capacity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(classSection.students / classSection.capacity) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((classSection.students / classSection.capacity) * 100)}% Full
                      </p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-purple-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-900">Subjects</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 text-gray-400 hover:text-purple-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4 className="text-gray-900 mb-1">{subject.name}</h4>
                <p className="text-gray-600 text-sm mb-2">Code: {subject.code}</p>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs ${
                    subject.type === 'Core' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {subject.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

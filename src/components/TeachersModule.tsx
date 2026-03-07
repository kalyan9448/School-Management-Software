import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, BookOpen, Calendar, User } from 'lucide-react';
import { Teacher, initialTeachers } from './TeachersData';
import { TeacherForm } from './TeacherForm';

export function TeachersModule() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load teachers from localStorage or use initial data
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const loadTeachers = () => {
      const storedTeachers = localStorage.getItem('school_teachers');
      if (storedTeachers) {
        setTeachers(JSON.parse(storedTeachers));
      } else {
        setTeachers(initialTeachers);
        localStorage.setItem('school_teachers', JSON.stringify(initialTeachers));
      }
    };
    loadTeachers();
  }, []);

  // Save teachers to localStorage whenever the array changes
  useEffect(() => {
    if (teachers.length > 0) {
      localStorage.setItem('school_teachers', JSON.stringify(teachers));
    }
  }, [teachers]);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this teacher?')) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setView('form');
  };

  const handleAdd = () => {
    setSelectedTeacher(null);
    setView('form');
  };

  const handleSaveTeacher = (teacherData: Teacher) => {
    if (selectedTeacher) {
      // Update existing
      setTeachers(teachers.map(t => t.id === teacherData.id ? teacherData : t));
    } else {
      // Add new
      setTeachers([...teachers, teacherData]);
    }
    setView('list');
    setSelectedTeacher(null);
  };

  if (view === 'form') {
    return (
      <TeacherForm
        teacher={selectedTeacher}
        onBack={() => setView('list')}
        onSave={handleSaveTeacher}
      />
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Teachers Management</h1>
        <p className="text-gray-600">Manage teaching staff and their assignments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Total Teachers</p>
              <p className="text-gray-900">{teachers.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Active</p>
              <p className="text-gray-900">{teachers.filter(t => t.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">On Leave</p>
              <p className="text-gray-900">{teachers.filter(t => t.status === 'on-leave').length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Subjects</p>
              <p className="text-gray-900">{new Set(teachers.map(t => t.subject)).size}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Teachers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                  {teacher.photo ? (
                    <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 mb-1">{teacher.name}</h3>
                  <p className="text-purple-600 mb-2">{teacher.subject}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs ${teacher.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                    }`}>
                    {teacher.status === 'active' ? 'Active' : 'On Leave'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(teacher)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{teacher.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{teacher.qualification}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined: {new Date(teacher.joiningDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-2">Assigned Classes:</p>
              <div className="flex flex-wrap gap-2">
                {teacher.classes.map((cls, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filteredTeachers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            No teachers found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
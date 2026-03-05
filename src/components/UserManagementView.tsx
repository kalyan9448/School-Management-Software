import { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, UserPlus, Users } from 'lucide-react';

export function UserManagementView() {
  const [activeTab, setActiveTab] = useState<'teachers' | 'staff' | 'parents'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');

  const teachers = [
    { id: '1', name: 'Ms. Sarah Johnson', employeeId: 'TEA001', subject: 'English', phone: '+91 98765 43210', email: 'sarah.j@school.com', status: 'active' },
    { id: '2', name: 'Ms. Emily Davis', employeeId: 'TEA002', subject: 'Mathematics', phone: '+91 98765 43211', email: 'emily.d@school.com', status: 'active' },
    { id: '3', name: 'Ms. Priya Sharma', employeeId: 'TEA003', subject: 'Science', phone: '+91 98765 43212', email: 'priya.s@school.com', status: 'active' },
    { id: '4', name: 'Ms. Anjali Verma', employeeId: 'TEA004', subject: 'Hindi', phone: '+91 98765 43213', email: 'anjali.v@school.com', status: 'active' },
    { id: '5', name: 'Mr. Rajesh Kumar', employeeId: 'TEA005', subject: 'Computer Science', phone: '+91 98765 43214', email: 'rajesh.k@school.com', status: 'active' },
  ];

  const staff = [
    { id: '1', name: 'Mr. Suresh Accountant', employeeId: 'ACC001', role: 'Accountant', phone: '+91 98765 43215', email: 'suresh.a@school.com', status: 'active' },
    { id: '2', name: 'Ms. Divya Coordinator', employeeId: 'CRD001', role: 'Academic Coordinator', phone: '+91 98765 43216', email: 'divya.c@school.com', status: 'active' },
    { id: '3', name: 'Mr. Anil Marketing', employeeId: 'MKT001', role: 'Marketing Manager', phone: '+91 98765 43217', email: 'anil.m@school.com', status: 'active' },
  ];

  const parents = [
    { id: '1', name: 'Mr. Rajesh Patel', relation: 'Father', student: 'Aarav Patel', phone: '+91 98765 43210', email: 'rajesh.p@email.com', status: 'active' },
    { id: '2', name: 'Mrs. Priya Sharma', relation: 'Mother', student: 'Diya Sharma', phone: '+91 98765 43211', email: 'priya.s@email.com', status: 'active' },
    { id: '3', name: 'Mr. Vikram Singh', relation: 'Father', student: 'Arjun Singh', phone: '+91 98765 43212', email: 'vikram.s@email.com', status: 'active' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage teachers, staff, and parents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Total Teachers</p>
              <h3 className="text-gray-900">{teachers.length}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Staff Members</p>
              <h3 className="text-gray-900">{staff.length}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Registered Parents</p>
              <h3 className="text-gray-900">{parents.length}</h3>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'teachers'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Teachers ({teachers.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Staff ({staff.length})
        </button>
        <button
          onClick={() => setActiveTab('parents')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'parents'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Parents ({parents.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Teachers Tab */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600">Employee ID</th>
                <th className="text-left px-6 py-3 text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-gray-600">Subject</th>
                <th className="text-left px-6 py-3 text-gray-600">Contact</th>
                <th className="text-left px-6 py-3 text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{teacher.employeeId}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{teacher.name}</p>
                      <p className="text-gray-500 text-sm">{teacher.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{teacher.subject}</td>
                  <td className="px-6 py-4 text-gray-600">{teacher.phone}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1 text-gray-400 hover:text-purple-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600">Employee ID</th>
                <th className="text-left px-6 py-3 text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-gray-600">Role</th>
                <th className="text-left px-6 py-3 text-gray-600">Contact</th>
                <th className="text-left px-6 py-3 text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{member.employeeId}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{member.name}</p>
                      <p className="text-gray-500 text-sm">{member.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{member.role}</td>
                  <td className="px-6 py-4 text-gray-600">{member.phone}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1 text-gray-400 hover:text-purple-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Parents Tab */}
      {activeTab === 'parents' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-gray-600">Relation</th>
                <th className="text-left px-6 py-3 text-gray-600">Student</th>
                <th className="text-left px-6 py-3 text-gray-600">Contact</th>
                <th className="text-left px-6 py-3 text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{parent.name}</p>
                      <p className="text-gray-500 text-sm">{parent.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{parent.relation}</td>
                  <td className="px-6 py-4 text-gray-900">{parent.student}</td>
                  <td className="px-6 py-4 text-gray-600">{parent.phone}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {parent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1 text-gray-400 hover:text-purple-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

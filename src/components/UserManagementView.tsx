import { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, Eye, Edit, Trash2, Users,
  MoreVertical, Shield, Mail, Phone, Calendar, CheckCircle2,
  XCircle, Clock, ChevronRight, Download, Trash
} from 'lucide-react';
import { initialTeachers } from './TeachersData';

interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Teacher' | 'Staff' | 'Parent' | 'Accountant' | 'Coordinator';
  status: 'Active' | 'Inactive' | 'Pending';
  lastActive: string;
  avatar?: string;
  employeeId?: string;
  relation?: string;
  student?: string;
}

export function UserManagementView() {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeDrawer, setActiveDrawer] = useState<{ type: 'view' | 'edit' | 'add', user: UnifiedUser | null } | null>(null);

  // Initialize data from localStorage or defaults
  useEffect(() => {
    const storedUsers = localStorage.getItem('school_unified_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Create initial unified users from existing data sources
      const initialUnified: UnifiedUser[] = [
        ...initialTeachers.map(t => ({
          id: t.id,
          name: t.name,
          email: t.email,
          phone: t.phone,
          role: 'Teacher' as const,
          status: 'Active' as const,
          lastActive: '2 hours ago',
          employeeId: t.employeeId || `TEA00${t.id}`
        })),
        {
          id: 'staff-1',
          name: 'Suresh Accountant',
          email: 'suresh.a@school.com',
          phone: '+91 98765 43215',
          role: 'Accountant',
          status: 'Active',
          lastActive: '10 mins ago',
          employeeId: 'ACC001'
        },
        {
          id: 'parent-1',
          name: 'Rajesh Patel',
          email: 'rajesh.p@email.com',
          phone: '+91 98765 43210',
          role: 'Parent',
          status: 'Active',
          lastActive: 'Yesterday',
          relation: 'Father',
          student: 'Aarav Patel'
        }
      ];
      setUsers(initialUnified);
      localStorage.setItem('school_unified_users', JSON.stringify(initialUnified));
    }
  }, []);

  // Save users to localStorage
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('school_unified_users', JSON.stringify(users));
    }
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = selectedRole === 'All' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'All' || user.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const toggleUserSelection = (id: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setSelectedUsers(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Teacher': return <GraduationCap className="w-4 h-4" />;
      case 'Parent': return <Users className="w-4 h-4" />;
      case 'Admin': return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* SaaS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 font-medium">Manage and audit all platform users & access levels</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Sessions', value: users.filter(u => u.status === 'Active').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Invites', value: users.filter(u => u.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Restricted', value: 0, icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -trangray-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 outline-none font-semibold text-gray-700"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Staff">Staff</option>
              <option value="Parent">Parent</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 outline-none font-semibold text-gray-700"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
            <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all">
              <Filter className="w-4 h-4" />
              Advanced
            </button>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 rounded-xl animate-in slide-in-from-top-2 duration-300">
            <span className="text-white font-semibold">
              {selectedUsers.size} users selected
            </span>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 text-white/90 hover:text-white font-medium transition-colors">
                Deactivate
              </button>
              <button className="px-4 py-1.5 text-rose-400 hover:text-rose-300 font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleAllSelection}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 transition-all cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium italic">No users found matching your filters</p>
                      <button
                        onClick={() => { setSearchTerm(''); setSelectedRole('All'); setSelectedStatus('All'); }}
                        className="text-gray-900 font-bold hover:underline"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50/80 transition-all">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 transition-all cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold shadow-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-black transition-colors">{user.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold w-fit">
                        {getRoleIcon(user.role)}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded-full text-xs font-bold ${getStatusColor(user.status)} shadow-sm`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-gray-700">{user.lastActive}</p>
                        <p className="text-xs text-gray-400">Security: Standard</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveDrawer({ type: 'view', user })}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white border border-gray-100 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveDrawer({ type: 'edit', user })}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white border border-gray-100 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white border border-gray-100 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-500">
            Showing <span className="text-gray-900">{filteredUsers.length}</span> of <span className="text-gray-900">{users.length}</span> users
          </p>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-400 font-bold text-sm cursor-not-allowed">Previous</button>
            <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 font-bold text-sm transition-all shadow-sm">Next</button>
          </div>
        </div>
      </div>

      {/* User Details Drawer (Simplified Modal for this Refactor) */}
      {
        activeDrawer && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
              <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                  {activeDrawer.type === 'edit' ? 'Edit User Profile' : 'User Information'}
                </h3>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-900" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {activeDrawer.type === 'edit' ? (
                  <UserForm
                    user={activeDrawer.user}
                    onSave={(userData) => {
                      setUsers(prev => prev.map(u => u.id === userData.id ? { ...u, ...userData } : u));
                      setActiveDrawer(null);
                    }}
                    onCancel={() => setActiveDrawer(null)}
                  />
                ) : (
                  <UserDetails user={activeDrawer.user!} />
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

function UserForm({ user, onSave, onCancel }: { user: UnifiedUser | null, onSave: (u: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState<Partial<UnifiedUser>>(
    user || { name: '', email: '', phone: '', role: 'Teacher', status: 'Active' }
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all outline-none font-medium"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all outline-none font-medium"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@school.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Phone</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all outline-none font-medium"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">System Role</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 outline-none font-semibold text-gray-700"
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
          >
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="Parent">Parent</option>
            <option value="Accountant">Accountant</option>
            <option value="Coordinator">Coordinator</option>
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-all"
        >
          Discard
        </button>
        <button
          onClick={() => onSave(formData)}
          className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold transition-all shadow-lg"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
}

function UserDetails({ user }: { user: UnifiedUser }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-3xl bg-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-purple-50">
          {user.name.charAt(0)}
        </div>
        <div className="text-center">
          <h4 className="text-2xl font-bold text-gray-900">{user.name}</h4>
          <p className="text-gray-500 font-semibold">{user.role} Member</p>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Profile Details</h5>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Primary Email</p>
              <p className="font-bold text-gray-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Contact Phone</p>
              <p className="font-bold text-gray-900">{user.phone}</p>
            </div>
          </div>
          {user.employeeId && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Internal ID</p>
                <p className="font-bold text-gray-900">{user.employeeId}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">System Access</h5>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Last Activity</p>
              <p className="font-bold text-gray-900">{user.lastActive}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Encrypted</span>
        </div>
      </div>
    </div>
  );
}

function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

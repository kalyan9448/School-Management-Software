import { useAuth } from '../contexts/AuthContext';
import { ViewType } from './AdminDashboard';
import {
  Home,
  UserPlus,
  HelpCircle,
  DollarSign,
  Users,
  GraduationCap,
  MessageSquare,
  FileText,
  LogOut,
  ChevronRight,
  BookOpen,
  Settings,
  Shield,
  BarChart3,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import logoImage from '../assets/logo.png';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'accountant'] },
    { id: 'admission', icon: UserPlus, label: 'Admissions', roles: ['admin'] },
    { id: 'admission-activation', icon: CheckCircle, label: 'Admission Activation', roles: ['admin'] },
    { id: 'enquiry', icon: HelpCircle, label: 'Enquiries', roles: ['admin'] },
    { id: 'fees', icon: DollarSign, label: 'Fee Management', roles: ['admin', 'accountant'] },
    { id: 'students', icon: Users, label: 'Students', roles: ['admin'] },
    { id: 'teachers', icon: GraduationCap, label: 'Teachers', roles: ['admin'] },
    { id: 'academic-structure', icon: BookOpen, label: 'Academic Structure', roles: ['admin'] },
    { id: 'subject-mapping', icon: BookOpen, label: 'Subject Mapping', roles: ['admin'] },
    { id: 'user-management', icon: Settings, label: 'User Management', roles: ['admin'] },
    { id: 'monitoring', icon: BarChart3, label: 'Monitoring', roles: ['admin'] },
    { id: 'communication', icon: MessageSquare, label: 'Communication', roles: ['admin'] },
    { id: 'reports', icon: FileText, label: 'Reports', roles: ['admin', 'accountant'] },
    { id: 'reports-approval', icon: FileCheck, label: 'Reports & Announcements', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white flex flex-col fixed h-screen z-50">
      {/* Logo */}
      <div className="p-6 border-b border-purple-700">
        <div className="flex flex-col items-center gap-3">
          <img src={logoImage} alt="Kidz Vision Logo" className="w-20 h-20" />
          <div className="text-center">
            <p className="text-yellow-300">Kidz Vision</p>
            <p className="text-purple-200 text-sm">School of Education</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                ? 'bg-white text-purple-900 shadow-lg'
                : 'text-purple-100 hover:bg-purple-800'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-purple-700">
        <div className="mb-3">
          <p className="text-purple-200">Logged in as</p>
          <p>{user?.name}</p>
          <p className="text-purple-300">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
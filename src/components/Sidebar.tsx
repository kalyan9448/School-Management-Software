import { useState, useEffect } from 'react';
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
  FileCheck,
} from 'lucide-react';
import logoImage from '../assets/logo.png';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { user, logout } = useAuth();
  const [schoolCode, setSchoolCode] = useState<string>('');

  useEffect(() => {
    if (user?.school_id) {
      const savedSchools = localStorage.getItem('app_schools');
      if (savedSchools) {
        const schools = JSON.parse(savedSchools);
        const school = schools.find((s: any) => s.id === user.school_id);
        if (school?.schoolCode) {
          setSchoolCode(school.schoolCode);
        }
      }
    }
  }, [user]);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'accountant'] },
    { id: 'admission', icon: UserPlus, label: 'Admissions', roles: ['admin'] },
    { id: 'enquiry', icon: HelpCircle, label: 'Enquiries', roles: ['admin'] },
    { id: 'fees', icon: DollarSign, label: 'Fee Management', roles: ['admin', 'accountant'] },
    { id: 'students', icon: Users, label: 'Students', roles: ['admin'] },
    { id: 'teachers', icon: GraduationCap, label: 'Teachers', roles: ['admin'] },
    { id: 'academic-structure', icon: BookOpen, label: 'Academic Structure', roles: ['admin'] },
    { id: 'monitoring', icon: BarChart3, label: 'Monitoring', roles: ['admin'] },
    { id: 'communication', icon: MessageSquare, label: 'Announcement', roles: ['admin'] },
    { id: 'reports-approval', icon: FileCheck, label: 'Reports & Analytics', roles: ['admin'] },
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
          {schoolCode && (
            <div className="mt-1 px-2 py-0.5 bg-yellow-400/20 border border-yellow-400/30 rounded text-xs font-bold text-yellow-300 inline-block">
              CODE: {schoolCode}
            </div>
          )}
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
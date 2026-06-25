import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ViewType } from './AdminDashboard';
import { schoolService } from '../utils/centralDataService';
import {
  Home,
  UserPlus,
  HelpCircle,
  IndianRupee,
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
  ShieldCheck,
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import { EditProfileModal } from './shared/EditProfileModal';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { user, logout, refreshUser } = useAuth();
  const [schoolCode, setSchoolCode] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
                  const { storage } = await import("../services/firebase");
                  const { userService } = await import("../utils/firestoreService");
                  
                  const fileRef = ref(storage, `admin_photos/${user.id}.jpg`);
                  await uploadBytes(fileRef, blob);
                  const downloadUrl = await getDownloadURL(fileRef);
                  
                  await userService.update(user.id, { avatar: downloadUrl });
                  await refreshUser();
                  alert("Profile picture updated successfully!");
                } catch (err) {
                  console.error("Failed to upload avatar to Firebase Storage:", err);
                  alert("Failed to upload avatar. Please try again.");
                } finally {
                  setIsUploading(false);
                }
              }
            }, "image/jpeg", 0.7);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const loadSchoolInfo = async () => {
      // 1. Check Session Storage First
      const sessionName = sessionStorage.getItem('active_school_name');
      if (sessionName) {
        setSchoolName(sessionName);
      }

      if (user?.school_id) {
        try {
          const schools = await schoolService.getAll();
          const school = schools.find((s: any) => s.id === user.school_id);
          if (school) {
            if (school.schoolCode) {
              setSchoolCode(school.schoolCode);
            }
            if (school.name) {
              setSchoolName(school.name);
            }
          }
        } catch (err) {
          console.error('Failed to load schools:', err);
        }
      }
    };
    loadSchoolInfo();
  }, [user]);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'accountant'] },
    { id: 'admission', icon: UserPlus, label: 'Admissions', roles: ['admin'] },
    { id: 'enquiry', icon: HelpCircle, label: 'Enquiries', roles: ['admin'] },
    { id: 'fees', icon: IndianRupee, label: 'Fee Management', roles: ['admin', 'accountant'] },
    { id: 'students', icon: Users, label: 'Students', roles: ['admin'] },
    { id: 'teachers', icon: GraduationCap, label: 'Teachers', roles: ['admin'] },
    { id: 'academic-structure', icon: BookOpen, label: 'Academic Structure', roles: ['admin'] },
    { id: 'monitoring', icon: BarChart3, label: 'Monitoring', roles: ['admin'] },
    { id: 'communication', icon: MessageSquare, label: 'Announcement', roles: ['admin'] },
    { id: 'reports-approval', icon: FileCheck, label: 'Reports & Analytics', roles: ['admin'] },
    { id: 'support', icon: HelpCircle, label: 'Support', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white flex flex-col fixed h-screen z-50">
      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      {/* Logo */}
      <div className="p-6 border-b border-purple-700">
        <div className="flex flex-col items-center gap-3">
          <img src={logoImage} alt="Kidz Vision Logo" className="w-20 h-20" />
          <div className="text-center">
            <p className="text-yellow-300 font-bold uppercase tracking-tight">
              {schoolName || 'Kidz Vision'}
            </p>
            <p className="text-purple-200 text-sm">
              {schoolName ? 'School Portal' : 'School of Education'}
            </p>
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
      <div className="p-4 pb-8 border-t border-purple-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative group cursor-pointer shrink-0" onClick={() => setIsProfileModalOpen(true)}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400 group-hover:border-yellow-400 transition-all flex items-center justify-center bg-purple-800 text-white font-bold text-lg">
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'A'
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold truncate leading-tight">{user?.name}</p>
            <p className="text-purple-300 text-xs truncate leading-normal">{user?.email}</p>
          </div>
        </div>
        {schoolCode && (
          <div className="mb-3 px-2 py-1 bg-yellow-400/20 border border-yellow-400/30 rounded text-xs font-bold text-yellow-300 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            CODE: {schoolCode}
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition-all hover:shadow-lg active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
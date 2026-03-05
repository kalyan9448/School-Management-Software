import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  FileText, 
  MessageSquare,
  Award,
  BarChart3
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  items: NavItem[];
}

export function DashboardNav({ currentView, onViewChange, items }: DashboardNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap
                ${
                  currentView === item.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// Predefined navigation items for different dashboard types
export const teacherNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { id: 'my-classes', label: 'My Classes', icon: <Users className="w-5 h-5" /> },
  { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-5 h-5" /> },
  { id: 'lesson-log', label: 'Lesson Log', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'quiz-creation', label: 'Quizzes', icon: <FileText className="w-5 h-5" /> },
  { id: 'student-notes', label: 'Student Notes', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'performance', label: 'Performance', icon: <Award className="w-5 h-5" /> },
];

export const parentNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { id: 'timeline', label: 'Timeline', icon: <Calendar className="w-5 h-5" /> },
  { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
  { id: 'ai-suggestions', label: 'AI Discussion Tips', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'fees', label: 'Fees', icon: <Award className="w-5 h-5" /> },
];

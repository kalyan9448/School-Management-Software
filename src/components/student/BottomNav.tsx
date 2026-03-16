import { Home, BookOpen, Calendar, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";

export function BottomNav() {
  const location = useLocation();

  // Don't show bottom nav on login page, subject detail, flashcards, or homework detail pages
  if (
    location.pathname === "/login" ||
    location.pathname.startsWith("/subject-detail") ||
    location.pathname.startsWith("/flashcards") ||
    (location.pathname.startsWith("/homework/") && location.pathname !== "/homework")
  ) {
    return null;
  }

  const navItems = [
    { path: "/student/dashboard", icon: Home, label: "Home" },
    { path: "/homework", icon: BookOpen, label: "Homework" },
    { path: "/schedule", icon: Calendar, label: "Schedule" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50 md:hidden">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 relative"
              >
                <motion.div
                  className={`flex flex-col items-center justify-center ${isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className="text-xs mt-1">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
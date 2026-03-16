import { useState, useRef, useEffect } from "react";
import { LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { NotificationCenter } from "./NotificationCenter";
import { motion, AnimatePresence } from "motion/react";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex items-center gap-2">
      <NotificationCenter />

      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full overflow-hidden p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback
              className="text-white"
              style={{ background: 'linear-gradient(135deg, #0A2540 0%, #1F6FEB 100%)' }}
            >
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-50 text-sm"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{user?.name || "Student"}</p>
                <p className="text-gray-500 font-medium truncate">{user?.email || ""}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setIsOpen(false); navigate("/student/profile"); }}
                  className="group flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                  <User className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  Profile
                </button>
                <button
                  onClick={() => { setIsOpen(false); navigate("/settings"); }}
                  className="group flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  Settings
                </button>
              </div>

              <div className="py-1 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
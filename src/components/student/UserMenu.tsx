import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
   const buttonRef = useRef<HTMLButtonElement>(null);
   const [coords, setCoords] = useState({ top: 0, right: 0 });

   const updateCoords = () => {
     if (buttonRef.current) {
       const rect = buttonRef.current.getBoundingClientRect();
       setCoords({
         top: rect.bottom + window.scrollY,
         right: window.innerWidth - (rect.right + window.scrollX)
       });
     }
   };

   useLayoutEffect(() => {
     if (isOpen) {
       updateCoords();
       window.addEventListener('resize', updateCoords);
       window.addEventListener('scroll', updateCoords, true);
       return () => {
         window.removeEventListener('resize', updateCoords);
         window.removeEventListener('scroll', updateCoords, true);
       };
     }
   }, [isOpen]);

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

      <div className="relative">
        <Button
          ref={buttonRef}
          variant="ghost"
          className="relative h-10 w-10 rounded-full overflow-hidden p-0 usermenu-trigger"
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

        {createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="relative z-[99999]">
                {/* Invisible backdrop for click-outside */}
                <div 
                  className="fixed inset-0 z-[9998]" 
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  ref={menuRef}
                  initial={{ y: 10, scale: 0.95 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fixed w-56 transform overflow-hidden rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 text-sm"
                  style={{ 
                    top: `${coords.top + 8}px`, 
                    right: `${coords.right}px`,
                    zIndex: 99999,
                    backgroundColor: 'white',
                    isolation: 'isolate'
                  }}
                >
                  <div className="px-4 py-3 border-b border-gray-100 relative bg-white">
                    <p className="font-semibold text-gray-900">{user?.name || "Student"}</p>
                    <p className="text-gray-500 font-medium truncate">{user?.email || ""}</p>
                  </div>

                  <div className="py-1 relative bg-white">
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

                  <div className="py-1 border-t border-gray-100 text-sm relative bg-white">
                    <button
                      onClick={handleLogout}
                      className="group flex w-full items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
}
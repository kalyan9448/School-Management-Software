import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BottomNav } from "@/components/student/BottomNav";
import { Home, BookOpen, Calendar, BarChart3, User, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { UserMenu } from "@/components/student/UserMenu";
import logoImage from '../assets/logo.png';

const sidebarNavItems = [
    { path: "/student/dashboard", icon: Home, label: "Dashboard" },
    { path: "/homework", icon: BookOpen, label: "Homework" },
    { path: "/schedule", icon: Calendar, label: "Schedule" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/student/profile", icon: User, label: "Profile" },
];

const DashboardLayout: React.FC = () => {
    const location = useLocation();

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden relative">
            {/* ── Desktop Sidebar (md:flex, hidden on mobile) ── */}
            <aside className="hidden md:flex sidebar-sticky md:w-64 lg:w-72 bg-white border-r border-gray-200 z-30">
                <div className="flex flex-col h-full w-full">
                    {/* Brand */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                         <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Student Portal</h1>
                            <p className="text-xs text-gray-400 font-medium">Learning Dashboard</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {sidebarNavItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path === "/student/dashboard" && location.pathname === "/");
                            const Icon = item.icon;

                            return (
                                <Link key={item.path} to={item.path}>
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebarActive"
                                                className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="mt-auto border-t border-gray-100">
                        <div className="p-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-blue-800 mb-1">Need Help?</p>
                                <p className="text-xs text-blue-600/70">Contact your teacher or admin.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Global Top Header */}
                <header className="flex items-center justify-between px-4 md:px-8 h-[72px] bg-white border-b border-gray-100 z-50 sticky top-0 shadow-sm w-full">
                    {/* Left: Mobile Brand / Desktop Title */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Brand */}
                        <div className="flex items-center gap-2 md:hidden">
                            <img src={logoImage} alt="Logo" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-gray-900">Student Portal</span>
                        </div>
                        
                        {/* Desktop Title */}
                        <h1 className="hidden md:block text-xl font-bold text-gray-900 tracking-tight">
                            {location.pathname.includes('homework') ? 'Homework Library' : 
                             location.pathname.includes('schedule') ? 'Academic Schedule' :
                             location.pathname.includes('analytics') ? 'Analytics Insight' :
                             location.pathname.includes('profile') ? 'My Profile' :
                             'Student Dashboard'}
                        </h1>
                    </div>

                    {/* Right: User Menu */}
                    <div className="flex items-center gap-4">
                        <UserMenu />
                    </div>
                </header>

                {/* Main scrollable content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
                    <div className="w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* ── Mobile Bottom Navigation (md:hidden) ── */}
            <div className="md:hidden fixed bottom-0 w-full bg-white border-t z-[100]">
                <BottomNav />
            </div>
        </div>
    );
};

export default DashboardLayout;

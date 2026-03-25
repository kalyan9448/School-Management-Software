import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BottomNav } from "@/components/student/BottomNav";
import { Home, BookOpen, Calendar, BarChart3, User } from "lucide-react";
import { motion } from "motion/react";
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
    const isDashboard = location.pathname.includes('dashboard') || location.pathname === '/';

    const pageTitle = isDashboard ? 'Main Dashboard'
        : location.pathname.includes('homework') ? 'Homework Library'
        : location.pathname.includes('schedule') ? 'Academic Schedule'
        : location.pathname.includes('analytics') ? 'Analytics Insight'
        : location.pathname.includes('profile') ? 'My Profile'
        : 'Student Dashboard';

    return (
        /* Outermost: full-screen flex row. No overflow:hidden so sticky header works correctly. */
        <div className="flex h-screen bg-gray-50">

            {/* ─── Desktop Sidebar ─── */}
            <aside className="hidden md:flex flex-col flex-shrink-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
                {/* Brand */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
                    <div>
                        <div className="text-base font-bold text-gray-900 leading-tight">Student Portal</div>
                        <div className="text-xs text-gray-400 font-medium">Learning Dashboard</div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {sidebarNavItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === "/student/dashboard" && location.pathname === "/");
                        const Icon = item.icon;
                        return (
                            <Link key={item.path} to={item.path}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700"
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

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Need Help?</p>
                        <p className="text-xs text-blue-600/70">Contact your teacher or admin.</p>
                    </div>
                </div>
            </aside>

            {/* ─── Main Column: header + scrollable content ─── */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Desktop header is hidden — each page's own banner serves as the header.
                     Mobile: compact sticky brand bar with UserMenu. */}
                <header
                    className="hidden md:hidden items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm flex-shrink-0"
                    style={{ height: '64px', position: 'sticky', top: 0, zIndex: 40 }}
                >
                    {/* Mobile-only brand */}
                    <div className="flex items-center gap-2">
                        <img src={logoImage} alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-gray-900 text-sm">Student Portal</span>
                    </div>
                </header>

                {/* ─── Scrollable Page Content ─── */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
                    <Outlet />
                </main>
            </div>

            {/* ─── Mobile Bottom Nav ─── */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
                <BottomNav />
            </div>
        </div>
    );
};

export default DashboardLayout;

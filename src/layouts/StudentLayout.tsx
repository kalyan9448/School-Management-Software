import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BottomNav } from "@/components/student/BottomNav";
import { Home, BookOpen, Calendar, BarChart3, User } from "lucide-react";
import { motion } from "motion/react";
import logoImage from '../assets/logo.jpeg';
import { SettingsService } from '@/services/student/studentDataService';

const sidebarNavItems = [
    { path: "/student/dashboard", icon: Home, label: "Dashboard" },
    { path: "/homework", icon: BookOpen, label: "Homework" },
    { path: "/schedule", icon: Calendar, label: "Schedule" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/student/profile", icon: User, label: "Profile" },
];

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const [showSupportModal, setShowSupportModal] = useState(false);

    useEffect(() => {
        SettingsService.get().then(settings => {
            if (settings?.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });
    }, []);

    const isDashboard = location.pathname.includes('dashboard') || location.pathname === '/';

    const pageTitle = isDashboard ? 'Main Dashboard'
        : location.pathname.includes('homework') ? 'Homework Library'
        : location.pathname.includes('schedule') ? 'Academic Schedule'
        : location.pathname.includes('analytics') ? 'Analytics Insight'
        : location.pathname.includes('profile') ? 'My Profile'
        : 'Student Dashboard';

    return (
        /* Outermost: full-screen flex row. No overflow:hidden so sticky header works correctly. */
        /* Outermost: full-screen flex row. No overflow:hidden so sticky header works correctly. */
        <div className="flex h-screen bg-[#F0F4FF]">

            {/* ─── Desktop Sidebar ─── */}
            <aside className="hidden md:flex flex-col flex-shrink-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
                {/* Brand */}
                <div className="flex items-center gap-3 px-6 py-8">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
                        <img src={logoImage} alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
                    </div>
                    <div>
                        <div className="text-lg font-black text-gray-900 tracking-tight leading-none italic">KIDZ VISION</div>
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1.5">Student Hub</div>
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
                                    className={`group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl transition-colors duration-300 ${
                                        isActive ? "bg-white/20" : "bg-gray-50 group-hover:bg-white shadow-sm"
                                    }`}>
                                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600"}`} />
                                    </div>
                                    <span className="tracking-tight">{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebarActiveIndicator"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-6 mt-auto">
                    <div 
                      className="relative overflow-hidden rounded-3xl p-5 text-white"
                      style={{ backgroundColor: '#0F172A' }} /* Using fixed hex for reliability */
                    >
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-blue-500/20 rounded-full blur-2xl" />
                        <p className="text-xs font-bold mb-1">Need support?</p>
                        <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">Our team is here to help you around the clock.</p>
                        <button 
                          className="w-full py-2.5 rounded-xl text-[10px] font-bold transition-colors border border-white/10 text-white"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                          onClick={() => setShowSupportModal(true)}
                        >
                            Get Help
                        </button>
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

            {/* ─── Support Modal ─── */}
            {showSupportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                            <div>
                                <h2 className="text-2xl font-bold">IT Support Desk</h2>
                                <p className="text-sm opacity-90 mt-1">We're here to help you succeed.</p>
                            </div>
                            <button onClick={() => setShowSupportModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Ticket Form */}
                            <div className="h-fit">
                                <h3 className="font-bold text-gray-900 text-base mb-1">Submit a Support Ticket</h3>
                                <p className="text-xs text-gray-500 mb-4">Our team typically responds within 2-4 hours.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white">
                                            <option>Account Access & Login</option>
                                            <option>Homework & Assignments</option>
                                            <option>Schedule & Classes</option>
                                            <option>Technical / Bug Report</option>
                                            <option>Other Inquiry</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Urgency</label>
                                        <div className="flex gap-2">
                                            <label className="flex-1 text-center border border-gray-200 rounded-lg p-2 text-xs cursor-pointer hover:bg-gray-50">
                                                <input type="radio" name="urgency" className="mr-1" /> Low
                                            </label>
                                            <label className="flex-1 text-center border border-gray-200 rounded-lg p-2 text-xs cursor-pointer hover:bg-gray-50">
                                                <input type="radio" name="urgency" className="mr-1" defaultChecked /> Normal
                                            </label>
                                            <label className="flex-1 text-center border border-red-200 text-red-700 rounded-lg p-2 text-xs cursor-pointer hover:bg-red-50">
                                                <input type="radio" name="urgency" className="mr-1" /> High
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                                        <textarea 
                                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
                                            placeholder="Please provide as much detail as possible to help us resolve the issue quickly..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button 
                                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setShowSupportModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                                onClick={() => {
                                    alert("Support ticket created successfully! Ticket ID: #IT-" + Math.floor(Math.random() * 90000 + 10000) + ". Our team will contact you shortly.");
                                    setShowSupportModal(false);
                                }}
                            >
                                Submit Ticket
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;

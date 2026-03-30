import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '../types';

// =============================================================================
// DashboardLayout — common wrapper for all authenticated dashboard pages.
// The actual sidebar + nav comes from the role-specific dashboard components.
// This layout provides the outer shell, title bar, and a logout mechanism.
// =============================================================================

interface DashboardLayoutProps {
    children: ReactNode;
    role?: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const { user, logout } = useAuth();

    const roleLabels: Record<UserRole, string> = {
        superadmin: 'Super Admin',
        admin: 'School Admin',
        accountant: 'Accountant',
        teacher: 'Teacher',
        parent: 'Parent',
        student: 'Student',
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top meta bar — visible when dashboard components don't include their own */}
            <div className="sr-only" aria-label="dashboard-layout" data-role={role ?? user?.role} />
            {children}
        </div>
    );
}

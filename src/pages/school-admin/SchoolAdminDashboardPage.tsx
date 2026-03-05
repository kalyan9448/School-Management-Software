import { DashboardLayout } from '../../layouts/DashboardLayout';
import { AdminDashboard } from '../../components/AdminDashboard';

// =============================================================================
// SchoolAdminDashboardPage — role: admin | accountant
// Route: /school-admin/dashboard
// =============================================================================

export function SchoolAdminDashboardPage() {
    return (
        <DashboardLayout role="admin">
            <AdminDashboard />
        </DashboardLayout>
    );
}

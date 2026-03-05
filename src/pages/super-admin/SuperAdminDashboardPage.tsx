import { DashboardLayout } from '../../layouts/DashboardLayout';
import { SuperAdminDashboard } from '../../components/SuperAdminDashboard';

// =============================================================================
// SuperAdminDashboardPage — role: superadmin
// Route: /super-admin/dashboard
// =============================================================================

export function SuperAdminDashboardPage() {
    return (
        <DashboardLayout role="superadmin">
            <SuperAdminDashboard />
        </DashboardLayout>
    );
}

import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ParentDashboardNew } from '../../components/ParentDashboardNew';

// =============================================================================
// ParentDashboardPage — role: parent
// Route: /parent/dashboard
// =============================================================================

export function ParentDashboardPage() {
    return (
        <DashboardLayout role="parent">
            <ParentDashboardNew />
        </DashboardLayout>
    );
}

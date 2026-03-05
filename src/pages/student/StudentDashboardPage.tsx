import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StudentDashboard } from '../../components/StudentDashboard';

// =============================================================================
// StudentDashboardPage — role: student
// Route: /student/dashboard
// =============================================================================

export function StudentDashboardPage() {
    return (
        <DashboardLayout role="student">
            <StudentDashboard />
        </DashboardLayout>
    );
}

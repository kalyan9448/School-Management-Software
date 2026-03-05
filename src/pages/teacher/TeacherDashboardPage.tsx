import { DashboardLayout } from '../../layouts/DashboardLayout';
import { TeacherDashboardNew } from '../../components/TeacherDashboardNew';

// =============================================================================
// TeacherDashboardPage — role: teacher
// Route: /teacher/dashboard
// =============================================================================

export function TeacherDashboardPage() {
    return (
        <DashboardLayout role="teacher">
            <TeacherDashboardNew />
        </DashboardLayout>
    );
}

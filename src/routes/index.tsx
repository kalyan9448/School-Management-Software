import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import CreatePasswordScreen from '../components/CreatePasswordScreen';
import { SuperAdminDashboardPage } from '../pages/super-admin/SuperAdminDashboardPage';
import { SchoolAdminDashboardPage } from '../pages/school-admin/SchoolAdminDashboardPage';
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage';
import { ParentDashboardPage } from '../pages/parent/ParentDashboardPage';
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';

// =============================================================================
// Unauthorized page (inline — simple enough)
// =============================================================================
function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">
                    You don't have permission to view this page.
                </p>
                <a
                    href="/login"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Login
                </a>
            </div>
        </div>
    );
}

// =============================================================================
// Router definition
// =============================================================================
const router = createBrowserRouter([
    // Public routes
    { path: '/login', element: <LoginPage /> },
    { path: '/create-password', element: <CreatePasswordScreen /> },
    { path: '/unauthorized', element: <UnauthorizedPage /> },

    // Protected (must be logged in)
    {
        element: <ProtectedRoute />,
        children: [
            // Default redirect
            { index: true, element: <Navigate to="/login" replace /> },

            // Super Admin
            {
                element: <RoleRoute allowedRoles={['superadmin']} />,
                children: [
                    { path: '/super-admin/dashboard', element: <SuperAdminDashboardPage /> },
                ],
            },

            // School Admin / Accountant
            {
                element: <RoleRoute allowedRoles={['admin', 'accountant']} />,
                children: [
                    { path: '/school-admin/dashboard', element: <SchoolAdminDashboardPage /> },
                ],
            },

            // Teacher
            {
                element: <RoleRoute allowedRoles={['teacher']} />,
                children: [
                    { path: '/teacher/dashboard', element: <TeacherDashboardPage /> },
                ],
            },

            // Parent
            {
                element: <RoleRoute allowedRoles={['parent']} />,
                children: [
                    { path: '/parent/dashboard', element: <ParentDashboardPage /> },
                ],
            },

            // Student
            {
                element: <RoleRoute allowedRoles={['student']} />,
                children: [
                    { path: '/student/dashboard', element: <StudentDashboardPage /> },
                ],
            },
        ],
    },

    // Catch-all
    { path: '*', element: <Navigate to="/login" replace /> },
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}

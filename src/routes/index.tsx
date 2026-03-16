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
// Student Dashboard
import StudentLayout from '../layouts/StudentLayout';
import { Dashboard as StudentDashboard } from '../pages/student/StudentDashboardPage';
import { SchedulePage as StudentTasks } from '../pages/student/StudentTasks';
import { QuizSelectionPage as StudentQuizzes } from '../pages/student/StudentQuizzes';
import { ProgressPage as StudentProgress } from '../pages/student/StudentProgress';
import { ProfilePage as StudentProfile } from '../pages/student/StudentProfile';
import { HomePage as StudentHome } from '../pages/student/HomePage';
import { SettingsPage as StudentSettings } from '../pages/student/SettingsPage';
import { TimelinePage as StudentTimeline } from '../pages/student/TimelinePage';
import { SubjectDetailPage } from '../pages/student/SubjectDetailPage';
import { TopicDetailPage } from '../pages/student/TopicDetailPage';
import { FlashcardsPage } from '../pages/student/FlashcardsPage';
import { ObjectiveQuestionsPage } from '../pages/student/ObjectiveQuestionsPage';
import { QuizPage } from '../pages/student/QuizPage';
import { ReviewMistakesPage } from '../pages/student/ReviewMistakesPage';

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
                    {
                        element: <StudentLayout />,
                        children: [
                            { path: '/student/dashboard', element: <StudentDashboard /> },
                            { path: '/student/tasks', element: <StudentTasks /> },
                            { path: '/student/quizzes', element: <StudentQuizzes /> },
                            { path: '/student/profile', element: <StudentProfile /> },
                            { path: '/homework', element: <StudentHome /> },
                            { path: '/schedule', element: <StudentTasks /> },
                            { path: '/analytics', element: <StudentProgress /> },
                            { path: '/settings', element: <StudentSettings /> },
                            { path: '/timeline', element: <StudentTimeline /> },
                            { path: '/subject-detail/:id', element: <SubjectDetailPage /> },
                            { path: '/homework/:topicId', element: <TopicDetailPage /> },
                            { path: '/flashcards/:topicId', element: <FlashcardsPage /> },
                            { path: '/objective-questions/:topicId', element: <ObjectiveQuestionsPage /> },
                            { path: '/quiz', element: <QuizPage /> },
                            { path: '/review-mistakes/:topicId', element: <ReviewMistakesPage /> },
                        ]
                    }
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

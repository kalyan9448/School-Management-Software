import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../../contexts/AuthContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Login } from '../../components/Login';

// =============================================================================
// LoginPage — wraps the existing Login component inside AuthLayout.
// After a successful login the user is redirected to their role dashboard.
// =============================================================================

export function LoginPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // If already authenticated, redirect to the correct dashboard
    useEffect(() => {
        if (user) {
            navigate(getRoleDashboardPath(user.role), { replace: true });
        }
    }, [user, navigate]);

    return (
        <AuthLayout>
            <Login />
        </AuthLayout>
    );
}

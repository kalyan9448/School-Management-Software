import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '../types';

// =============================================================================
// RoleRoute — enforces role-based access control.
// Wrap within ProtectedRoute (user is guaranteed non-null here).
// =============================================================================

interface RoleRouteProps {
    allowedRoles: UserRole[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}

import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

// =============================================================================
// AuthLayout — wraps auth pages (login, forgot password, etc.)
// =============================================================================

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    const { user } = useAuth();

    // If already logged in, children should handle the redirect
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="w-full max-w-md px-4">
                {children}
            </div>
        </div>
    );
}

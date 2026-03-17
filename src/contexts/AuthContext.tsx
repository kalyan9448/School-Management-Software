import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import services from '../utils/centralDataService';

// =============================================================================
// AuthContext — authentication state for the whole app
// Sessions are always saved to sessionStorage (survives refresh).
// Sessions are also saved to localStorage only when "Remember Me" is used.
// =============================================================================

interface LoginResponse {
    success: boolean;
    requiresPasswordCreation?: boolean;
    error?: string;
}

interface CheckEmailResponse {
    exists: boolean;
    isFirstLogin: boolean;
    error?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    checkEmail: (email: string) => Promise<CheckEmailResponse>;
    login: (email: string, password?: string) => Promise<LoginResponse>;
    createPassword: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

// Demo users acting as initial seed when localStorage is empty
const DEMO_USERS: User[] = [
    { id: '0', email: 'superadmin@platform.com', name: 'Super Admin', role: 'superadmin', isFirstLogin: false },
    { id: '1', email: 'admin@school.com', name: 'Admin User', role: 'admin', isFirstLogin: false, school_id: 'SCHOOL001' },
    { id: '3', email: 'teacher@school.com', name: 'John Teacher', role: 'teacher', isFirstLogin: false, school_id: 'SCHOOL001' },
    { id: '5', email: 'parent@school.com', name: 'Parent User', role: 'parent', isFirstLogin: false, school_id: 'SCHOOL001' },
    { id: '6', email: 'student@school.com', name: 'Aarav Sharma', role: 'student', isFirstLogin: false, school_id: 'SCHOOL001' },
];

const STORAGE_KEY = 'schoolUser';

export const getRoleDashboardPath = (role: UserRole): string => {
    const map: Record<UserRole, string> = {
        superadmin: '/super-admin/dashboard',
        admin: '/school-admin/dashboard',
        accountant: '/school-admin/dashboard',
        teacher: '/teacher/dashboard',
        parent: '/parent/dashboard',
        student: '/student/dashboard',
    };
    return map[role] ?? '/login';
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check sessionStorage first, then localStorage fallback
        const fromSession = sessionStorage.getItem(STORAGE_KEY);
        const fromLocal = localStorage.getItem(STORAGE_KEY);
        const saved = fromSession || fromLocal;
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch {
                sessionStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setLoading(false);
    }, []);

    const persistUser = (u: User) => {
        const serialized = JSON.stringify(u);
        // Always persist to sessionStorage (survives refresh, cleared on tab close)
        sessionStorage.setItem(STORAGE_KEY, serialized);
        // Also persist to localStorage so the session survives closing the tab
        localStorage.setItem(STORAGE_KEY, serialized);
    };

    const getPasswordForUser = (userId: string) => {
        return localStorage.getItem(`pw_${userId}`) || 'demo123';
    };

    const checkEmail = async (email: string): Promise<CheckEmailResponse> => {
        const allUsers = services.user.getAll();
        const found = allUsers.find(u => u.email === email) || DEMO_USERS.find(u => u.email === email);
        if (!found) return { exists: false, isFirstLogin: false, error: 'No account found for this email.' };
        const isFirst = !!(found.isFirstLogin && !localStorage.getItem(`pw_${found.id}`));
        return { exists: true, isFirstLogin: isFirst };
    };

    const login = async (email: string, password?: string): Promise<LoginResponse> => {
        try {
            const allUsers = services.user.getAll();
            const found = allUsers.find(u => u.email === email) || DEMO_USERS.find(u => u.email === email);

            if (!found) {
                return { success: false, error: 'User not found' };
            }

            // Check if it's a first time login (no password set yet)
            if (found.isFirstLogin || !localStorage.getItem(`pw_${found.id}`)) {
                if (found.role === 'admin' && found.isFirstLogin !== false) {
                    return { success: true, requiresPasswordCreation: true };
                }
            }

            const expectedPassword = getPasswordForUser(found.id);

            if (password === expectedPassword) {
                setUser(found);
                persistUser(found);
                return { success: true };
            }
            return { success: false, error: 'Invalid password' };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'An unexpected error occurred' };
        }
    };

    const createPassword = async (email: string, password: string): Promise<boolean> => {
        try {
            const allUsers = services.user.getAll();
            const found = allUsers.find(u => u.email === email);

            if (found) {
                // Save password in local storage prefixed with pw_
                localStorage.setItem(`pw_${found.id}`, password);

                // Update user to mark isFirstLogin as false
                services.user.update(found.id, { isFirstLogin: false });

                // Auto login after creating password — persists session
                setUser(found);
                persistUser(found);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Create password error', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, loading, checkEmail, login, createPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


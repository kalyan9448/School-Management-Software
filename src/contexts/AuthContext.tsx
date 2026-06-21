import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { auth, db } from '../services/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    updatePassword,
    fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc, collectionGroup } from 'firebase/firestore';

// =============================================================================
// AuthContext — Firebase Authentication + Firestore user profiles
//
// User profiles are stored in Firestore: /users/{firebaseUID}
// Role for new users is derived from VITE_SUPERADMIN_EMAILS env var,
// otherwise defaults to 'admin'.
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
    resetPassword: (email: string, password: string) => Promise<boolean>;
    requestPasswordReset: (email: string) => Promise<boolean>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

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

// ── Firestore helpers ─────────────────────────────────────────────────────────

/** Fetch app-level user profile from Firestore by Firebase UID. */
async function getUserFromFirestore(uid: string, email?: string): Promise<User | null> {
    try {
        // 1. Look up by Firebase UID (the expected path)
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) return snap.data() as User;

        // 2. Profile not found by UID — look up by email (handles users created
        //    by schoolService.create which stored the doc at an auto-generated ID)
        if (email) {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const results = await getDocs(q);
            if (!results.empty) {
                const existingDoc = results.docs[0];
                const existingData = existingDoc.data() as User;

                // Migrate: copy the profile to /users/{firebaseUID} so future
                // lookups by UID succeed immediately.
                const oldDocId = existingDoc.id;
                const migratedUser: User = { ...existingData, id: uid };
                await setDoc(doc(db, 'users', uid), migratedUser, { merge: true });

                // Remove the orphaned doc (different ID) to avoid duplicates
                if (oldDocId !== uid) {
                    try { await deleteDoc(doc(db, 'users', oldDocId)); } catch { /* best effort */ }

                    // Fix the parentId on any student records that still reference
                    // the old random doc ID (happens when parent was provisioned by
                    // userService.create() before their first Firebase Auth login).
                    if (existingData.role === 'parent' && oldDocId) {
                        try {
                            const staleStudents = await getDocs(
                                query(collection(db, 'students'), where('parentId', '==', oldDocId))
                            );
                            await Promise.all(
                                staleStudents.docs.map(d =>
                                    setDoc(doc(db, 'students', d.id), { parentId: uid }, { merge: true })
                                )
                            );
                        } catch { /* best effort — parentEmail fallback covers this */ }
                    }
                }

                return migratedUser;
            }
        }

        // 3. No users doc found — check the teachers/students collection so a
        //    teacher or student who was provisioned but never logged in before
        //    gets the correct role instead of defaulting to 'admin'.
        if (email) {
            const emailLower = email.toLowerCase().trim();
            const teacherQ = query(collection(db, 'teachers'), where('email', '==', emailLower));
            const teacherSnap = await getDocs(teacherQ);
            if (!teacherSnap.empty) {
                const td = teacherSnap.docs[0].data();
                return {
                    id: uid,
                    email: emailLower,
                    name: td.name || email.split('@')[0] || 'User',
                    role: 'teacher' as UserRole,
                    school_id: td.school_id,
                } as User;
            }

            const studentQ = query(collection(db, 'students'), where('email', '==', emailLower));
            const studentSnap = await getDocs(studentQ);
            if (!studentSnap.empty) {
                const sd = studentSnap.docs[0].data();
                return {
                    id: uid,
                    email: emailLower,
                    name: sd.name || email.split('@')[0] || 'User',
                    role: 'student' as UserRole,
                    school_id: sd.school_id,
                } as User;
            }
        }

        return null;
    } catch {
        return null;
    }
}

/** Write (create or merge) a user profile into Firestore. */
async function saveUserToFirestore(uid: string, user: User): Promise<void> {
    try {
        await setDoc(doc(db, 'users', uid), user, { merge: true });
    } catch (err) {
        console.error('Firestore write failed:', err);
    }
}

/** Determine the role for a brand-new user based on their email. */
function resolveRoleForNewUser(email: string): UserRole {
    const superadminList = (import.meta.env.VITE_SUPERADMIN_EMAILS as string | undefined ?? '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
    return superadminList.includes(email.toLowerCase()) ? 'superadmin' : 'admin';
}

/** Fetch with retry + exponential backoff for cold-start resilience. */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 2,
    baseTimeoutMs = 15000,
): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const timeout = baseTimeoutMs + attempt * 5000; // 15s, 20s, 25s
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeout);
        try {
            const resp = await fetch(url, { ...options, signal: ctrl.signal });
            clearTimeout(timer);
            return resp;
        } catch (err) {
            clearTimeout(timer);
            if (attempt === maxRetries) throw err;
            // Wait before retrying (1s, 2s)
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
    }
    throw new Error('All retries exhausted');
}



// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    // ── Pre-Initialization: Hydrate from Storage ──────────────
    // This prevents "flash of login" or unwanted redirects on page refresh
    // by providing immediate user context before Firebase initializes.
    const getCachedUser = (): User | null => {
        try {
            const cached = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
            const parsed = cached ? JSON.parse(cached) : null;
            // Restore active_school_id from cached user so firestoreService
            // queries work immediately (before onAuthStateChanged completes).
            if (parsed?.school_id && !sessionStorage.getItem('active_school_id')) {
                sessionStorage.setItem('active_school_id', parsed.school_id);
            }
            if (parsed?.organization_id && !sessionStorage.getItem('active_organization_id')) {
                sessionStorage.setItem('active_organization_id', parsed.organization_id);
            }
            return parsed;
        } catch {
            return null;
        }
    };

    const initialUser = getCachedUser();
    const [user, setUser] = useState<User | null>(initialUser);
    const [loading, setLoading] = useState(!initialUser); // If we have a user, don't show global loader

    const persistUser = (u: User) => {
        const serialized = JSON.stringify(u);
        sessionStorage.setItem(STORAGE_KEY, serialized);
        localStorage.setItem(STORAGE_KEY, serialized);
    };

    // Listen to Firebase auth state — handles all session changes including page refresh
    useEffect(() => {
        // Proactively wake backend on app mount (before user types email)
        const apiBase = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001').replace(/\/$/, '');
        fetch(`${apiBase}/api/health`).catch(() => {}); // fire-and-forget warm-up

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const email = firebaseUser.email ?? '';

                // 1. Try Firestore profile first (by UID, then by email fallback)
                let appUser = await getUserFromFirestore(firebaseUser.uid, email);

                // 2. Brand-new Firebase user with no existing profile — auto-create
                //    Note: saveUserToFirestore may be blocked by Firestore rules if
                //    role='superadmin'; the backend sync below handles that case.
                if (!appUser) {
                    // Before defaulting to 'admin', check if this email belongs
                    // to a student or teacher provisioned during admission.
                    let resolvedRole = resolveRoleForNewUser(email);
                    let resolvedName = firebaseUser.displayName || email.split('@')[0] || 'User';
                    let resolvedSchoolId: string | undefined;

                    if (resolvedRole !== 'superadmin') {
                        const emailLower = email.toLowerCase().trim();
                        const teacherQ = query(collection(db, 'teachers'), where('email', '==', emailLower));
                        const teacherSnap = await getDocs(teacherQ);
                        if (!teacherSnap.empty) {
                            const td = teacherSnap.docs[0].data();
                            resolvedRole = 'teacher';
                            resolvedName = td.name || resolvedName;
                            resolvedSchoolId = td.school_id;
                        } else {
                            const studentQ = query(collection(db, 'students'), where('email', '==', emailLower));
                            const studentSnap = await getDocs(studentQ);
                            if (!studentSnap.empty) {
                                const sd = studentSnap.docs[0].data();
                                resolvedRole = 'student';
                                resolvedName = sd.name || resolvedName;
                                resolvedSchoolId = sd.school_id;
                            }
                        }
                    }

                    appUser = {
                        id: firebaseUser.uid,
                        email,
                        name: resolvedName,
                        role: resolvedRole,
                        school_id: resolvedSchoolId,
                    };
                    await saveUserToFirestore(firebaseUser.uid, appUser);
                }

                // 3. Sync with backend (Admin SDK) to:
                //    a) Ensure the Firestore profile has the correct role.
                //    b) Set Firebase Auth custom claims ({ role, school_id }) on the
                //       JWT so Firestore security rules use request.auth.token.role
                //       (no extra DB reads in rules — the SaaS standard approach).
                //    c) After backend confirms claims are set, force-refresh the
                //       token so Firestore SDK immediately sees the new claims.
                try {
                    const token = await firebaseUser.getIdToken();
                    const apiBase = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001').replace(/\/$/, '');
                    const resp = await fetchWithRetry(`${apiBase}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.user) appUser = { ...appUser!, ...data.user } as User;
                        // Backend has set custom claims — force-refresh token so
                        // the Firestore SDK picks them up before any collection reads.
                        if (data.claimsUpdated) {
                            await firebaseUser.getIdToken(true);
                        }
                    }
                } catch {
                    // Backend unavailable — continue with Firestore profile.
                    // Firestore rules fall back to the previous token claims.
                }

                // 4. Fallback: If school_id is STILL missing (backend down, race
                //    condition, etc.), try to resolve it from the schools or students collection.
                if (!appUser!.school_id && appUser!.role !== 'superadmin') {
                    try {
                        const emailLower = email.toLowerCase().trim();
                        const emailTrimmed = email.trim();

                        // For student/parent roles, check the students collection first
                        if (appUser!.role === 'student' || appUser!.role === 'parent') {
                            const studentQ = query(collection(db, 'students'), where('email', '==', emailLower));
                            const studentSnap = await getDocs(studentQ);
                            if (!studentSnap.empty) {
                                const sd = studentSnap.docs[0].data();
                                if (sd.school_id) {
                                    appUser!.school_id = sd.school_id;
                                    await saveUserToFirestore(firebaseUser.uid, appUser!);
                                    console.log('[AuthContext] Auto-resolved school_id from students:', sd.school_id);
                                }
                            }
                        }

                        // If still missing, check the schools collection (for admin/principal)
                        if (!appUser!.school_id) {
                            const fields = ['email', 'principalEmail', 'principalGmail', 'principal_email'] as const;
                            let foundSchoolId: string | null = null;

                            for (const field of fields) {
                                const q1 = query(collection(db, 'schools'), where(field, '==', emailLower));
                                const snap1 = await getDocs(q1);
                                if (!snap1.empty) {
                                    foundSchoolId = snap1.docs[0].id;
                                    break;
                                }
                                if (emailTrimmed !== emailLower) {
                                    const q2 = query(collection(db, 'schools'), where(field, '==', emailTrimmed));
                                    const snap2 = await getDocs(q2);
                                    if (!snap2.empty) {
                                        foundSchoolId = snap2.docs[0].id;
                                        break;
                                    }
                                }
                            }

                            if (foundSchoolId) {
                                appUser!.school_id = foundSchoolId;
                                await saveUserToFirestore(firebaseUser.uid, appUser!);
                                console.log('[AuthContext] Auto-resolved school_id:', foundSchoolId);
                            } else {
                                console.warn('[AuthContext] Could not resolve school_id for', emailLower);
                            }
                        }
                    } catch (err) {
                        console.warn('Frontend school_id resolution failed:', err);
                    }
                }

                // 5. Set tenant context (school_id & organization_id) so dashboard data loads correctly
                if (appUser!.school_id) {
                    sessionStorage.setItem('active_school_id', appUser!.school_id);
                    
                    // 5.1 Resolve organization context (organization_id) if missing
                    if (!appUser!.organization_id) {
                        try {
                            // Schools are stored at organizations/{orgId}/schools/{schoolId} — NOT at root /schools.
                            // Use collectionGroup to find the school doc regardless of its org path.
                            const schoolGroupSnap = await getDocs(
                                query(collectionGroup(db, 'schools'), where('id', '==', appUser!.school_id))
                            );
                            if (!schoolGroupSnap.empty) {
                                const schoolDoc = schoolGroupSnap.docs[0];
                                const sd = schoolDoc.data();
                                // Extract orgId from the document data, or from the path: organizations/{orgId}/schools/{schoolId}
                                const pathSegments = schoolDoc.ref.path.split('/');
                                const oid = sd.organizationId || sd.organization_id || pathSegments[1];
                                if (oid) {
                                    appUser!.organization_id = oid;
                                    sessionStorage.setItem('active_organization_id', oid);
                                    await saveUserToFirestore(firebaseUser.uid, appUser!);
                                    console.log('[AuthContext] Resolved organization_id:', oid);
                                }
                            } else {
                                console.warn('[AuthContext] School doc not found in collectionGroup for school_id:', appUser!.school_id);
                            }
                        } catch (err) {
                            console.warn('[AuthContext] organization_id resolution failed:', err);
                        }
                    } else {
                        sessionStorage.setItem('active_organization_id', appUser!.organization_id);
                    }
                }

                setUser(appUser!);
                persistUser(appUser!);
            } else {
                setUser(null);
                sessionStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // ── checkEmail ────────────────────────────────────────────────────────────
    const checkEmail = async (email: string): Promise<CheckEmailResponse> => {
        const emailLower = email.trim().toLowerCase();

        // ── 1. Try the backend (Admin SDK) first — most accurate ──────────────
        try {
            const apiBase = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001').replace(/\/$/, '');
            const resp = await fetchWithRetry(`${apiBase}/api/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            if (resp.ok) {
                const data = await resp.json();
                if (!data.exists) {
                    return { exists: false, isFirstLogin: false, error: data.error || 'No account found for this email address.' };
                }
                return { exists: true, isFirstLogin: !!data.isFirstLogin };
            }
        } catch {
            // Backend unavailable — fall through to Firestore direct check
        }

        // ── 2. Backend unavailable — query Firestore directly ─────────────────
        // This handles the case where the backend is down or times out.
        try {
            // Check /users collection first (primary source of truth)
            const usersQ = query(collection(db, 'users'), where('email', '==', emailLower));
            const usersSnap = await getDocs(usersQ);

            if (!usersSnap.empty) {
                // Don't rely on the stale isFirstLogin field in Firestore — it may
                // never have been cleared. Instead, probe Firebase Auth directly to
                // see if this email already has a credential.
                let hasAuthAccount = false;
                try {
                    const methods = await fetchSignInMethodsForEmail(auth, emailLower);
                    hasAuthAccount = methods.length > 0;
                } catch {
                    // fetchSignInMethods may fail due to email enumeration protection.
                    // Fall back to trying a dummy sign-in: if it throws
                    // 'auth/wrong-password' or 'auth/invalid-credential' that means
                    // the account EXISTS (just wrong pw). 'auth/user-not-found'
                    // means no account.
                    try {
                        await signInWithEmailAndPassword(auth, emailLower, '__probe__' + Date.now());
                        hasAuthAccount = true; // extremely unlikely to succeed, but handle it
                    } catch (probeErr: any) {
                        const code = probeErr?.code as string;
                        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                            hasAuthAccount = true;
                        }
                        // 'auth/user-not-found' → hasAuthAccount stays false
                    }
                }
                return { exists: true, isFirstLogin: !hasAuthAccount };
            }

            // Not in /users — check if provisioned in auxiliary collections
            // (teachers, students, parentEmail on student docs)
            const [teacherSnap, studentSnap, parentSnap] = await Promise.all([
                getDocs(query(collection(db, 'teachers'), where('email', '==', emailLower))),
                getDocs(query(collection(db, 'students'), where('email', '==', emailLower))),
                getDocs(query(collection(db, 'students'), where('parentEmail', '==', emailLower))),
            ]);

            if (!teacherSnap.empty || !studentSnap.empty || !parentSnap.empty) {
                // Found in the system — check if they already have a Firebase Auth account
                let hasAuthAccount = false;
                try {
                    const methods = await fetchSignInMethodsForEmail(auth, emailLower);
                    hasAuthAccount = methods.length > 0;
                } catch {
                    try {
                        await signInWithEmailAndPassword(auth, emailLower, '__probe__' + Date.now());
                        hasAuthAccount = true;
                    } catch (probeErr: any) {
                        const code = probeErr?.code as string;
                        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                            hasAuthAccount = true;
                        }
                    }
                }
                return { exists: true, isFirstLogin: !hasAuthAccount };
            }

            // Not found anywhere — reject
            return { exists: false, isFirstLogin: false, error: 'No account found for this email address.' };
        } catch {
            // Firestore also unavailable — default to showing the password screen.
            // It's safer to show "Enter Password" for returning users than to show
            // "Create Password" — createPassword handles auth/email-already-in-use
            // but the UX is confusing for returning users.
            return { exists: true, isFirstLogin: false };
        }
    };

    // ── login ─────────────────────────────────────────────────────────────────
    const login = async (email: string, password?: string): Promise<LoginResponse> => {
        if (!password) return { success: false, error: 'Password is required' };

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will resolve and set the user in context
            return { success: true };
        } catch (err: any) {
            const code = err?.code as string | undefined;
            if (code === 'auth/user-not-found') {
                // No Firebase Auth account — first-login user whose Firestore
                // profile was pre-created by an admin.
                return { success: false, requiresPasswordCreation: true };
            }
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                // Firebase v12 with email enumeration protection returns
                // auth/invalid-credential for BOTH wrong password and
                // non-existent user.  Ask the backend to distinguish.
                try {
                    const check = await checkEmail(email);
                    if (check.exists && check.isFirstLogin) {
                        return { success: false, requiresPasswordCreation: true };
                    }
                } catch { /* backend unavailable — treat as wrong password */ }
                return { success: false, error: 'Incorrect password. Please try again.' };
            }
            if (code === 'auth/too-many-requests') {
                return { success: false, error: 'Too many failed attempts. Please try again later.' };
            }
            console.error('Login error:', err);
            return { success: false, error: err?.message || 'An unexpected error occurred' };
        }
    };

    // ── createPassword ────────────────────────────────────────────────────────
    const createPassword = async (email: string, password: string): Promise<boolean> => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will set user in context
            return true;
        } catch (err: any) {
            if (err?.code === 'auth/email-already-in-use') {
                // Account already exists — sign in with the password instead.
                // If the password is wrong this will throw, which is correct.
                await signInWithEmailAndPassword(auth, email, password);
                return true;
            }
            console.error('Create password error:', err);
            throw err; // Propagate so the caller can display the message
        }
    };

    // ── resetPassword ─────────────────────────────────────────────────────────
    const resetPassword = async (email: string, newPassword: string): Promise<boolean> => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email?.toLowerCase() === email.toLowerCase()) {
                await updatePassword(currentUser, newPassword);
            }

            // onAuthStateChanged keeps user in context
            return true;
        } catch (err) {
            console.error('Reset password error:', err);
            return false;
        }
    };

    // ── requestPasswordReset ──────────────────────────────────────────────────
    const requestPasswordReset = async (email: string): Promise<boolean> => {
        try {
            const actionCodeSettings = {
                // After password reset, redirect back to the login page
                url: `${window.location.origin}/login`,
                handleCodeInApp: false,
            };
            await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
            return true;
        } catch (err: any) {
            const code = err?.code as string | undefined;
            if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
                // Firebase email enumeration protection — treat as success to avoid
                // revealing whether the email exists. The email field is already
                // validated client-side, so this is a safe fallback.
                return true;
            }
            if (code === 'auth/too-many-requests') {
                throw new Error('Too many requests. Please wait a few minutes before trying again.');
            }
            console.error('Password reset email error:', err);
            throw new Error(err?.message || 'Failed to send reset email. Please try again.');
        }
    };

    // ── logout ────────────────────────────────────────────────────────────────
    const logout = async () => {
        try {
            await signOut(auth);
        } catch {
            // ignore
        }
        setUser(null);
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem('active_school_id');
        sessionStorage.removeItem('active_school_name');
        sessionStorage.removeItem('active_organization_id');
    };

    // ── refreshUser ───────────────────────────────────────────────────────────
    const refreshUser = async () => {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
            const email = firebaseUser.email ?? '';
            const appUser = await getUserFromFirestore(firebaseUser.uid, email);
            if (appUser) {
                setUser(appUser);
                persistUser(appUser);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, checkEmail, login, createPassword, resetPassword, requestPasswordReset, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}


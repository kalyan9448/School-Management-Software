import axios from 'axios';

// =============================================================================
// API Client — Axios instance for calls to the Node.js/Express backend
// Set VITE_API_BASE_URL in your .env file.
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const apiClient = axios.create({
    baseURL: API_BASE_URL ?? 'http://localhost:3001',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor — attach auth token ──────────────────────────────────
apiClient.interceptors.request.use(
    (config) => {
        // Attach Supabase JWT if available
        const session = localStorage.getItem('supabase.auth.token');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                const token = parsed?.currentSession?.access_token;
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            } catch {
                // ignore
            }
        }

        // Attach school_id for multi-tenant backend filtering
        const schoolId = sessionStorage.getItem('active_school_id');
        if (schoolId) {
            config.headers['x-school-id'] = schoolId;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response Interceptor — handle auth errors ────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired — redirect to login
            localStorage.removeItem('schoolUser');
            sessionStorage.removeItem('active_school_id');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

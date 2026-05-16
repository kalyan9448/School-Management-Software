import axios from 'axios';
import { auth } from './firebase';

// =============================================================================
// API Client — Axios instance for calls to the Node.js/Express backend
// Set VITE_API_BASE_URL in your .env file.
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const apiClient = axios.create({
    baseURL: API_BASE_URL ?? 'http://localhost:3001',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor — attach Firebase ID token ───────────────────────────
apiClient.interceptors.request.use(
    async (config) => {
        // Get the current Firebase user's ID token
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                const token = await currentUser.getIdToken();
                config.headers['Authorization'] = `Bearer ${token}`;
            } catch {
                // Token retrieval failed — continue without auth header
            }
        }

        // Attach school_id and organization_id for multi-tenant backend filtering.
        // Try sessionStorage first (most current), then fall back to cached user profile in localStorage.
        let schoolId = sessionStorage.getItem('active_school_id');
        let organizationId = sessionStorage.getItem('active_organization_id');
        
        if (!schoolId || !organizationId) {
            const cached = localStorage.getItem('schoolUser');
            if (cached) {
                try {
                    const user = JSON.parse(cached);
                    if (!schoolId) schoolId = user.school_id;
                    if (!organizationId) organizationId = user.organization_id || user.org_id;
                } catch (e) {
                    console.warn('[apiClient] Failed to parse cached user for header recovery');
                }
            }
        }
        
        if (schoolId) {
            config.headers['x-school-id'] = schoolId;
        }
        if (organizationId) {
            config.headers['x-organization-id'] = organizationId;
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

// =============================================================================
// Backend API Endpoints — constants for all Node.js/Express route paths
// Import these in both the frontend (API calls) and backend (route definitions)
// to keep both sides in sync and avoid magic strings.
// =============================================================================

/** Base path for all API calls */
export const API_BASE = '/api';

export const API_ROUTES = {
    // ── Super Admin ─────────────────────────────────────────────────────────────
    SUPER_ADMIN: {
        base: `${API_BASE}/super-admin`,
        schools: `${API_BASE}/super-admin/schools`,
        schoolById: (id: string) => `${API_BASE}/super-admin/schools/${id}`,
        stats: `${API_BASE}/super-admin/stats`,
        users: `${API_BASE}/super-admin/users`,
        plans: `${API_BASE}/super-admin/plans`,
    },

    // ── School Admin ─────────────────────────────────────────────────────────────
    SCHOOL_ADMIN: {
        base: `${API_BASE}/school-admin`,
        students: `${API_BASE}/school-admin/students`,
        studentById: (id: string) => `${API_BASE}/school-admin/students/${id}`,
        teachers: `${API_BASE}/school-admin/teachers`,
        teacherById: (id: string) => `${API_BASE}/school-admin/teachers/${id}`,
        classes: `${API_BASE}/school-admin/classes`,
        admissions: `${API_BASE}/school-admin/admissions`,
        enquiries: `${API_BASE}/school-admin/enquiries`,
        fees: `${API_BASE}/school-admin/fees`,
        reports: `${API_BASE}/school-admin/reports`,
        settings: `${API_BASE}/school-admin/settings`,
    },

    // ── Teacher ──────────────────────────────────────────────────────────────────
    TEACHER: {
        base: `${API_BASE}/teacher`,
        attendance: `${API_BASE}/teacher/attendance`,
        assignments: `${API_BASE}/teacher/assignments`,
        lessons: `${API_BASE}/teacher/lessons`,
        exams: `${API_BASE}/teacher/exams`,
        students: `${API_BASE}/teacher/students`,
        communication: `${API_BASE}/teacher/communication`,
    },

    // ── Student ──────────────────────────────────────────────────────────────────
    STUDENT: {
        base: `${API_BASE}/student`,
        profile: `${API_BASE}/student/profile`,
        attendance: `${API_BASE}/student/attendance`,
        grades: `${API_BASE}/student/grades`,
        assignments: `${API_BASE}/student/assignments`,
        timetable: `${API_BASE}/student/timetable`,
        fees: `${API_BASE}/student/fees`,
        announcements: `${API_BASE}/student/announcements`,
    },

    // ── Parent ───────────────────────────────────────────────────────────────────
    PARENT: {
        base: `${API_BASE}/parent`,
        children: `${API_BASE}/parent/children`,
        attendance: `${API_BASE}/parent/attendance`,
        fees: `${API_BASE}/parent/fees`,
        communication: `${API_BASE}/parent/communication`,
        announcements: `${API_BASE}/parent/announcements`,
    },

    // ── Shared / Auth ────────────────────────────────────────────────────────────
    AUTH: {
        login: `${API_BASE}/auth/login`,
        logout: `${API_BASE}/auth/logout`,
        refresh: `${API_BASE}/auth/refresh`,
        profile: `${API_BASE}/auth/profile`,
    },

    // ── Health ───────────────────────────────────────────────────────────────────
    HEALTH: `${API_BASE}/health`,
};

/**
 * Express application for Firebase Cloud Functions.
 * Adapted from backend/src/index.js — no dotenv, no app.listen().
 */

const express = require('express');
const cors = require('cors');

// Route modules
const superAdminRouter = require('./routes/superAdmin');
const schoolAdminRouter = require('./routes/schoolAdmin');
const teacherRouter = require('./routes/teacher');
const studentRouter = require('./routes/student');
const parentRouter = require('./routes/parent');
const authRouter = require('./routes/auth');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
// CORS: Allow configured frontend URLs + any localhost for development
const corsOptions = {
    origin: (origin, callback) => {
        const allowedUrls = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
            .split(',')
            .map(u => u.trim())
            .filter(Boolean);
        if (!origin || origin.startsWith('http://localhost:') || allowedUrls.includes(origin)) {
            callback(null, true);
        } else {
            // In production, log but don't block (Cloud Functions may strip origin)
            console.warn(`[CORS] Unexpected origin: ${origin}`);
            callback(null, true);
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ── Tenant injection middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
    // Extract school_id from header (set by apiClient.ts on every request)
    req.schoolId = req.headers['x-school-id'] || null;
    next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/school-admin', schoolAdminRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/student', studentRouter);
app.use('/api/parent', parentRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        platform: 'firebase-cloud-functions',
        region: process.env.FUNCTION_REGION || 'asia-south1',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;

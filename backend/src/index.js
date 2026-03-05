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
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`[Server] School Management API running on http://localhost:${PORT}`);
});

module.exports = app;

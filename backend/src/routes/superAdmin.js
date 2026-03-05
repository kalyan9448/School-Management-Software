const express = require('express');
const router = express.Router();

// All routes are protected — only accessible by superadmin role

// GET /api/super-admin/schools
router.get('/schools', async (req, res) => {
    try {
        // TODO: const { data } = await supabase.from('schools').select('*');
        res.json({ schools: [], message: 'List all schools' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/super-admin/schools
router.post('/schools', async (req, res) => {
    try {
        res.json({ message: 'Create new school', body: req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/super-admin/schools/:id
router.get('/schools/:id', async (req, res) => {
    res.json({ message: `Get school ${req.params.id}` });
});

// PUT /api/super-admin/schools/:id
router.put('/schools/:id', async (req, res) => {
    res.json({ message: `Update school ${req.params.id}`, body: req.body });
});

// GET /api/super-admin/stats
router.get('/stats', async (req, res) => {
    res.json({ totalSchools: 0, activeSchools: 0, totalStudents: 0, totalRevenue: 0 });
});

module.exports = router;

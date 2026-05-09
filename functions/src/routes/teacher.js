const express = require('express');
const router = express.Router();

// Teacher-scoped routes
router.get('/attendance', (req, res) => res.json({ attendance: [], schoolId: req.schoolId }));
router.post('/attendance', (req, res) => res.json({ message: 'Mark attendance', body: req.body }));

router.get('/assignments', (req, res) => res.json({ assignments: [], schoolId: req.schoolId }));
router.post('/assignments', (req, res) => res.json({ message: 'Create assignment', body: req.body }));

router.get('/lessons', (req, res) => res.json({ lessons: [], schoolId: req.schoolId }));
router.post('/lessons', (req, res) => res.json({ message: 'Log lesson', body: req.body }));

router.get('/exams', (req, res) => res.json({ exams: [], schoolId: req.schoolId }));
router.post('/exams', (req, res) => res.json({ message: 'Create exam', body: req.body }));

router.get('/students', (req, res) => res.json({ students: [], schoolId: req.schoolId }));

module.exports = router;

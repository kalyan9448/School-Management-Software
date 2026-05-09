const express = require('express');
const router = express.Router();

// Parent-scoped routes
router.get('/children', (req, res) => res.json({ children: [], schoolId: req.schoolId }));
router.get('/attendance', (req, res) => res.json({ attendance: [], schoolId: req.schoolId }));
router.get('/fees', (req, res) => res.json({ fees: [], schoolId: req.schoolId }));
router.get('/communication', (req, res) => res.json({ messages: [], schoolId: req.schoolId }));
router.get('/announcements', (req, res) => res.json({ announcements: [], schoolId: req.schoolId }));

module.exports = router;

const express = require('express');
const router = express.Router();

// All routes scoped to req.schoolId (from x-school-id header)

// Students
router.get('/students', (req, res) => res.json({ students: [], schoolId: req.schoolId }));
router.post('/students', (req, res) => res.json({ message: 'Create student', body: req.body, schoolId: req.schoolId }));
router.get('/students/:id', (req, res) => res.json({ message: `Get student ${req.params.id}` }));
router.put('/students/:id', (req, res) => res.json({ message: `Update student ${req.params.id}` }));
router.delete('/students/:id', (req, res) => res.json({ message: `Delete student ${req.params.id}` }));

// Teachers
router.get('/teachers', (req, res) => res.json({ teachers: [], schoolId: req.schoolId }));
router.post('/teachers', (req, res) => res.json({ message: 'Create teacher', body: req.body }));
router.get('/teachers/:id', (req, res) => res.json({ message: `Get teacher ${req.params.id}` }));
router.put('/teachers/:id', (req, res) => res.json({ message: `Update teacher ${req.params.id}` }));

// Classes
router.get('/classes', (req, res) => res.json({ classes: [], schoolId: req.schoolId }));
router.post('/classes', (req, res) => res.json({ message: 'Create class' }));

// Admissions & Enquiries
router.get('/admissions', (req, res) => res.json({ admissions: [], schoolId: req.schoolId }));
router.post('/admissions', (req, res) => res.json({ message: 'Create admission' }));
router.get('/enquiries', (req, res) => res.json({ enquiries: [], schoolId: req.schoolId }));
router.post('/enquiries', (req, res) => res.json({ message: 'Create enquiry' }));

// Fees
router.get('/fees', (req, res) => res.json({ feeStructures: [], schoolId: req.schoolId }));
router.post('/fees', (req, res) => res.json({ message: 'Create fee structure' }));

// Reports
router.get('/reports', (req, res) => res.json({ report: {}, schoolId: req.schoolId }));

module.exports = router;

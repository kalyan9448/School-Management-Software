const express = require('express');
const router = express.Router();
const { admin, verifyFirebaseToken } = require('../utils/firebaseAdmin');

const db = admin.firestore();

function resolveSchoolId(req) {
	return req.schoolId || req.firebaseUser?.school_id || null;
}

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
router.get('/admissions', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}

		const admissionsSnap = await db
			.collection('admissions')
			.where('school_id', '==', schoolId)
			.get();

		let admissions = admissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		// Legacy fallback for instances still storing admissions in students.
		if (admissions.length === 0) {
			const studentsSnap = await db
				.collection('students')
				.where('school_id', '==', schoolId)
				.get();

			admissions = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		}

		res.json({ admissions, schoolId });
	} catch (error) {
		console.error('[schoolAdmin] Admissions fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load admissions' });
	}
});
router.post('/admissions', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}

		const data = req.body;
		if (!data || !data.name) {
			return res.status(400).json({ error: 'Admission data with at least a name is required' });
		}

		const admissionRef = db.collection('admissions').doc();
		const payload = {
			...data,
			id: admissionRef.id,
			school_id: schoolId,
			appliedDate: data.appliedDate || new Date().toISOString().split('T')[0],
			status: data.status || 'enquiry',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		await admissionRef.set(payload);
		res.json({ admission: payload, id: admissionRef.id });
	} catch (error) {
		console.error('[schoolAdmin] Admission create failed:', error);
		res.status(500).json({ error: error.message || 'Failed to create admission' });
	}
});
router.get('/enquiries', (req, res) => res.json({ enquiries: [], schoolId: req.schoolId }));
router.post('/enquiries', (req, res) => res.json({ message: 'Create enquiry' }));

// Fees
router.get('/fees', (req, res) => res.json({ feeStructures: [], schoolId: req.schoolId }));
router.post('/fees', (req, res) => res.json({ message: 'Create fee structure' }));

// Reports
router.get('/reports', (req, res) => res.json({ report: {}, schoolId: req.schoolId }));

module.exports = router;

const express = require('express');
const router = express.Router();
const { admin, verifyFirebaseToken } = require('../utils/firebaseAdmin');

let _db;
function db() {
    if (!_db) _db = admin.firestore();
    return _db;
}

/**
 * Resolve the student record for the authenticated user.
 * Looks up the students collection by the user's email.
 */
async function resolveStudent(req) {
	const email = req.firebaseUser?.email;
	if (!email) return null;

	const lowered = email.trim().toLowerCase();
	let snap = await db().collection('students').where('email', '==', lowered).limit(1).get();
	if (snap.empty) {
		snap = await db().collection('students').where('email', '==', email.trim()).limit(1).get();
	}
	if (snap.empty) return null;
	return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

function resolveSchoolId(req) {
	return req.schoolId || req.firebaseUser?.school_id || null;
}

// All student routes require authentication
router.use(verifyFirebaseToken);

// GET /api/student/profile — student's own profile from students collection
router.get('/profile', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		if (!student) {
			return res.json({ profile: {}, message: 'No student record found for this account' });
		}

		// Also fetch timetable to count enrolled courses
		let courseCount = 0;
		try {
			if (student.class && student.section) {
				const timetableSnap = await db().collection('timetable')
					.where('school_id', '==', student.school_id)
					.where('className', '==', student.class)
					.where('section', '==', student.section)
					.get();
				const subjects = new Set(timetableSnap.docs.map(d => d.data().subjectId));
				courseCount = subjects.size;
			}
		} catch (e) { /* best effort */ }

		res.json({
			profile: {
				id: student.id,
				name: student.name,
				email: student.email,
				grade: student.class,
				section: student.section,
				rollNo: student.rollNo,
				admissionNo: student.admissionNo,
				dateOfBirth: student.dateOfBirth || student.dob,
				gender: student.gender,
				bloodGroup: student.bloodGroup,
				phone: student.phone || student.parentPhone,
				parentPhone: student.parentPhone,
				parentEmail: student.parentEmail,
				fatherName: student.fatherName,
				motherName: student.motherName,
				address: student.address,
				photo: student.photo || '',
				admissionDate: student.admissionDate,
				academicYear: student.academicYear,
				enrolledCoursesCount: courseCount || 0,
			},
			schoolId: student.school_id,
		});
	} catch (error) {
		console.error('[student] Profile fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load profile' });
	}
});

// GET /api/student/attendance — attendance records for the student
router.get('/attendance', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		if (!student) return res.json({ attendance: [], stats: {} });

		const schoolId = student.school_id || resolveSchoolId(req);
		const snap = await db().collection('attendance')
			.where('school_id', '==', schoolId)
			.get();

		// Filter for records that include this student
		const records = [];
		let present = 0, absent = 0, total = 0;

		snap.docs.forEach(doc => {
			const data = doc.data();
			// Attendance records may store student-level info in an array
			if (Array.isArray(data.students)) {
				const entry = data.students.find(s => s.studentId === student.id);
				if (entry) {
					total++;
					if (entry.status === 'present') present++;
					else absent++;
					records.push({
						id: doc.id,
						date: data.date,
						status: entry.status,
						className: data.className,
						section: data.section,
					});
				}
			} else if (data.studentId === student.id) {
				total++;
				if (data.status === 'present') present++;
				else absent++;
				records.push({ id: doc.id, ...data });
			}
		});

		res.json({
			attendance: records,
			stats: {
				present,
				absent,
				total,
				percentage: total > 0 ? Math.round((present / total) * 100) : 0,
			},
		});
	} catch (error) {
		console.error('[student] Attendance fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load attendance' });
	}
});

// GET /api/student/grades — exam results for the student
router.get('/grades', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		if (!student) return res.json({ grades: [] });

		const schoolId = student.school_id || resolveSchoolId(req);
		const snap = await db().collection('exam_results')
			.where('school_id', '==', schoolId)
			.where('studentId', '==', student.id)
			.get();

		const grades = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		res.json({ grades });
	} catch (error) {
		console.error('[student] Grades fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load grades' });
	}
});

// GET /api/student/assignments — assignments for the student's class
router.get('/assignments', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		if (!student) return res.json({ assignments: [] });

		const schoolId = student.school_id || resolveSchoolId(req);
		const constraints = [
			db().collection('assignments')
				.where('school_id', '==', schoolId)
				.where('className', '==', student.class)
				.get(),
		];

		const snap = (await Promise.all(constraints))[0];
		let assignments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		// Filter by section if available
		if (student.section) {
			assignments = assignments.filter(a =>
				!a.section || a.section === student.section || a.section === 'All'
			);
		}

		// Also fetch submissions for this student
		const subsSnap = await db().collection('assignment_submissions')
			.where('school_id', '==', schoolId)
			.where('studentId', '==', student.id)
			.get();
		const submissions = {};
		subsSnap.docs.forEach(doc => {
			const data = doc.data();
			submissions[data.assignmentId] = { id: doc.id, ...data };
		});

		res.json({ assignments, submissions });
	} catch (error) {
		console.error('[student] Assignments fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load assignments' });
	}
});

// POST /api/student/assignments/:id/submit
router.post('/assignments/:id/submit', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		if (!student) return res.status(400).json({ error: 'Student record not found' });

		const schoolId = student.school_id || resolveSchoolId(req);
		const submissionRef = db().collection('assignment_submissions').doc();
		const payload = {
			id: submissionRef.id,
			assignmentId: req.params.id,
			studentId: student.id,
			studentName: student.name,
			school_id: schoolId,
			...req.body,
			submittedAt: new Date().toISOString(),
			status: 'submitted',
		};

		await submissionRef.set(payload);
		res.json({ submission: payload });
	} catch (error) {
		console.error('[student] Assignment submit failed:', error);
		res.status(500).json({ error: error.message || 'Failed to submit assignment' });
	}
});

// GET /api/student/timetable — timetable for the student's class
router.get('/timetable', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		if (!student) return res.json({ timetable: [] });

		const schoolId = student.school_id || resolveSchoolId(req);
		const snap = await db().collection('timetable')
			.where('school_id', '==', schoolId)
			.where('className', '==', student.class)
			.where('section', '==', student.section || 'A')
			.get();

		const timetable = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		res.json({ timetable });
	} catch (error) {
		console.error('[student] Timetable fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load timetable' });
	}
});

// GET /api/student/fees — fee records for the student
router.get('/fees', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		if (!student) return res.json({ fees: [], payments: [] });

		const schoolId = student.school_id || resolveSchoolId(req);

		// Fetch fee structures for the student's class
		const structSnap = await db().collection('fee_structures')
			.where('school_id', '==', schoolId)
			.get();
		const structures = structSnap.docs
			.map(doc => ({ id: doc.id, ...doc.data() }))
			.filter(f => !f.className || f.className === student.class || f.className === 'All');

		// Fetch payments made by this student
		const paySnap = await db().collection('fee_payments')
			.where('school_id', '==', schoolId)
			.where('studentId', '==', student.id)
			.get();
		const payments = paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		res.json({ fees: structures, payments });
	} catch (error) {
		console.error('[student] Fees fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load fees' });
	}
});

// GET /api/student/announcements — announcements for the student
router.get('/announcements', async (req, res) => {
	try {
		const student = await resolveStudent(req);
		const schoolId = (student && student.school_id) || resolveSchoolId(req);
		if (!schoolId) return res.json({ announcements: [] });

		const snap = await db().collection('announcements')
			.where('school_id', '==', schoolId)
			.get();

		// Filter for student-visible announcements
		const announcements = snap.docs
			.map(doc => ({ id: doc.id, ...doc.data() }))
			.filter(a =>
				!a.targetAudience ||
				a.targetAudience === 'all' ||
				a.targetAudience === 'students' ||
				(Array.isArray(a.targetAudience) && (a.targetAudience.includes('all') || a.targetAudience.includes('students')))
			);

		res.json({ announcements });
	} catch (error) {
		console.error('[student] Announcements fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load announcements' });
	}
});

module.exports = router;

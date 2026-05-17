const express = require('express');
const router = express.Router();
const { admin, verifyFirebaseToken } = require('../utils/firebaseAdmin');

let _db;
function db() {
    if (!_db) _db = admin.firestore();
    return _db;
}

function resolveSchoolId(req) {
    return req.schoolId || req.firebaseUser?.school_id || null;
}

function resolveOrganizationId(req) {
    return req.organizationId || req.firebaseUser?.organization_id || null;
}

/**
 * Resolves the Firestore CollectionReference for a module.
 * Uses nested path: /organizations/{oid}/schools/{sid}/{module}
 * Throws if the path cannot be fully resolved — NEVER writes to root.
 */
async function getModuleCollection(req, collectionName) {
    let schoolId = resolveSchoolId(req);
    let orgId = resolveOrganizationId(req);

    // Robust fallback: If orgId is missing but schoolId is present,
    // use a collectionGroup query to find the school doc across all organizations.
    // (Schools are stored at /organizations/{orgId}/schools/{schoolId}, NOT at root /schools)
    if (!orgId && schoolId) {
        try {
            const schoolSnaps = await db().collectionGroup('schools')
                .where('id', '==', schoolId)
                .limit(1)
                .get();
            if (!schoolSnaps.empty) {
                const schoolDoc = schoolSnaps.docs[0];
                const sd = schoolDoc.data();
                // Extract orgId from the document path: organizations/{orgId}/schools/{schoolId}
                const pathSegments = schoolDoc.ref.path.split('/');
                orgId = sd.organization_id || sd.organizationId || pathSegments[1];
                console.log(`[schoolAdmin] Resolved orgId '${orgId}' from collectionGroup for school '${schoolId}'`);
            }
        } catch (err) {
            console.warn(`[schoolAdmin] Failed to resolve orgId fallback for ${schoolId}:`, err.message);
        }
    }

    if (orgId && schoolId) {
        return db().collection('organizations').doc(orgId).collection('schools').doc(schoolId).collection(collectionName);
    }

    // NEVER fall back to root — this causes data to be stored in the wrong location.
    console.error(`[schoolAdmin] CRITICAL: Cannot resolve nested path for '${collectionName}'. Org: '${orgId}', School: '${schoolId}'`);
    throw new Error(`Missing organization or school context for '${collectionName}'. Ensure x-organization-id and x-school-id headers are set.`);
}

// All routes scoped to req.schoolId (from x-school-id header)

// Students
router.get('/students', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}

		const studentsSnap = await (await getModuleCollection(req, 'students'))
			.where('school_id', '==', schoolId)
			.get();

		const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		res.json({ students, schoolId });
	} catch (error) {
		console.error('[schoolAdmin] Students fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to load students' });
	}
});
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

		const admissionsSnap = await (await getModuleCollection(req, 'admissions'))
			.where('school_id', '==', schoolId)
			.get();

		const admissions = admissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

		const admissionsColl = await getModuleCollection(req, 'admissions');
		const admissionRef = admissionsColl.doc();
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
router.get('/fees/structures', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}
		const coll = await getModuleCollection(req, 'fee_structures');
		const snap = await coll.where('school_id', '==', schoolId).get();
		const feeStructures = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		res.json({ feeStructures, schoolId });
	} catch (error) {
		console.error('[schoolAdmin] Fee structures fetch failed:', error);
		res.status(500).json({ error: error.message || 'Failed to fetch fee structures' });
	}
});

router.post('/fees/structures', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}

		const structure = req.body;
		if (!structure || !structure.class || !structure.academicYear) {
			return res.status(400).json({ error: 'Class and Academic Year are required for fee structure' });
		}

		const coll = await getModuleCollection(req, 'fee_structures');
		
		// Check for duplicate
		const duplicateSnap = await coll
			.where('class', '==', structure.class)
			.where('academicYear', '==', structure.academicYear)
			.where('school_id', '==', schoolId)
			.get();
		
		if (!duplicateSnap.empty) {
			return res.status(400).json({ error: `Fee structure already exists for ${structure.class} under academic year ${structure.academicYear}` });
		}

		const ref = coll.doc();
		const payload = {
			...structure,
			id: ref.id,
			school_id: schoolId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		await ref.set(payload);
		res.json({ success: true, feeStructure: payload });
	} catch (error) {
		console.error('[schoolAdmin] Fee structure creation failed:', error);
		res.status(500).json({ error: error.message || 'Failed to create fee structure' });
	}
});

router.put('/fees/structures/:id', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}
		const coll = await getModuleCollection(req, 'fee_structures');
		const ref = coll.doc(req.params.id);
		const snap = await ref.get();
		if (!snap.exists) {
			return res.status(404).json({ error: 'Fee structure not found' });
		}
		
		const updates = req.body;
		const payload = {
			...updates,
			updated_at: new Date().toISOString(),
		};
		await ref.update(payload);
		res.json({ success: true, message: 'Fee structure updated' });
	} catch (error) {
		console.error('[schoolAdmin] Fee structure update failed:', error);
		res.status(500).json({ error: error.message || 'Failed to update fee structure' });
	}
});

router.delete('/fees/structures/:id', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}
		const coll = await getModuleCollection(req, 'fee_structures');
		const ref = coll.doc(req.params.id);
		await ref.delete();
		res.json({ success: true, message: 'Fee structure deleted' });
	} catch (error) {
		console.error('[schoolAdmin] Fee structure deletion failed:', error);
		res.status(500).json({ error: error.message || 'Failed to delete fee structure' });
	}
});

router.post('/fees/payments', verifyFirebaseToken, async (req, res) => {
	try {
		const schoolId = resolveSchoolId(req);
		if (!schoolId) {
			return res.status(400).json({ error: 'Missing school context' });
		}

		const payment = req.body;
		if (!payment || !payment.studentId || !payment.amount) {
			return res.status(400).json({ error: 'Student ID and Payment Amount are required' });
		}

		const amount = parseFloat(payment.amount) || 0;
		if (amount <= 0) {
			return res.status(400).json({ error: 'Payment amount must be greater than zero' });
		}

		// 1. Get the student document to check balance
		const studentColl = await getModuleCollection(req, 'students');
		const studentDoc = await studentColl.doc(payment.studentId).get();
		if (!studentDoc.exists) {
			return res.status(404).json({ error: 'Student not found' });
		}
		const student = studentDoc.data();

		// 2. Fetch all existing payments for the student to calculate balanceDue
		const paymentsColl = await getModuleCollection(req, 'fee_payments');
		const existingPaymentsSnap = await paymentsColl
			.where('studentId', '==', payment.studentId)
			.get();

		let paidAmount = 0;
		existingPaymentsSnap.forEach(doc => {
			paidAmount += parseFloat(doc.data().amount || doc.data().totalAmount || 0);
		});

		// Calculate student's total fee
		let totalFee = parseFloat(student.totalFeeSnapshot || student.totalFee || 0);
		if (totalFee === 0) {
			// fallback dynamic calculation if snapshot is missing
			const structuresColl = await getModuleCollection(req, 'fee_structures');
			const studentClass = (student.class || '').replace(/^Class\s+/i, '');
			const targetYear = student.academicYear;
			const structuresSnap = await structuresColl.get();
			let classStructure = null;
			structuresSnap.forEach(doc => {
				const s = doc.data();
				if (s.class?.replace(/^Class\s+/i, '') === studentClass && s.academicYear === targetYear) {
					classStructure = s;
				}
			});
			if (!classStructure) {
				structuresSnap.forEach(doc => {
					const s = doc.data();
					if (s.class?.replace(/^Class\s+/i, '') === studentClass) {
						classStructure = s;
					}
				});
			}

			if (classStructure) {
				const selectedFees = student.selectedFees;
				const useSelectedOnly = Array.isArray(selectedFees);
				const legacyFees = ['Admission Fee', 'Annual Fee', 'Monthly Fee', 'Quarterly Fee', 'Transport Fee', 'Daycare Fee', 'Activity Fee'];
				const hasFee = (feeName) => useSelectedOnly ? selectedFees.includes(feeName) : legacyFees.includes(feeName);

				totalFee = 
					(hasFee('Admission Fee') ? (parseFloat(classStructure.admissionFee) || 0) : 0) +
					(hasFee('Annual Fee') ? (parseFloat(classStructure.annualFee) || 0) : 0) +
					(hasFee('Monthly Fee') ? ((parseFloat(classStructure.monthlyFee) || 0) * 12) : 0) +
					(hasFee('Quarterly Fee') ? ((parseFloat(classStructure.quarterlyFee) || 0) * 4) : 0) +
					(hasFee('Transport Fee') ? ((parseFloat(classStructure.transportFee) || 0) * 12) : 0) +
					(hasFee('Daycare Fee') ? ((parseFloat(classStructure.daycareFee) || 0) * 12) : 0) +
					(hasFee('Activity Fee') ? ((parseFloat(classStructure.activityFee) || 0) * 12) : 0);
			}
		}

		const balanceDue = Math.max(0, totalFee - paidAmount);

		if (amount > balanceDue + 0.01) {
			return res.status(400).json({ 
				error: `Validation Failed: Payment amount of ₹${amount} exceeds the remaining balance due of ₹${balanceDue.toFixed(2)}.` 
			});
		}

		// 3. Generate receipt number
		const receiptNo = payment.receiptNo || `REC${new Date().getFullYear()}${String(existingPaymentsSnap.size + 1).padStart(4, '0')}`;

		// 4. Create the payment payload
		const paymentRef = paymentsColl.doc();
		const newPayment = {
			id: paymentRef.id,
			school_id: schoolId,
			studentId: payment.studentId,
			studentName: student.name || payment.studentName || '',
			admissionNo: student.admissionNo || payment.admissionNo || '',
			class: student.class || payment.class || '',
			receiptNo,
			amount,
			paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
			paymentMode: payment.paymentMode || 'cash',
			transactionId: payment.transactionId || null,
			collectedBy: payment.collectedBy || '',
			feeType: payment.feeType || 'General Fee',
			discount: parseFloat(payment.discount) || 0,
			lateFee: parseFloat(payment.lateFee) || 0,
			totalAmount: amount,
			status: (amount < balanceDue) ? 'partial' : 'paid',
			academicYear: payment.academicYear || student.academicYear || '',
			notes: payment.notes || '',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		await paymentRef.set(newPayment);

		// 5. Notify Parent
		if (student.parentId) {
			const notificationsColl = await getModuleCollection(req, 'notifications');
			const notificationRef = notificationsColl.doc();
			await notificationRef.set({
				id: notificationRef.id,
				school_id: schoolId,
				userId: student.parentId,
				type: 'fee',
				title: 'Fee Payment Received',
				message: `Payment of ₹${amount} received. Receipt No: ${receiptNo}`,
				date: newPayment.paymentDate,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			});
		}

		res.json({ success: true, payment: newPayment });
	} catch (error) {
		console.error('[schoolAdmin] Payment processing failed:', error);
		res.status(500).json({ error: error.message || 'Failed to process payment' });
	}
});

// Reports
router.get('/reports', (req, res) => res.json({ report: {}, schoolId: req.schoolId }));

module.exports = router;

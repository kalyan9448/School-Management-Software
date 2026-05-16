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
router.get('/fees', (req, res) => res.json({ feeStructures: [], schoolId: req.schoolId }));
router.post('/fees', (req, res) => res.json({ message: 'Create fee structure' }));

// Reports
router.get('/reports', (req, res) => res.json({ report: {}, schoolId: req.schoolId }));

module.exports = router;

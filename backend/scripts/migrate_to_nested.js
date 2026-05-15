const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * MIGRATION PLAN
 * --------------
 * 1. Map all existing schools to their organizations.
 * 2. Migrate /schools/{sid} to /organizations/{oid}/schools/{sid}
 * 3. Migrate all school-scoped collections to:
 *    /organizations/{oid}/schools/{sid}/{collection}/{docId}
 */

const SCOPED_COLLECTIONS = [
    'students',
    'teachers',
    'attendance',
    'lessons',
    'assignments',
    'assignment_submissions',
    'exams',
    'exam_results',
    'exam_scores',
    'quizzes',
    'quiz_attempts',
    'quiz_results',
    'fee_payments',
    'fee_structures',
    'fee_invoices',
    'announcements',
    'enquiries',
    'admissions',
    'calendar',
    'notifications',
    'timetable',
    'school_settings',
    'academic_years',
    'student_enrollments',
    'audit_logs'
];

async function migrate() {
    console.log('🚀 Starting Data Migration to Nested Architecture...');

    // 1. Fetch all top-level schools to build the lookup map
    console.log('--- Step 1: Mapping Schools to Organizations ---');
    const schoolsSnap = await db.collection('schools').get();
    const schoolToOrgMap = {};
    const schoolDocs = [];

    for (const doc of schoolsSnap.docs) {
        const data = doc.data();
        const schoolId = doc.id;
        // Try to find organization ID in the school doc
        const orgId = data.organizationId || data.organization_id || 'DEFAULT_ORG';
        schoolToOrgMap[schoolId] = orgId;
        schoolDocs.push({ id: schoolId, orgId, data });
        console.log(`Mapped School ${schoolId} -> Org ${orgId}`);
    }

    // 2. Migrate School Documents
    console.log('\n--- Step 2: Migrating Schools to Nested Paths ---');
    for (const school of schoolDocs) {
        const newPath = `organizations/${school.orgId}/schools/${school.id}`;
        await db.doc(newPath).set({
            ...school.data,
            organization_id: school.orgId // Ensure field matches new naming convention
        }, { merge: true });
        console.log(`Migrated School: ${school.id} -> ${newPath}`);
    }

    // 3. Migrate Scoped Collections
    console.log('\n--- Step 3: Migrating Scoped Collections ---');
    for (const collectionName of SCOPED_COLLECTIONS) {
        console.log(`\nProcessing collection: ${collectionName}...`);
        const snap = await db.collection(collectionName).get();
        
        if (snap.empty) {
            console.log(`Collection ${collectionName} is empty. Skipping.`);
            continue;
        }

        let count = 0;
        const batchSize = 500;
        let batch = db.batch();

        for (const doc of snap.docs) {
            const data = doc.data();
            const schoolId = data.school_id;

            if (!schoolId) {
                console.warn(`[${collectionName}] Doc ${doc.id} has no school_id. Skipping.`);
                continue;
            }

            const orgId = schoolToOrgMap[schoolId];
            if (!orgId) {
                console.warn(`[${collectionName}] Doc ${doc.id} references unknown school ${schoolId}. Skipping.`);
                continue;
            }

            const newPath = `organizations/${orgId}/schools/${schoolId}/${collectionName}/${doc.id}`;
            const newRef = db.doc(newPath);
            
            batch.set(newRef, {
                ...data,
                organization_id: orgId // Ensure consistency
            });
            
            count++;

            if (count % batchSize === 0) {
                await batch.commit();
                batch = db.batch();
                console.log(`Committed batch of ${batchSize} for ${collectionName}...`);
            }
        }

        if (count % batchSize !== 0) {
            await batch.commit();
        }
        console.log(`Finished ${collectionName}: Migrated ${count} documents.`);
    }

    console.log('\n✅ Migration Complete!');
    console.log('Note: Top-level collections were NOT deleted. Please verify data in the new structure before manual deletion.');
}

migrate().catch(err => {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
});

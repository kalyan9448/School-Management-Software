#!/usr/bin/env node
// =============================================================================
// Migration: Add school_id to all school-scoped Firestore documents
//
// Usage:
//   node scripts/migrate-add-school-id.js <DEFAULT_SCHOOL_ID>
//
// Example:
//   node scripts/migrate-add-school-id.js SCH001
//
// This script:
// 1. Reads all documents in each school-scoped collection
// 2. Skips documents that already have a school_id
// 3. Sets school_id to the provided default for documents missing it
// 4. Prints a summary of changes
//
// Prerequisites:
//   - Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key path
//   - Or place serviceAccountKey.json in the project root
// =============================================================================

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// -- Config -------------------------------------------------------------------

const SCHOOL_SCOPED_COLLECTIONS = [
    'students',
    'teachers',
    'classes',
    'subjects',
    'attendance',
    'lessons',
    'assignments',
    'assignment_submissions',
    'exams',
    'exam_results',
    'fee_structures',
    'fee_payments',
    'fee_invoices',
    'announcements',
    'enquiries',
    'events',
    'notifications',
    'timetable',
    'quizzes',
    'quiz_results',
    'school_settings',
    'academic_years',
    'student_enrollments',
    'audit_logs',
];

// Collections that should NOT be migrated (global):
// - users (global user registry)
// - schools (each doc IS a school)
// - organizations (superadmin-only, global)

// -- Main ---------------------------------------------------------------------

async function main() {
    const defaultSchoolId = process.argv[2];
    if (!defaultSchoolId) {
        console.error('Usage: node scripts/migrate-add-school-id.js <DEFAULT_SCHOOL_ID>');
        console.error('');
        console.error('Example: node scripts/migrate-add-school-id.js SCH001');
        console.error('');
        console.error('Find your school ID by checking the "schools" collection in Firestore Console.');
        process.exit(1);
    }

    // Initialize Firebase Admin
    let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
        // Try common locations
        const candidates = [
            path.join(__dirname, '..', 'serviceAccountKey.json'),
            path.join(__dirname, '..', 'service-account-key.json'),
            path.join(__dirname, '..', 'firebase-admin-key.json'),
        ];
        serviceAccountPath = candidates.find(p => fs.existsSync(p));
    }

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        initializeApp({ credential: cert(serviceAccount) });
    } else {
        // Try default credentials (e.g., when running on GCP or with gcloud auth)
        initializeApp();
    }

    const db = getFirestore();
    const dryRun = process.argv.includes('--dry-run');

    if (dryRun) {
        console.log('=== DRY RUN MODE — no changes will be made ===\n');
    }

    console.log(`Default school_id: ${defaultSchoolId}`);
    console.log(`Collections to migrate: ${SCHOOL_SCOPED_COLLECTIONS.length}\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const collName of SCHOOL_SCOPED_COLLECTIONS) {
        process.stdout.write(`Processing ${collName}...`);

        try {
            const snapshot = await db.collection(collName).get();

            if (snapshot.empty) {
                console.log(` empty (0 docs)`);
                continue;
            }

            let updated = 0;
            let skipped = 0;
            const batch = db.batch();
            let batchCount = 0;

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();

                if (data.school_id) {
                    skipped++;
                    continue;
                }

                if (!dryRun) {
                    batch.update(docSnap.ref, { school_id: defaultSchoolId });
                    batchCount++;

                    // Firestore batches are limited to 500 operations
                    if (batchCount >= 500) {
                        await batch.commit();
                        batchCount = 0;
                    }
                }
                updated++;
            }

            if (!dryRun && batchCount > 0) {
                await batch.commit();
            }

            console.log(` ${snapshot.size} docs — ${updated} updated, ${skipped} already had school_id`);
            totalUpdated += updated;
            totalSkipped += skipped;
        } catch (err) {
            console.log(` ERROR: ${err.message}`);
            totalErrors++;
        }
    }

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total documents updated: ${totalUpdated}`);
    console.log(`Total documents skipped (already had school_id): ${totalSkipped}`);
    console.log(`Collections with errors: ${totalErrors}`);

    if (dryRun) {
        console.log('\nThis was a dry run. Run without --dry-run to apply changes.');
    }
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

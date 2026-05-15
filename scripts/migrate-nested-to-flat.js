#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// -- Configuration ------------------------------------------------------------

const NESTED_COLLECTIONS = [
  'academic_years', 'admissions', 'announcements', 'attendance', 'classes', 
  'conversations', 'enquiries', 'fee_payments', 'fee_structures', 'lessons', 
  'notifications', 'quiz_results', 'school_admin_reports', 'school_settings', 
  'students', 'subject_mappings', 'teacher_class_checkins', 'teachers', 'timetable'
];

// -- Initialize Firebase Admin ------------------------------------------------

const serviceAccountPath = path.resolve(__dirname, '../backend/serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found in backend directory.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// -- Main ---------------------------------------------------------------------

async function migrate() {
  console.log('=== NESTED TO FLAT DATA MIGRATION ===\n');
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('*** DRY RUN MODE - NO CHANGES WILL BE MADE ***\n');

  const orgSnap = await db.collection('organizations').get();
  console.log(`Processing ${orgSnap.size} organizations...\n`);

  let totalMigrated = 0;

  for (const orgDoc of orgSnap.docs) {
    const orgId = orgDoc.id;
    const orgName = orgDoc.data().name;
    console.log(`Org: ${orgName} (${orgId})`);

    const schoolsSnap = await orgDoc.ref.collection('schools').get();
    console.log(`  Found ${schoolsSnap.size} schools.`);

    for (const schoolDoc of schoolsSnap.docs) {
      const schoolId = schoolDoc.id;
      const schoolData = schoolDoc.data();
      const schoolName = schoolData.name;
      console.log(`  School: ${schoolName} (${schoolId})`);

      // Migrate school doc itself to root
      if (!dryRun) {
        await db.collection('schools').doc(schoolId).set(schoolData, { merge: true });
        console.log(`    ✓ Migrated school record to root.`);
      }

      for (const collName of NESTED_COLLECTIONS) {
        const nestedSnap = await schoolDoc.ref.collection(collName).get();
        if (nestedSnap.empty) continue;

        console.log(`    Migrating ${nestedSnap.size} docs from '${collName}'...`);
        
        const BATCH_LIMIT = 500;
        let batch = db.batch();
        let count = 0;

        for (const docSnap of nestedSnap.docs) {
          const data = docSnap.data();
          // Inject school_id
          data.school_id = schoolId;
          
          if (!dryRun) {
            const rootRef = db.collection(collName).doc(docSnap.id);
            batch.set(rootRef, data, { merge: true });
            count++;

            if (count % BATCH_LIMIT === 0) {
              await batch.commit();
              batch = db.batch();
            }
          } else {
            count++;
          }
        }

        if (!dryRun && count % BATCH_LIMIT !== 0) {
          await batch.commit();
        }
        
        console.log(`    ✓ Migrated ${count} docs.`);
        totalMigrated += count;
      }
    }
  }

  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`Total documents processed: ${totalMigrated}`);
  if (dryRun) console.log('\nRun without --dry-run to apply changes.');
  process.exit(0);
}

migrate().catch(console.error);

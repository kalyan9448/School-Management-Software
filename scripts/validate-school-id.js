#!/usr/bin/env node
// =============================================================================
// validate-school-id.js — Data consistency check for multi-tenancy
// =============================================================================
// Scans all school-scoped Firestore collections and reports:
//   - Documents with missing school_id
//   - Documents with null/empty school_id
//   - Documents with school_id not matching any known school
//
// Usage:
//   node scripts/validate-school-id.js                 # full report
//   node scripts/validate-school-id.js --fix <SCHOOL>  # auto-fix: set missing to <SCHOOL>
//
// Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account key
// =============================================================================

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// -- Configuration ------------------------------------------------------------

const SCHOOL_SCOPED_COLLECTIONS = [
  'users',
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

// -- Parse CLI ----------------------------------------------------------------

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');
const fixSchoolId = fixMode ? args[args.indexOf('--fix') + 1] : null;

if (fixMode && !fixSchoolId) {
  console.error('Error: --fix requires a school_id argument');
  console.error('Usage: node scripts/validate-school-id.js --fix SCH001');
  process.exit(1);
}

// -- Init Firebase Admin ------------------------------------------------------

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('Error: Set GOOGLE_APPLICATION_CREDENTIALS to your service account key file.');
  process.exit(1);
}

initializeApp({ credential: cert(require(serviceAccountPath)) });
const db = getFirestore();

// -- Main ---------------------------------------------------------------------

async function main() {
  console.log('=== Multi-Tenancy Data Consistency Check ===\n');

  // 1. Fetch known schools
  const schoolsSnap = await db.collection('schools').get();
  const validSchoolIds = new Set(schoolsSnap.docs.map(d => d.id));
  console.log(`Known schools (${validSchoolIds.size}): ${[...validSchoolIds].join(', ')}\n`);

  const report = {
    totalDocs: 0,
    healthy: 0,
    missing: [],    // { collection, docId }
    nullOrEmpty: [], // { collection, docId, value }
    mismatched: [],  // { collection, docId, school_id }
  };

  for (const collName of SCHOOL_SCOPED_COLLECTIONS) {
    const snap = await db.collection(collName).get();
    for (const docSnap of snap.docs) {
      report.totalDocs++;
      const data = docSnap.data();
      const sid = data.school_id;

      if (sid === undefined) {
        report.missing.push({ collection: collName, docId: docSnap.id });
      } else if (sid === null || sid === '') {
        report.nullOrEmpty.push({ collection: collName, docId: docSnap.id, value: sid });
      } else if (!validSchoolIds.has(sid)) {
        report.mismatched.push({ collection: collName, docId: docSnap.id, school_id: sid });
      } else {
        report.healthy++;
      }
    }
  }

  // -- Print report -----------------------------------------------------------

  console.log(`Total documents scanned: ${report.totalDocs}`);
  console.log(`Healthy (valid school_id): ${report.healthy}`);
  console.log(`Missing school_id:         ${report.missing.length}`);
  console.log(`Null/empty school_id:      ${report.nullOrEmpty.length}`);
  console.log(`Mismatched school_id:      ${report.mismatched.length}\n`);

  if (report.missing.length > 0) {
    console.log('--- Missing school_id ---');
    for (const r of report.missing) {
      console.log(`  ${r.collection}/${r.docId}`);
    }
    console.log();
  }

  if (report.nullOrEmpty.length > 0) {
    console.log('--- Null/Empty school_id ---');
    for (const r of report.nullOrEmpty) {
      console.log(`  ${r.collection}/${r.docId}  (value: ${JSON.stringify(r.value)})`);
    }
    console.log();
  }

  if (report.mismatched.length > 0) {
    console.log('--- school_id not matching any known school ---');
    for (const r of report.mismatched) {
      console.log(`  ${r.collection}/${r.docId}  (school_id: "${r.school_id}")`);
    }
    console.log();
  }

  const totalIssues = report.missing.length + report.nullOrEmpty.length + report.mismatched.length;

  if (totalIssues === 0) {
    console.log('ALL DOCUMENTS PASS. No issues found.');
    process.exit(0);
  }

  // -- Fix mode ---------------------------------------------------------------

  if (fixMode) {
    if (!validSchoolIds.has(fixSchoolId)) {
      console.warn(`WARNING: "${fixSchoolId}" is not in the schools collection. Proceeding anyway.`);
    }

    const toFix = [...report.missing, ...report.nullOrEmpty];
    console.log(`Fixing ${toFix.length} documents (setting school_id = "${fixSchoolId}")...\n`);

    const BATCH_LIMIT = 500;
    let batch = db.batch();
    let count = 0;

    for (const item of toFix) {
      const ref = db.collection(item.collection).doc(item.docId);
      batch.update(ref, { school_id: fixSchoolId });
      count++;

      if (count % BATCH_LIMIT === 0) {
        await batch.commit();
        console.log(`  Committed batch (${count} / ${toFix.length})`);
        batch = db.batch();
      }
    }

    if (count % BATCH_LIMIT !== 0) {
      await batch.commit();
    }

    console.log(`\nFixed ${toFix.length} documents.`);

    if (report.mismatched.length > 0) {
      console.log(`\n${report.mismatched.length} mismatched documents were NOT auto-fixed.`);
      console.log('Review these manually — they have a school_id that does not match any known school.');
    }
  } else {
    console.log(`Found ${totalIssues} issue(s). Run with --fix <SCHOOL_ID> to repair missing/empty values.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

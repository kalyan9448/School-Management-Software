/**
 * Migration Script: Moves orphaned admissions from root to nested multi-tenant path.
 * Path: /admissions -> /organizations/{orgId}/schools/{schoolId}/admissions
 * 
 * IMPORTANT: This script requires the 'schools' collectionGroup index to be deployed.
 */
const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function migrateAdmissions(dryRun = true) {
    console.log(`Starting migration (Dry Run: ${dryRun})...`);
    
    const rootSnap = await db.collection('admissions').get();
    console.log(`Found ${rootSnap.size} admissions in root collection.`);
    
    if (rootSnap.size === 0) {
        console.log('Nothing to migrate.');
        return;
    }

    const schoolToOrgMap = new Map();

    for (const rootDoc of rootSnap.docs) {
        const data = rootDoc.data();
        const schoolId = data.school_id;

        if (!schoolId) {
            console.warn(`[SKIP] Admission ${rootDoc.id} (${data.name}) has no school_id.`);
            continue;
        }

        // Resolve Org ID for this school
        let orgId = schoolToOrgMap.get(schoolId);
        if (!orgId) {
            try {
                const schoolSnaps = await db.collectionGroup('schools')
                    .where('id', '==', schoolId)
                    .limit(1)
                    .get();
                
                if (schoolSnaps.empty) {
                    console.warn(`[SKIP] Could not find school '${schoolId}' for admission '${data.name}'.`);
                    continue;
                }

                const schoolDoc = schoolSnaps.docs[0];
                const pathSegments = schoolDoc.ref.path.split('/');
                orgId = pathSegments[1]; // organizations/{orgId}/schools/{schoolId}
                schoolToOrgMap.set(schoolId, orgId);
            } catch (err) {
                console.error(`[ERROR] Failed to resolve orgId for school '${schoolId}'. Ensure indexes are deployed!`, err.message);
                continue;
            }
        }

        const nestedPath = `organizations/${orgId}/schools/${schoolId}/admissions/${rootDoc.id}`;
        console.log(`[MOVE] ${data.name} (${rootDoc.id}) -> ${nestedPath}`);

        if (!dryRun) {
            await db.doc(nestedPath).set(data);
            await rootDoc.ref.delete();
            console.log(`[DONE] Migrated ${rootDoc.id}`);
        }
    }

    console.log('\nMigration Summary:');
    if (dryRun) {
        console.log('No data was changed. Run with migrateAdmissions(false) to execute.');
    } else {
        console.log('Migration completed successfully.');
    }
}

// Execute live migration
migrateAdmissions(false).catch(console.error);

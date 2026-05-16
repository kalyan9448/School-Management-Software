const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function debugAdmissions() {
    console.log('--- FIRESTORE DEBUG ---');
    
    // 1. Root admissions
    const rootSnap = await db.collection('admissions').get();
    console.log(`Root admissions count: ${rootSnap.size}`);
    rootSnap.docs.forEach(doc => {
        const d = doc.data();
        console.log(`[ROOT] ID: ${doc.id}, Name: ${d.name}, School: ${d.school_id}, Year: ${d.academicYear}`);
    });

    // 2. Nested admissions (Collection Group)
    try {
        const groupSnap = await db.collectionGroup('admissions').get();
        console.log(`Total admissions (all paths): ${groupSnap.size}`);
        groupSnap.docs.forEach(doc => {
            const d = doc.data();
            console.log(`[NESTED] Path: ${doc.ref.path}, Name: ${d.name}, School: ${d.school_id}, Year: ${d.academicYear}`);
        });
    } catch (e) {
        console.log('Collection group query for admissions failed (index likely not ready):', e.message);
    }

    // 3. Schools check (to see if we can resolve orgId)
    try {
        const schoolsSnap = await db.collectionGroup('schools').get();
        console.log(`Total schools found: ${schoolsSnap.size}`);
        schoolsSnap.docs.forEach(doc => {
            console.log(`[SCHOOL] ID: ${doc.id}, Path: ${doc.ref.path}`);
        });
    } catch (e) {
        console.log('Collection group query for schools failed (index likely not ready):', e.message);
    }
}

debugAdmissions().catch(console.error);

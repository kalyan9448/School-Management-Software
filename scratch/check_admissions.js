const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function checkAdmissions() {
    console.log('Checking root admissions...');
    const rootSnap = await db.collection('admissions').get();
    console.log(`Found ${rootSnap.size} admissions in root collection.`);
    
    if (rootSnap.size > 0) {
        rootSnap.docs.forEach(doc => {
            const data = doc.data();
            console.log(` - ID: ${doc.id}, Name: ${data.name}, School: ${data.school_id}`);
        });
    }

    console.log('\nChecking nested admissions (collection group)...');
    try {
        const groupSnap = await db.collectionGroup('admissions').get();
        console.log(`Found ${groupSnap.size} admissions total across all paths.`);
        groupSnap.docs.forEach(doc => {
            console.log(` - Path: ${doc.ref.path}, Name: ${doc.data().name}`);
        });
    } catch (err) {
        console.error('Collection group query failed (likely missing index):', err.message);
    }
}

checkAdmissions();

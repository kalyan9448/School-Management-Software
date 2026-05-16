const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function checkAdmissionsDetailed() {
    console.log('Checking ALL admissions...');
    const snap = await db.collectionGroup('admissions').get();
    console.log(`Total: ${snap.size}`);
    snap.docs.forEach(doc => {
        const d = doc.data();
        console.log(`- ${d.name} (${d.school_id}) Year: ${d.academicYear} Path: ${doc.ref.path}`);
    });
}

checkAdmissionsDetailed().catch(console.error);

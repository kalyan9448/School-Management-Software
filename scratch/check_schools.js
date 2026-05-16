const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function checkSchoolNames() {
    const schoolsSnap = await db.collectionGroup('schools').get();
    schoolsSnap.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}, Name: ${d.school_name || d.name}, Path: ${doc.ref.path}`);
    });
}

checkSchoolNames().catch(console.error);

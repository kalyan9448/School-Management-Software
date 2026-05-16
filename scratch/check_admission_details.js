const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function checkAdmission() {
    console.log('Checking admission Fags07R7ixogtkvua51U...');
    const doc = await db.collection('admissions').doc('Fags07R7ixogtkvua51U').get();
    if (!doc.exists) {
        console.log('Document not found in root');
        return;
    }
    const data = doc.data();
    console.log('Data:', data);
}

checkAdmission().catch(console.error);

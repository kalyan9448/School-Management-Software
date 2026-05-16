const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function checkStudent() {
    console.log('Checking student Chinni in root...');
    const snap = await db.collection('students').where('name', '==', 'Chinni').get();
    if (snap.empty) {
        console.log('Student not found in root');
    } else {
        snap.docs.forEach(doc => {
            console.log(`ID: ${doc.id}`);
            console.log(doc.data());
        });
    }
}

checkStudent().catch(console.error);

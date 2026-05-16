const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function checkUser() {
    console.log('Checking user kondapur@gmail.com...');
    const snap = await db.collection('users').where('email', '==', 'kondapur@gmail.com').get();
    if (snap.empty) {
        console.log('User not found');
        return;
    }
    snap.docs.forEach(doc => {
        console.log(`ID: ${doc.id}`);
        console.log(doc.data());
    });
}

checkUser().catch(console.error);

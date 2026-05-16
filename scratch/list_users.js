const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function listAllUsers() {
    console.log('Listing all users...');
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users.`);
    usersSnap.forEach(doc => {
        console.log(` - ${doc.data().email} (Role: ${doc.data().role}, School: ${doc.data().school_id})`);
    });
}

listAllUsers().catch(console.error);

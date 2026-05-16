const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function findUser() {
    console.log('Searching for user kondapur1@gmail.com...');
    const usersSnap = await db.collection('users').where('email', '==', 'kondapur1@gmail.com').get();
    
    if (usersSnap.empty) {
        console.log('User NOT found in root /users collection.');
        // Maybe in organizations? (No, users are usually global)
    } else {
        usersSnap.forEach(doc => {
            console.log(`Found user: ${doc.id}`);
            console.log(doc.data());
        });
    }
}

findUser().catch(console.error);

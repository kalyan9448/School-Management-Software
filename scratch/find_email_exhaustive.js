const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function findEmail() {
    console.log('Searching for kondapur1@gmail.com...');
    const collections = ['users', 'admins', 'staff', 'teachers'];
    for (const c of collections) {
        const snap = await db.collection(c).get();
        snap.docs.forEach(doc => {
            if (doc.data().email === 'kondapur1@gmail.com') {
                console.log(`FOUND in ${c}/${doc.id}`);
                console.log(doc.data());
            }
        });
    }
    
    // Check collection groups
    const cgUsers = await db.collectionGroup('users').get();
    cgUsers.docs.forEach(doc => {
        if (doc.data().email === 'kondapur1@gmail.com') {
            console.log(`FOUND in CollectionGroup users: ${doc.ref.path}`);
            console.log(doc.data());
        }
    });
}

findEmail().catch(console.error);

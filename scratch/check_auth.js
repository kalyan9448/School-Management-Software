const { admin } = require('../backend/src/utils/firebaseAdmin');

async function findUserInAuth() {
    console.log('Searching for kondapur1@gmail.com in Auth...');
    try {
        const user = await admin.auth().getUserByEmail('kondapur1@gmail.com');
        console.log('User found in Auth:');
        console.log(user);
        console.log('Custom Claims:', user.customClaims);
    } catch (e) {
        console.log('User NOT found in Auth:', e.message);
    }
}

findUserInAuth().catch(console.error);

const { admin } = require('../backend/src/utils/firebaseAdmin');

async function searchUsers() {
    console.log('Searching for any user with "kondapur"...');
    const listUsersResult = await admin.auth().listUsers(1000);
    listUsersResult.users.forEach((userRecord) => {
        if (userRecord.email && userRecord.email.includes('kondapur')) {
            console.log(`Found: ${userRecord.email} (UID: ${userRecord.uid})`);
        }
    });
}

searchUsers().catch(console.error);

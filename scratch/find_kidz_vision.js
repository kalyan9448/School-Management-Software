const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function findKidzVision() {
    console.log('Searching for Kidz Vision in all schools...');
    const schools = await db.collectionGroup('schools').get();
    for (const school of schools.docs) {
        const data = school.data();
        if (JSON.stringify(data).toLowerCase().includes('kidz vision')) {
            console.log(`FOUND!! Path: ${school.ref.path}`);
            console.log(data);
        }
    }
    
    console.log('Searching in organizations...');
    const orgs = await db.collection('organizations').get();
    for (const org of orgs.docs) {
        const data = org.data();
        if (JSON.stringify(data).toLowerCase().includes('kidz vision')) {
            console.log(`FOUND in Organization!! Path: ${org.ref.path}`);
            console.log(data);
        }
    }
}

findKidzVision().catch(console.error);

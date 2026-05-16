const { admin } = require('../backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function findKidzVision() {
    console.log('Searching for Kidz Vision...');
    
    // Check organizations
    const orgs = await db.collection('organizations').get();
    for (const org of orgs.docs) {
        const schools = await org.ref.collection('schools').get();
        for (const school of schools.docs) {
            const data = school.data();
            if (JSON.stringify(data).includes('Kidz Vision')) {
                console.log(`FOUND in ${school.ref.path}`);
                console.log(data);
            }
        }
    }

    // Check root schools
    const rootSchools = await db.collection('schools').get();
    for (const school of rootSchools.docs) {
        const data = school.data();
        if (JSON.stringify(data).includes('Kidz Vision')) {
            console.log(`FOUND in root path ${school.ref.path}`);
            console.log(data);
        }
    }
}

findKidzVision().catch(console.error);

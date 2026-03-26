const admin = require('firebase-admin');

// Hardcoded for debug based on .env
const projectId = 'school-management-82b09';

if (!admin.apps.length) {
    admin.initializeApp({ projectId });
}

const db = admin.firestore();

async function run() {
    console.log(`Using Project ID: ${projectId}`);
    const email = 'sujith@gmail.com';
    
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) {
        console.log('User not found.');
    } else {
        snapshot.forEach(doc => {
            console.log(`User ID: ${doc.id}`);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        });
    }

    console.log('\nRecent admissions (students collection):');
    const students = await db.collection('students').limit(5).get();
    students.forEach(doc => {
        console.log(`Student ${doc.id}: school_id=${doc.data().school_id}, name=${doc.data().name}`);
    });
}

run().catch(console.error);

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(fs.readFileSync('c:/BristleTech/School Management Software/backend/serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function verifyPersistence(studentName) {
    console.log(`Verifying persistence for: "${studentName}"`);
    
    // 1. Check Global Collections
    const globalAdmissions = await db.collection('admissions')
        .where('firstName', '==', studentName.split(' ')[0])
        .get();
    
    const globalStudents = await db.collection('students')
        .where('firstName', '==', studentName.split(' ')[0])
        .get();

    console.log(`\n--- Global Scope (ROOT) ---`);
    console.log(`Global Admissions found: ${globalAdmissions.size}`);
    globalAdmissions.forEach(doc => console.log(` - [!] LEAK: ${doc.id} (Name: ${doc.data().firstName})`));
    
    console.log(`Global Students found: ${globalStudents.size}`);
    globalStudents.forEach(doc => console.log(` - [!] LEAK: ${doc.id} (Name: ${doc.data().firstName})`));

    // 2. Check Nested Collections
    const orgId = 'ORG002';
    const schoolId = 'SCH005';
    
    const nestedAdmissions = await db.collection('organizations').doc(orgId)
        .collection('schools').doc(schoolId)
        .collection('admissions')
        .where('firstName', '>=', studentName.split(' ')[0])
        .get();
    
    const nestedStudents = await db.collection('organizations').doc(orgId)
        .collection('schools').doc(schoolId)
        .collection('students')
        .where('firstName', '>=', studentName.split(' ')[0])
        .get();

    console.log(`\n--- Nested Scope (organizations/${orgId}/schools/${schoolId}/...) ---`);
    console.log(`Nested Admissions found: ${nestedAdmissions.size}`);
    nestedAdmissions.forEach(doc => {
        const data = doc.data();
        if (data.firstName + ' ' + data.lastName === studentName || data.firstName === studentName) {
            console.log(` - [OK] Found in Admissions: ${doc.id} (Name: ${data.firstName} ${data.lastName})`);
        }
    });

    console.log(`Nested Students found: ${nestedStudents.size}`);
    nestedStudents.forEach(doc => {
        const data = doc.data();
        if (data.firstName + ' ' + data.lastName === studentName || data.firstName === studentName) {
            console.log(` - [OK] Found in Students: ${doc.id} (Name: ${data.firstName} ${data.lastName})`);
        }
    });

    if (globalAdmissions.size === 0 && globalStudents.size === 0) {
        console.log(`\nSUCCESS: No data leaked to global scope for "${studentName}".`);
    } else {
        console.log(`\nFAILURE: Data leaked to global scope!`);
    }
}

verifyPersistence("Demo Student Persistence Test")
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

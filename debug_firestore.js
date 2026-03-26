require('dotenv').config({ path: './backend/.env' });
const { admin } = require('./backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function checkUser(email) {
    console.log(`Checking user: ${email}...`);
    try {
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (snapshot.empty) {
            console.log('User document not found in "users" collection!');
            return;
        }
        snapshot.forEach(doc => {
            console.log('Document ID:', doc.id);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        });

        console.log('\nChecking schools collection...');
        const schools = await db.collection('schools').get();
        schools.forEach(doc => {
            console.log('School ID:', doc.id);
            console.log('Name:', doc.data().name);
            console.log('Emails:', [doc.data().email, doc.data().principalEmail, doc.data().principalGmail, doc.data().principal_email].filter(Boolean));
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser('sujith@gmail.com');

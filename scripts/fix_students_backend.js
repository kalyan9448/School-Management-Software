require('dotenv').config({ path: './backend/.env' });
const { admin } = require('./backend/src/utils/firebaseAdmin');
const db = admin.firestore();

async function fixStudents() {
    console.log("Fetching all students...");
    try {
        const snapshot = await db.collection('students').get();
        console.log(`Found ${snapshot.size} students.`);
        
        let fixedCount = 0;
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.academicYear) {
                console.log(`Fixing student ${doc.id} (${data.name || 'No Name'})...`);
                batch.update(doc.ref, {
                    academicYear: '2024-2025'
                });
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            await batch.commit();
            console.log(`Successfully fixed ${fixedCount} students.`);
        } else {
            console.log("No students needed fixing.");
        }
    } catch (err) {
        console.error('Error fixing students:', err);
    }
}

fixStudents();

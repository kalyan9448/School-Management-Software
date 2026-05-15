const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve('serviceAccountKey.json'), 'utf8'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateUsersWithOrgId() {
    console.log('🚀 Starting User Organization Context Update...');
    
    // 1. Map schools to organizations
    const schoolToOrgMap = {};
    const schoolsSnap = await db.collection('schools').get();
    for (const doc of schoolsSnap.docs) {
        const data = doc.data();
        const orgId = data.organization_id || data.organizationId;
        if (orgId) {
            schoolToOrgMap[doc.id] = orgId;
        }
    }
    console.log(`Mapped ${Object.keys(schoolToOrgMap).length} schools.`);

    // 2. Update users
    const usersSnap = await db.collection('users').get();
    let count = 0;
    
    for (const doc of usersSnap.docs) {
        const data = doc.data();
        const schoolId = data.school_id;
        
        if (schoolId && schoolToOrgMap[schoolId]) {
            const orgId = schoolToOrgMap[schoolId];
            if (data.organization_id !== orgId) {
                await doc.ref.update({ 
                    organization_id: orgId,
                    updated_at: new Date().toISOString()
                });
                
                // Also update custom claims for this user if possible
                try {
                    await admin.auth().setCustomUserClaims(doc.id, {
                        role: data.role,
                        school_id: schoolId,
                        organization_id: orgId
                    });
                } catch (e) {
                    // Auth user might not exist for some Firestore-only profiles
                }
                
                count++;
            }
        }
    }
    
    console.log(`\n✅ Updated ${count} users with organization context and claims.`);
    process.exit(0);
}

updateUsersWithOrgId().catch(err => {
    console.error('❌ Update Failed:', err);
    process.exit(1);
});

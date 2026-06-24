const path = require('path');
const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');
module.paths.unshift(backendNodeModules);

const admin = require('firebase-admin');

try {
  if (require('fs').existsSync(path.join(__dirname, '..', 'backend', 'serviceAccountKey.json'))) {
    const serviceAccount = require(path.join(__dirname, '..', 'backend', 'serviceAccountKey.json'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp({
      projectId: 'school-management-software' // default project id
    });
  }
} catch (err) {
  console.error('Initialization error:', err.message);
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  console.log('--- DIAGNOSTIC DATA ---');
  
  // 1. Get admin@school.com profile in users collection
  const userQuery = await db.collection('users').where('email', '==', 'admin@school.com').get();
  console.log('Admin User Profiles for admin@school.com:');
  userQuery.forEach(doc => {
    console.log('  User:', doc.id, '=>', doc.data());
  });
  
  // Also check if there's any user with UID or document ID equal to the auth UID if we can find it
  // Let's print out all users in the 'users' collection to check document ID keys
  const allUsersQuery = await db.collection('users').get();
  console.log('\nAll User Documents (Count: ' + allUsersQuery.size + '):');
  allUsersQuery.forEach(doc => {
    console.log('  Doc ID:', doc.id, '=> Email:', doc.data().email, 'Role:', doc.data().role, 'School ID:', doc.data().school_id);
  });
  
  // 2. Get support tickets
  const ticketsQuery = await db.collection('support_tickets').get();
  console.log('\nSupport Tickets in DB:', ticketsQuery.size);
  ticketsQuery.forEach(doc => {
    const data = doc.data();
    console.log(`Ticket ID: ${doc.id}`);
    console.log(`  school_id: "${data.school_id}"`);
    console.log(`  ticketType: "${data.ticketType}"`);
    console.log(`  userId: "${data.userId}"`);
    console.log(`  userName: "${data.userName}"`);
    console.log(`  subject: "${data.subject}"`);
    console.log(`  status: "${data.status}"`);
  });
  
  process.exit(0);
}

run();

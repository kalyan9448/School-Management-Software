const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRootDir = path.join(__dirname, '..', 'backups', `firestore-backup-${timestamp}`);

if (!fs.existsSync(backupRootDir)) {
  fs.mkdirSync(backupRootDir, { recursive: true });
}

/**
 * Recursively backups a collection and its subcollections
 * @param {admin.firestore.CollectionReference} collectionRef 
 * @param {string} targetPath 
 */
async function backupCollection(collectionRef, targetPath) {
  const collectionId = collectionRef.id;
  console.log(`[BACKUP] Processing collection: ${collectionId} at ${targetPath}`);
  
  const snapshot = await collectionRef.get();
  const docsData = {};
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Convert Timestamps to ISO strings for JSON compatibility
    for (const key in data) {
      if (data[key] instanceof admin.firestore.Timestamp) {
        data[key] = data[key].toDate().toISOString();
      }
    }

    docsData[doc.id] = {
      data: data,
      subcollections: []
    };
    
    // Recursively handle subcollections
    const subcollections = await doc.ref.listCollections();
    if (subcollections.length > 0) {
      const docSubDir = path.join(targetPath, collectionId, doc.id);
      if (!fs.existsSync(docSubDir)) {
        fs.mkdirSync(docSubDir, { recursive: true });
      }
      
      for (const subColl of subcollections) {
        docsData[doc.id].subcollections.push(subColl.id);
        await backupCollection(subColl, docSubDir);
      }
    }
  }
  
  // Save the main collection data to a JSON file
  const filePath = path.join(targetPath, `${collectionId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(docsData, null, 2));
}

async function runFullBackup() {
  console.log('====================================================');
  console.log(`Starting Firestore Backup: ${new Date().toLocaleString()}`);
  console.log(`Target Directory: ${backupRootDir}`);
  console.log('====================================================');

  try {
    const rootCollections = await db.listCollections();
    console.log(`Found ${rootCollections.length} root collections.`);

    for (const coll of rootCollections) {
      await backupCollection(coll, backupRootDir);
    }

    console.log('====================================================');
    console.log('SUCCESS: Backup completed successfully!');
    console.log(`Files are located in: ${backupRootDir}`);
    console.log('====================================================');
  } catch (error) {
    console.error('====================================================');
    console.error('ERROR: Backup failed!');
    console.error(error);
    console.error('====================================================');
    process.exit(1);
  }
}

runFullBackup();

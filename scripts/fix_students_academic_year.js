import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixStudents() {
  console.log("Fetching all students...");
  const snap = await getDocs(collection(db, 'students'));
  console.log(`Found ${snap.size} students.`);
  
  let fixedCount = 0;
  for (const studentDoc of snap.docs) {
    const data = studentDoc.data();
    if (!data.academicYear) {
      console.log(`Fixing student ${studentDoc.id} (${data.name || 'No Name'})...`);
      await updateDoc(doc(db, 'students', studentDoc.id), {
        academicYear: '2024-2025'
      });
      fixedCount++;
    }
  }
  
  console.log(`Finished. Fixed ${fixedCount} students.`);
}

fixStudents().catch(console.error);

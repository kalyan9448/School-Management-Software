import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, where } from "firebase/firestore";
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

async function checkStudents() {
  const schoolId = 'SMSS'; // This seems to be the school code from the screenshot: "CODE: SMSS"
  console.log(`Checking students for school_id: ${schoolId}`);
  
  const q = query(collection(db, 'students'), where('school_id', '==', schoolId));
  const snap = await getDocs(q);
  
  console.log(`Found ${snap.size} students`);
  snap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

checkStudents().catch(console.error);

import { db } from './src/services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function checkStudents() {
  const email = 'venkatreddy'; // The email from the screenshot (partially shown)
  // Actually, the screenshot shows "venkatreddy" as the parent name/login.
  // I'll search for all students first.
  
  const q = query(collection(db, 'students'));
  const snapshot = await getDocs(q);
  console.log('Total students:', snapshot.size);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}, Name: ${data.name}, ParentEmail: ${data.parentEmail}, ParentId: ${data.parentId}`);
  });
}

checkStudents();

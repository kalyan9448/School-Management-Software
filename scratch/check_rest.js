const https = require('https');

const url = 'https://firestore.googleapis.com/v1/projects/school-management-82b09/databases/(default)/documents/support_tickets';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('--- FIRESTORE DOCUMENTS ---');
      if (!json.documents) {
        console.log('No documents found or public read is blocked.');
        console.log(JSON.stringify(json, null, 2));
      } else {
        console.log(`Found ${json.documents.length} tickets:`);
        json.documents.forEach((doc, idx) => {
          const fields = doc.fields;
          const name = doc.name.split('/').pop();
          console.log(`\n[${idx + 1}] Document ID: ${name}`);
          console.log(`    school_id:  "${fields.school_id?.stringValue || 'N/A'}"`);
          console.log(`    schoolName: "${fields.schoolName?.stringValue || 'N/A'}"`);
          console.log(`    subject:    "${fields.subject?.stringValue || 'N/A'}"`);
          console.log(`    userName:   "${fields.userName?.stringValue || 'N/A'}"`);
        });
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});

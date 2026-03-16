const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  const dirPath = path.resolve(dir);
  fs.readdirSync(dirPath).forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

const targetDir = 'c:\\BristleTech\\School Management Software\\src\\student-dashboard';

walkDir(targetDir, filePath => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Replace from "@/"
    if (content.includes('from "@/')) {
      content = content.replace(/from "@\//g, 'from "@/student-dashboard/');
      hasChanges = true;
    }
    
    // Replace import "@/"
    if (content.includes('import "@/')) {
      content = content.replace(/import "@\//g, 'import "@/student-dashboard/');
      hasChanges = true;
    }

    // Single quotes
    if (content.includes("from '@/")) {
      content = content.replace(/from '@\//g, "from '@/student-dashboard/");
      hasChanges = true;
    }
    
    if (content.includes("import '@/")) {
      content = content.replace(/import '@\//g, "import '@/student-dashboard/");
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed imports in', filePath);
    }
  }
});
console.log('Done fixing internal imports.');

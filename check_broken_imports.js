
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = 'c:\\BristleTech\\School Management Software\\src';

function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            checkDirectory(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            checkFile(fullPath);
        }
    }
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+.*?\s+from\s+['"](\..*?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const dir = path.dirname(filePath);
        
        let resolvedPath = path.resolve(dir, importPath);
        const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
        
        let found = false;
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
            found = true;
        } else {
            for (const ext of extensions) {
                if (fs.existsSync(resolvedPath + ext)) {
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) {
            console.log(`Broken import in ${filePath}: ${importPath} (Resolved: ${resolvedPath})`);
        }
    }
}

console.log('Checking for broken relative imports...');
checkDirectory(path.join(root, 'pages', 'student'));
checkDirectory(path.join(root, 'components', 'student'));
checkDirectory(path.join(root, 'layouts'));
checkDirectory(path.join(root, 'routes'));
console.log('Done.');

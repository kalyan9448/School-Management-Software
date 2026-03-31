const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const os = require('os');

function loadServiceAccountFromEnv() {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (rawJson) {
        return JSON.parse(rawJson);
    }

    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64) {
        return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    }

    return null;
}

/**
 * Try to find a service account key file in common locations.
 */
function findServiceAccountFile() {
    const candidates = [
        path.resolve('serviceAccountKey.json'),
        path.resolve('service-account.json'),
        path.resolve('firebase-adminsdk.json'),
        path.resolve('../serviceAccountKey.json'),
        path.resolve('../service-account.json'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            try {
                const data = JSON.parse(fs.readFileSync(p, 'utf8'));
                if (data.type === 'service_account' && data.project_id) return data;
            } catch { /* skip invalid files */ }
        }
    }
    return null;
}

// Initialize Firebase Admin SDK
// Supports credential methods (in order of priority):
//   1. FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_SERVICE_ACCOUNT_BASE64 env var
//   2. Service account key file via GOOGLE_APPLICATION_CREDENTIALS env var
//   3. Auto-discovered service account key file in project directory
//   4. Application Default Credentials (auto-detected on Google Cloud)
if (!admin.apps.length) {
    const envServiceAccount = loadServiceAccountFromEnv();
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'school-management-82b09';

    if (envServiceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(envServiceAccount),
            projectId: envServiceAccount.project_id,
        });
        console.log('[Firebase Admin] Initialized with env-provided service account:', envServiceAccount.client_email);
    } else if (credPath) {
        const resolved = path.resolve(credPath);
        const serviceAccount = require(resolved);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
        console.log('[Firebase Admin] Initialized with service account file:', serviceAccount.client_email);
    } else {
        // Try auto-discovery of service account key files
        const discovered = findServiceAccountFile();
        if (discovered) {
            admin.initializeApp({
                credential: admin.credential.cert(discovered),
                projectId: discovered.project_id,
            });
            console.log('[Firebase Admin] Initialized with discovered service account:', discovered.client_email);
        } else {
            // Last resort: try ADC, then project-only
            try {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId,
                });
                console.log('[Firebase Admin] Initialized with application default credentials');
            } catch {
                admin.initializeApp({ projectId });
                console.log('[Firebase Admin] ⚠ Initialized with project ID only — Firestore/Auth will NOT work!');
                console.log('[Firebase Admin] ⚠ Download a service account key from Firebase Console:');
                console.log('[Firebase Admin] ⚠   https://console.firebase.google.com/project/' + projectId + '/settings/serviceaccounts/adminsdk');
                console.log('[Firebase Admin] ⚠ Save it as backend/serviceAccountKey.json');
            }
        }
    }
}

/**
 * Express middleware — verifies Firebase ID token from Authorization header.
 * Attaches decoded token to req.firebaseUser on success.
 */
async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.firebaseUser = decoded;
        next();
    } catch (err) {
        console.error('Firebase token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { admin, verifyFirebaseToken };

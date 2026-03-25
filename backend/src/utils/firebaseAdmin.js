const admin = require('firebase-admin');
const path = require('path');

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

// Initialize Firebase Admin SDK
// Supports three credential methods (in order of priority):
//   1. Service account key file via GOOGLE_APPLICATION_CREDENTIALS env var
//   2. Explicit projectId from FIREBASE_PROJECT_ID env var (needs ADC or GCE)
//   3. Application Default Credentials (auto-detected on Google Cloud)
if (!admin.apps.length) {
    const envServiceAccount = loadServiceAccountFromEnv();
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (envServiceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(envServiceAccount),
            projectId: envServiceAccount.project_id,
        });
        console.log('[Firebase Admin] Initialized with env-provided service account:', envServiceAccount.client_email);
    } else if (credPath) {
        // Resolve relative to backend/ directory (where the process starts)
        const resolved = path.resolve(credPath);
        const serviceAccount = require(resolved);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
        console.log('[Firebase Admin] Initialized with service account:', serviceAccount.client_email);
    } else {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (projectId) {
            admin.initializeApp({ projectId });
        } else {
            admin.initializeApp();
        }
        console.log('[Firebase Admin] Initialized with default credentials');
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

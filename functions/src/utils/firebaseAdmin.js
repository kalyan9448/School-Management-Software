/**
 * Firebase Admin SDK — simplified for Cloud Functions.
 *
 * In Cloud Functions, admin.initializeApp() with no arguments automatically
 * detects the project credentials. No service account file or env vars needed.
 */

const admin = require('firebase-admin');

// Initialize only once
if (!admin.apps.length) {
    admin.initializeApp();
    console.log('[Firebase Admin] Initialized via Cloud Functions auto-credentials');
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

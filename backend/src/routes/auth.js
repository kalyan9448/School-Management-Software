const express = require('express');
const router = express.Router();
const { admin, verifyFirebaseToken } = require('../utils/firebaseAdmin');

const db = admin.firestore();

/** Determine role from SUPERADMIN_EMAILS env var (comma-separated). */
function resolveRole(email) {
    const list = (process.env.SUPERADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
    return list.includes(email.toLowerCase()) ? 'superadmin' : 'admin';
}

// POST /api/auth/check-email — public (no auth required).
// Called BEFORE the user has signed in to determine whether to show
// the "Create Password" or "Enter Password" screen.
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const trimmed = email.trim();
        const lowered = trimmed.toLowerCase();

        // 1. Check Firestore for a user profile with this email.
        //    Firestore queries are case-sensitive, so try exact match first,
        //    then lowercase (admins may have stored mixed-case emails).
        let snapshot = await db.collection('users')
            .where('email', '==', trimmed)
            .limit(1)
            .get();

        if (snapshot.empty && trimmed !== lowered) {
            snapshot = await db.collection('users')
                .where('email', '==', lowered)
                .limit(1)
                .get();
        }

        if (snapshot.empty) {
            return res.json({ exists: false, isFirstLogin: false });
        }

        const userData = snapshot.docs[0].data();

        // 2. Check if the user has a Firebase Auth account already.
        //    getUserByEmail is case-insensitive on Firebase's side.
        let hasAuthAccount = false;
        try {
            await admin.auth().getUserByEmail(trimmed);
            hasAuthAccount = true;
        } catch (err) {
            if (err.code !== 'auth/user-not-found') throw err;
            // No Firebase Auth account yet → definitely first login
        }

        // First login if: no Firebase Auth account OR profile still flagged
        const isFirstLogin = !hasAuthAccount || userData.isFirstLogin === true;

        return res.json({ exists: true, isFirstLogin });
    } catch (err) {
        console.error('Check-email error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/** Robustly find a school ID by searching multiple possible principal email fields. */
async function findSchoolIdByEmail(email) {
    const trimmed = email.trim();
    const lowered = trimmed.toLowerCase();
    
    // Check possible field names in the schools collection
    const fields = ['email', 'principalEmail', 'principalGmail', 'principal_email'];
    
    for (const field of fields) {
        let q = await db.collection('schools')
            .where(field, '==', trimmed)
            .limit(1)
            .get();
        
        if (q.empty && trimmed !== lowered) {
            q = await db.collection('schools')
                .where(field, '==', lowered)
                .limit(1)
                .get();
        }

        if (!q.empty) return q.docs[0].id;
    }
    return null;
}

// POST /api/auth/login — sync user profile via Admin SDK and return it.
router.post('/login', verifyFirebaseToken, async (req, res) => {
    try {
        const { uid, email, name } = req.firebaseUser;
        const correctRole = resolveRole(email);
        const userRef = db.collection('users').doc(uid);
        const snap = await userRef.get();

        let user;
        if (snap.exists) {
            user = { id: snap.id, ...snap.data() };

            const updates = {};

            // Upgrade to superadmin if the email is in the superadmin list
            if (correctRole === 'superadmin' && user.role !== 'superadmin') {
                updates.role = 'superadmin';
                user.role = 'superadmin';
            }

            // Clear isFirstLogin
            if (user.isFirstLogin) {
                updates.isFirstLogin = false;
                user.isFirstLogin = false;
            }

            // Fallback: If school_id is missing for an admin, try to find it!
            if (user.role === 'admin' && !user.school_id) {
                const assignedSid = await findSchoolIdByEmail(email);
                if (assignedSid) {
                    updates.school_id = assignedSid;
                    user.school_id = assignedSid;
                }
            }

            if (Object.keys(updates).length > 0) {
                updates.updated_at = new Date().toISOString();
                await userRef.update(updates);
            }
        } else {
            // Check if there is an orphaned user doc with this email (from frontend auto-provision)
            const lowered = email.toLowerCase().trim();
            const existingQuery = await db.collection('users')
                .where('email', 'in', [email.trim(), lowered])
                .limit(1)
                .get();

            if (!existingQuery.empty) {
                const existingDoc = existingQuery.docs[0];
                user = { id: uid, ...existingDoc.data() };
                
                // If the auto-provisioned doc was also missing school_id, try finding it
                if (!user.school_id && user.role === 'admin') {
                    user.school_id = await findSchoolIdByEmail(email);
                }

                await userRef.set(user);
                try { await db.collection('users').doc(existingDoc.id).delete(); } catch(e) {}
            } else {
                // Completely new user — search for their school!
                const assignedSchoolId = (correctRole === 'admin') ? await findSchoolIdByEmail(email) : null;

                user = {
                    id: uid,
                    email: email.trim(),
                    name: name || email.split('@')[0] || 'User',
                    role: correctRole,
                    school_id: assignedSchoolId,
                    isFirstLogin: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                await userRef.set(user);
            }
        }

        // Set Firebase Auth custom claims so Firestore security rules can check
        // request.auth.token.role without any extra Firestore reads.
        // Must be done AFTER the profile is finalised so the claim matches the profile.
        await admin.auth().setCustomUserClaims(uid, {
            role: user.role,
            school_id: user.school_id || null,
        });

        res.json({
            user,
            // claimsUpdated signals the client to force-refresh its ID token so
            // Firestore SDK picks up the new custom claims immediately.
            claimsUpdated: true,
            session: { access_token: req.headers.authorization?.split('Bearer ')[1] },
        });
    } catch (err) {
        console.error('Auth login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/profile — return current user's full profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
    try {
        const snap = await db.collection('users').doc(req.firebaseUser.uid).get();
        if (!snap.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

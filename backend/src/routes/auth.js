const express = require('express');
const router = express.Router();
const { admin, verifyFirebaseToken } = require('../utils/firebaseAdmin');

let _db;
function db() {
    if (!_db) _db = admin.firestore();
    return _db;
}

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
//
// Access rule: allow any registered user (in users collection OR any
// auxiliary collection). school_id is NOT required — superadmins have none.
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const trimmed = email.trim();
        const lowered = trimmed.toLowerCase();

        // ── 1. Check /users collection (primary source of truth) ─────────────────
        // Any user with a doc here is a valid registered user — superadmin, admin,
        // teacher, student, parent. Allow them regardless of school_id.
        let snapshot = await db().collection('users')
            .where('email', '==', trimmed)
            .limit(1)
            .get();

        if (snapshot.empty && trimmed !== lowered) {
            snapshot = await db().collection('users')
                .where('email', '==', lowered)
                .limit(1)
                .get();
        }

        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();

            // Check if the user has a Firebase Auth account already.
            let hasAuthAccount = false;
            try {
                await admin.auth().getUserByEmail(trimmed);
                hasAuthAccount = true;
            } catch (err) {
                if (err.code !== 'auth/user-not-found') throw err;
            }

            // First login: no Firebase Auth account yet, or profile still flagged.
            const isFirstLogin = !hasAuthAccount || userData.isFirstLogin === true;
            return res.json({ exists: true, isFirstLogin });
        }

        // ── 2. Not in /users — check auxiliary collections ────────────────────────
        // Users provisioned by admins (teachers created via staff form, students via
        // admission, parents via student's parentEmail, school admins via school form)
        // may not have a /users doc yet. They are allowed in for first-login setup.
        const [teacherInfo, studentInfo, parentSnap, schoolId] = await Promise.all([
            resolveTeacherByEmail(trimmed),
            resolveStudentByEmail(trimmed),
            db().collection('students')
                .where('parentEmail', 'in', [trimmed, lowered])
                .limit(1)
                .get(),
            findSchoolIdByEmail(trimmed),
        ]);

        const foundInSystem = teacherInfo.isTeacher
            || studentInfo.isStudent
            || !parentSnap.empty
            || schoolId !== null;

        if (!foundInSystem) {
            // Not registered anywhere — reject.
            return res.json({
                exists: false,
                isFirstLogin: false,
                error: 'No account found for this email address. Please contact your administrator.',
            });
        }

        // Provisioned in auxiliary collections but no /users doc yet → first login.
        return res.json({ exists: true, isFirstLogin: true });

    } catch (err) {
        console.error('Check-email error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Check the teachers collection for the given email and return the teacher's
 * role + school_id if found.  Used to correctly identify teachers who have not
 * yet been assigned a /users/{uid} profile.
 */
async function resolveTeacherByEmail(email) {
    const lowered = email.trim().toLowerCase();
    let snap = await db().collection('teachers').where('email', '==', lowered).limit(1).get();
    if (snap.empty) {
        // Also try original casing in case data was stored mixed-case
        const trimmed = email.trim();
        if (trimmed !== lowered) {
            snap = await db().collection('teachers').where('email', '==', trimmed).limit(1).get();
        }
    }
    if (!snap.empty) {
        const td = snap.docs[0].data();
        return { isTeacher: true, school_id: td.school_id || null, name: td.name || null };
    }
    return { isTeacher: false, school_id: null, name: null };
}

/**
 * Check the students collection for the given email and return the student's
 * role + school_id if found. Used to correctly identify students who have not
 * yet been assigned a /users/{uid} profile.
 */
async function resolveStudentByEmail(email) {
    const lowered = email.trim().toLowerCase();
    let snap = await db().collection('students').where('email', '==', lowered).limit(1).get();
    if (snap.empty) {
        const trimmed = email.trim();
        if (trimmed !== lowered) {
            snap = await db().collection('students').where('email', '==', trimmed).limit(1).get();
        }
    }
    if (!snap.empty) {
        const sd = snap.docs[0].data();
        return { isStudent: true, school_id: sd.school_id || null, name: sd.name || null };
    }
    return { isStudent: false, school_id: null, name: null };
}

/**
 * Check the students collection's parentEmail field for the given email and
 * return the parent's school_id + the child's name if found.
 * Parents are identified by their child's record, not by their own collection.
 */
async function resolveParentByEmail(email) {
    const trimmed = email.trim();
    const lowered = trimmed.toLowerCase();
    // Try both casings since parentEmail may have been stored mixed-case
    const candidates = [lowered];
    if (trimmed !== lowered) candidates.push(trimmed);
    let snap = await db().collection('students').where('parentEmail', 'in', candidates).limit(1).get();
    if (!snap.empty) {
        const sd = snap.docs[0].data();
        return {
            isParent: true,
            school_id: sd.school_id || null,
            // Use father/mother name as a display fallback; parent name stored separately
            name: sd.fatherName || sd.motherName || null,
        };
    }
    return { isParent: false, school_id: null, name: null };
}

/** Robustly find a school ID by searching multiple possible principal email fields. */
async function findSchoolIdByEmail(email) {
    const trimmed = email.trim();
    const lowered = trimmed.toLowerCase();
    
    // Check possible field names in the schools collection
    const fields = ['email', 'principalEmail', 'principalGmail', 'principal_email'];
    
    for (const field of fields) {
        let q = await db().collection('schools')
            .where(field, '==', trimmed)
            .limit(1)
            .get();
        
        if (q.empty && trimmed !== lowered) {
            q = await db().collection('schools')
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
        const userRef = db().collection('users').doc(uid);
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

            // Correct mis-filed teachers/students: if the profile was saved as 'admin'
            // (the default fallback) but the email exists in the teachers or students
            // collection, update the role so the dashboard redirect is correct.
            if (user.role === 'admin' && correctRole !== 'superadmin') {
                const teacherInfo = await resolveTeacherByEmail(email);
                if (teacherInfo.isTeacher) {
                    updates.role = 'teacher';
                    user.role = 'teacher';
                    if (!user.school_id && teacherInfo.school_id) {
                        updates.school_id = teacherInfo.school_id;
                        user.school_id = teacherInfo.school_id;
                    }
                    if (!user.name && teacherInfo.name) {
                        updates.name = teacherInfo.name;
                        user.name = teacherInfo.name;
                    }
                } else {
                    const studentInfo = await resolveStudentByEmail(email);
                    if (studentInfo.isStudent) {
                        updates.role = 'student';
                        user.role = 'student';
                        if (!user.school_id && studentInfo.school_id) {
                            updates.school_id = studentInfo.school_id;
                            user.school_id = studentInfo.school_id;
                        }
                        if (!user.name && studentInfo.name) {
                            updates.name = studentInfo.name;
                            user.name = studentInfo.name;
                        }
                    }
                }
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
            const existingQuery = await db().collection('users')
                .where('email', 'in', [email.trim(), lowered])
                .limit(1)
                .get();

            if (!existingQuery.empty) {
                const existingDoc = existingQuery.docs[0];
                user = { id: uid, ...existingDoc.data() };

                // Correct mis-filed teachers/students/parents in orphaned docs
                if (user.role === 'admin' && correctRole !== 'superadmin') {
                    const teacherInfo = await resolveTeacherByEmail(email);
                    if (teacherInfo.isTeacher) {
                        user.role = 'teacher';
                        if (!user.school_id && teacherInfo.school_id) user.school_id = teacherInfo.school_id;
                        if (!user.name && teacherInfo.name) user.name = teacherInfo.name;
                    } else {
                        const studentInfo = await resolveStudentByEmail(email);
                        if (studentInfo.isStudent) {
                            user.role = 'student';
                            if (!user.school_id && studentInfo.school_id) user.school_id = studentInfo.school_id;
                            if (!user.name && studentInfo.name) user.name = studentInfo.name;
                        } else {
                            // Check if this is a parent (parentEmail on a student doc)
                            const parentInfo = await resolveParentByEmail(email);
                            if (parentInfo.isParent) {
                                user.role = 'parent';
                                if (!user.school_id && parentInfo.school_id) user.school_id = parentInfo.school_id;
                                if (!user.name && parentInfo.name) user.name = parentInfo.name;
                            }
                        }
                    }
                }

                // If the auto-provisioned doc was also missing school_id, try finding it
                if (!user.school_id && (user.role === 'admin' || user.role === 'student')) {
                    user.school_id = await findSchoolIdByEmail(email);
                }

                await userRef.set(user);
                try { await db().collection('users').doc(existingDoc.id).delete(); } catch(e) {}
            } else {
                // Completely new user — determine role before defaulting to 'admin'.
                // Check teachers collection first so a provisioned teacher who
                // hasn't logged in before gets the right role.
                let finalRole = correctRole; // 'superadmin' or 'admin'
                let resolvedName = name || email.split('@')[0] || 'User';
                let resolvedSchoolId = null;

                if (finalRole !== 'superadmin') {
                    const teacherInfo = await resolveTeacherByEmail(email);
                    if (teacherInfo.isTeacher) {
                        finalRole = 'teacher';
                        resolvedSchoolId = teacherInfo.school_id;
                        if (teacherInfo.name) resolvedName = teacherInfo.name;
                    } else {
                        const studentInfo = await resolveStudentByEmail(email);
                        if (studentInfo.isStudent) {
                            finalRole = 'student';
                            resolvedSchoolId = studentInfo.school_id;
                            if (studentInfo.name) resolvedName = studentInfo.name;
                        } else {
                            // Check if this email is a parent (parentEmail on a student doc)
                            const parentInfo = await resolveParentByEmail(email);
                            if (parentInfo.isParent) {
                                finalRole = 'parent';
                                resolvedSchoolId = parentInfo.school_id;
                                if (parentInfo.name) resolvedName = parentInfo.name;
                            } else {
                                resolvedSchoolId = await findSchoolIdByEmail(email);
                            }
                        }
                    }
                }

                user = {
                    id: uid,
                    email: email.trim(),
                    name: resolvedName,
                    role: finalRole,
                    school_id: resolvedSchoolId,
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

// DELETE /api/auth/user — hard-delete a user's Firebase Auth account + Firestore profile.
// Called by the server-side cascadeDelete when removing a teacher/staff member.
// Requires a valid Bearer token (caller must be authenticated).
router.delete('/user', verifyFirebaseToken, async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'email is required' });
    }
    const lowered = email.trim().toLowerCase();
    const errors = [];

    // 1. Delete Firebase Auth account (look up by email — Admin SDK is case-insensitive)
    try {
        const authUser = await admin.auth().getUserByEmail(lowered);
        await admin.auth().deleteUser(authUser.uid);
    } catch (err) {
        if (err.code !== 'auth/user-not-found') {
            errors.push(`Firebase Auth delete: ${err.message}`);
        }
        // user-not-found is fine — treat as already gone
    }

    // 2. Delete Firestore /users doc(s) matching this email
    try {
        let snap = await db().collection('users').where('email', '==', lowered).get();
        if (snap.empty) {
            snap = await db().collection('users').where('email', '==', email.trim()).get();
        }
        await Promise.all(snap.docs.map(d => d.ref.delete()));
    } catch (err) {
        errors.push(`Firestore users delete: ${err.message}`);
    }

    if (errors.length > 0) {
        return res.status(207).json({ message: 'Partial delete', errors });
    }
    res.json({ message: 'User deleted successfully' });
});

// GET /api/auth/profile — return current user's full profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
    try {
        const snap = await db().collection('users').doc(req.firebaseUser.uid).get();
        if (!snap.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

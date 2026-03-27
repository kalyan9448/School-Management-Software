// =============================================================================
// Firestore Data Service — replaces localStorage-based centralDataService
// All data is stored in and fetched from Firebase Firestore.
// Multi-tenancy: school-scoped data is filtered by school_id.
// =============================================================================

import { db } from '../services/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    documentId,
    Timestamp,
    type DocumentData,
    type QueryConstraint,
} from 'firebase/firestore';

// Re-export all interfaces from centralDataService (they stay the same)
export type {
    User,
    Student,
    Teacher,
    Class,
    Subject,
    AttendanceRecord,
    LessonLog,
    Assignment,
    AssignmentSubmission,
    Exam,
    ExamResult,
    FeeStructure,
    FeeComponent,
    FeePayment,
    Announcement,
    Enquiry,
    Event,
    Notification,
    DayOfWeek,
    TimetableSlot,
    Admission,
    SubjectMappingRecord,
} from './centralDataService';
import { getActiveAcademicYearId } from './classUtils';

// Re-export new production interfaces from types
export type {
    SchoolSettings,
    AcademicYear,
    StudentEnrollment,
    FeeInvoice,
    FeeInvoiceItem,
    AuditLog,
} from '../types';

import type {
    User,
    Student,
    Teacher,
    Class,
    Subject,
    AttendanceRecord,
    LessonLog,
    Assignment,
    AssignmentSubmission,
    Exam,
    ExamResult,
    FeeStructure,
    FeePayment,
    Announcement,
    Enquiry,
    Event,
    Notification,
    TimetableSlot,
    Admission,
    SubjectMappingRecord,
} from './centralDataService';

import type {
    SchoolSettings,
    AcademicYear,
    StudentEnrollment,
    FeeInvoice,
    AuditLog,
} from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Collections that are global (not scoped to a single school). */
const GLOBAL_COLLECTIONS = new Set(['users', 'schools', 'organizations']);

function getSchoolId(): string {
    return sessionStorage.getItem('active_school_id') || '';
}

/** Returns school_id or throws if not set. Ensures multi-tenant queries are always scoped. */
function requireSchoolId(): string {
    const sid = getSchoolId();
    if (!sid) throw new Error('No active school selected. Please select a school first.');
    return sid;
}

/** Remove keys whose value is undefined — Firestore rejects undefined field values. */
function stripUndefined(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/**
 * Fetch all docs from a collection, optionally filtered. Returns typed array.
 * Automatically injects school_id filter for school-scoped collections.
 */
async function fetchCollection<T>(
    collectionName: string,
    ...constraints: QueryConstraint[]
): Promise<T[]> {
    const allConstraints = GLOBAL_COLLECTIONS.has(collectionName)
        ? constraints
        : [where('school_id', '==', requireSchoolId()), ...constraints];
    const q = allConstraints.length > 0
        ? query(collection(db, collectionName), ...allConstraints)
        : collection(db, collectionName);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
}

/**
 * Add a doc with auto-generated ID. Returns the doc with its new ID.
 * Automatically injects school_id for school-scoped collections.
 * Uses setDoc instead of addDoc+updateDoc to avoid a two-step write
 * that can be blocked by Firestore security rules on the update step.
 */
async function createDoc<T extends { id: string }>(
    collectionName: string,
    data: Omit<T, 'id'> & { id?: string },
): Promise<T> {
    const { id: _unused, ...rest } = data as any;
    const payload = GLOBAL_COLLECTIONS.has(collectionName)
        ? rest
        : { ...rest, school_id: requireSchoolId() };
    // Generate a new doc reference to get a unique ID
    const ref = doc(collection(db, collectionName));
    // Write id + payload in a single atomic setDoc (no follow-up updateDoc needed)
    const fullPayload = stripUndefined({ ...payload, id: ref.id });
    await setDoc(ref, fullPayload);
    return { id: ref.id, ...payload } as T;
}

/** Set a doc with a specific ID. Auto-injects school_id for school-scoped collections. */
async function setDocById<T>(
    collectionName: string,
    id: string,
    data: Partial<T>,
): Promise<void> {
    const payload = GLOBAL_COLLECTIONS.has(collectionName)
        ? data
        : { ...data, school_id: requireSchoolId() };
    await setDoc(doc(db, collectionName, id), stripUndefined(payload as Record<string, any>), { merge: true });
}

/** Update specific fields of a doc. Verifies school_id ownership for school-scoped collections. */
async function updateDocById(
    collectionName: string,
    id: string,
    updates: Record<string, any>,
): Promise<void> {
    if (!GLOBAL_COLLECTIONS.has(collectionName)) {
        const snap = await getDoc(doc(db, collectionName, id));
        if (!snap.exists()) throw new Error(`Document ${collectionName}/${id} not found`);
        const docSchoolId = (snap.data() as any).school_id;
        const currentSchoolId = requireSchoolId();
        if (docSchoolId && docSchoolId !== currentSchoolId) {
            throw new Error('Access denied: document belongs to a different school');
        }
        // Prevent school_id from being changed via update
        delete updates.school_id;
    }
    await updateDoc(doc(db, collectionName, id), stripUndefined(updates));
}

/** Delete a doc by ID. Verifies school_id ownership for school-scoped collections. */
async function deleteDocById(collectionName: string, id: string): Promise<void> {
    if (!GLOBAL_COLLECTIONS.has(collectionName)) {
        const snap = await getDoc(doc(db, collectionName, id));
        if (!snap.exists()) return;
        const docSchoolId = (snap.data() as any).school_id;
        const currentSchoolId = requireSchoolId();
        if (docSchoolId && docSchoolId !== currentSchoolId) {
            throw new Error('Access denied: document belongs to a different school');
        }
    }
    await deleteDoc(doc(db, collectionName, id));
}

/** Get a single doc by ID. Verifies school_id ownership for school-scoped collections. */
async function getDocById<T>(collectionName: string, id: string): Promise<T | null> {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) return null;
    if (!GLOBAL_COLLECTIONS.has(collectionName)) {
        const docSchoolId = (snap.data() as any).school_id;
        const currentSchoolId = requireSchoolId();
        if (docSchoolId && docSchoolId !== currentSchoolId) {
            return null; // Silently deny cross-school reads
        }
    }
    return { id: snap.id, ...snap.data() } as T;
}

// ==================== USER SERVICE ====================

export const userService = {
    getAll: async (): Promise<User[]> => {
        // Filter by active school so non-superadmin users only see their school's users.
        // Superadmins with no active_school_id get all users (Firestore rules permit it).
        const schoolId = getSchoolId();
        if (schoolId) {
            return fetchCollection<User>('users', where('school_id', '==', schoolId));
        }
        return fetchCollection<User>('users');
    },

    getByEmail: async (email: string): Promise<User | null> => {
        const schoolId = getSchoolId();
        const constraints: QueryConstraint[] = [where('email', '==', email)];
        if (schoolId) {
            constraints.push(where('school_id', '==', schoolId));
        }
        const users = await fetchCollection<User>('users', ...constraints);
        return users[0] || null;
    },

    create: async (user: Partial<User>): Promise<User> => {
        // Check for existing user with same email
        if (user.email) {
            const existing = await userService.getByEmail(user.email);
            if (existing) return existing;
        }
        // Ensure school_id is set: use caller's value, fall back to active school
        const schoolId = user.school_id || getSchoolId() || '';
        const newUser: Omit<User, 'id'> & { id?: string } = {
            email: (user.email || '').trim().toLowerCase(),
            name: user.name || '',
            role: user.role || 'student',
            isFirstLogin: user.isFirstLogin ?? true,
            school_id: schoolId,
            parentId: user.parentId || '',
            childrenIds: user.childrenIds || [],
        };
        return createDoc<User>('users', newUser);
    },

    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
        await updateDocById('users', id, updates);
        return getDocById<User>('users', id);
    },
};

// ==================== SCHOOL SERVICE ====================

export const schoolService = {
    getAll: async (): Promise<any[]> => {
        return fetchCollection<any>('schools');
    },

    getById: async (id: string): Promise<any | null> => {
        return getDocById<any>('schools', id);
    },

    create: async (school: any): Promise<any> => {
        // Use the caller-provided id (e.g. "SCH001") as the Firestore doc id
        // so the UI id and the persisted id always match.
        const schoolId = school.id || doc(collection(db, 'schools')).id;
        const { id: _stripId, ...rest } = school;

        // Normalize email to lowercase for consistent lookups across the system
        const adminEmail = (school.principalEmail || school.email || '').trim().toLowerCase();

        const payload = {
            ...rest,
            id: schoolId,
            // Store as both 'email' and 'principalEmail' so every lookup path works
            email: adminEmail || rest.email,
            principalEmail: adminEmail || rest.principalEmail,
            status: school.status || 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await setDoc(doc(db, 'schools', schoolId), payload);

        // Auto-create admin user for the school.
        // This is a best-effort operation — if it fails (e.g. due to Firestore
        // rules before custom claims are set), the school still gets created
        // and the admin account can be provisioned on the user's first login.
        if (adminEmail) {
            try {
                await userService.create({
                    email: adminEmail,
                    name: school.principalName || school.principal || '',
                    role: 'admin',
                    school_id: schoolId,
                    isFirstLogin: true,
                });
            } catch (err) {
                console.warn('Auto-provisioning admin user failed (school was still created):', err);
            }
        }

        return { id: schoolId, ...payload };
    },

    update: async (id: string, updates: any): Promise<void> => {
        await updateDocById('schools', id, { ...updates, updated_at: new Date().toISOString() });
    },

    delete: async (id: string): Promise<void> => {
        await deleteDocById('schools', id);
    },
};

// ==================== ORGANIZATION SERVICE ====================

export const organizationService = {
    getAll: async (): Promise<any[]> => {
        return fetchCollection<any>('organizations');
    },

    create: async (org: any): Promise<any> => {
        // Use the caller-provided id (e.g. "ORG001") as the Firestore doc id so the
        // UI id and the persisted id always match — same pattern as schoolService.create().
        const orgId = org.id || doc(collection(db, 'organizations')).id;
        const { id: _strip, ...rest } = org;
        const payload = {
            ...rest,
            id: orgId,
            created_at: new Date().toISOString(),
        };
        await setDoc(doc(db, 'organizations', orgId), payload);
        return { id: orgId, ...payload };
    },

    getById: async (id: string): Promise<any | null> => {
        const snap = await getDoc(doc(db, 'organizations', id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() };
    },

    update: async (id: string, updates: any): Promise<void> => {
        await updateDocById('organizations', id, updates);
    },

    delete: async (id: string): Promise<void> => {
        await deleteDocById('organizations', id);
    },
};

// ==================== STUDENT SERVICE ====================

export const studentService = {
    getAll: async (): Promise<Student[]> => {
        return fetchCollection<Student>('students');
    },

    getById: async (id: string): Promise<Student | null> => {
        return getDocById<Student>('students', id);
    },

    getByClass: async (className: string, section: string): Promise<Student[]> => {
        return fetchCollection<Student>(
            'students',
            where('class', '==', className),
            where('section', '==', section),
        );
    },

    getByParentId: async (parentId: string): Promise<Student[]> => {
        return fetchCollection<Student>('students', where('parentId', '==', parentId));
    },

    getByIds: async (ids: string[]): Promise<Student[]> => {
        if (!ids.length) return [];
        // Firestore 'in' queries support max 30 items
        const results: Student[] = [];
        for (let i = 0; i < ids.length; i += 30) {
            const batch = ids.slice(i, i + 30);
            const docs = await fetchCollection<Student>('students', where(documentId(), 'in', batch));
            results.push(...docs);
        }
        return results;
    },

    getByParentEmail: async (email: string): Promise<Student[]> => {
        if (!email) return [];
        return fetchCollection<Student>('students', where('parentEmail', '==', email));
    },

    getNextRollNumber: async (className: string, section: string, academicYear: string): Promise<string> => {
        const students = await fetchCollection<Student>(
            'students',
            where('class', '==', className),
            where('section', '==', section),
        );
        const classStudents = students.filter(s => s.academicYear === academicYear);
        if (classStudents.length === 0) return '001';
        const rollNumbers = classStudents.map(s => parseInt(s.rollNo)).filter(n => !isNaN(n));
        if (rollNumbers.length === 0) return '001';
        return String(Math.max(...rollNumbers) + 1).padStart(3, '0');
    },

    isRollNumberUnique: async (
        rollNo: string,
        className: string,
        section: string,
        academicYear: string,
        excludeStudentId?: string,
    ): Promise<boolean> => {
        const students = await studentService.getByClass(className, section);
        return !students.find(
            s => s.rollNo === rollNo && s.academicYear === academicYear && s.id !== excludeStudentId,
        );
    },

    create: async (student: Partial<Student>): Promise<Student> => {
        const allStudents = await studentService.getAll();
        const rollNo = student.rollNo ||
            await studentService.getNextRollNumber(student.class || '', student.section || 'A', student.academicYear || getActiveAcademicYearId());

        const newStudent: Omit<Student, 'id'> & { id?: string } = {
            admissionNo: student.admissionNo || `KVS${new Date().getFullYear()}${String(allStudents.length + 1).padStart(3, '0')}`,
            name: student.name || '',
            rollNo,
            class: student.class || '',
            section: student.section || '',
            dateOfBirth: student.dateOfBirth || '',
            gender: student.gender || 'male',
            fatherName: student.fatherName || '',
            motherName: student.motherName || '',
            parentPhone: student.parentPhone || '',
            parentEmail: student.parentEmail || '',
            email: student.email || '',
            parentId: student.parentId || '',
            address: student.address || '',
            admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
            academicYear: student.academicYear || getActiveAcademicYearId(),
            status: student.status || 'active',
            photo: student.photo || '',
            bloodGroup: student.bloodGroup || '',
            medicalInfo: student.medicalInfo as any,
        };
        return createDoc<Student>('students', newStudent);
    },

    update: async (id: string, updates: Partial<Student>): Promise<Student | null> => {
        await updateDocById('students', id, updates);
        return getDocById<Student>('students', id);
    },

    delete: async (id: string): Promise<boolean> => {
        await deleteDocById('students', id);
        return true;
    },
};

// ==================== ADMISSION SERVICE ====================

export const admissionService = {
    getAll: async (): Promise<Admission[]> => {
        return fetchCollection<Admission>('admissions');
    },

    getById: async (id: string): Promise<Admission | null> => {
        return getDocById<Admission>('admissions', id);
    },

    getByStatus: async (status: string): Promise<Admission[]> => {
        return fetchCollection<Admission>('admissions', where('status', '==', status));
    },

    getByAcademicYear: async (academicYear: string): Promise<Admission[]> => {
        return fetchCollection<Admission>('admissions', where('academicYear', '==', academicYear));
    },

    create: async (admission: Partial<Admission>): Promise<Admission> => {
        const newAdmission: Omit<Admission, 'id'> & { id?: string } = {
            admissionNo: admission.admissionNo || '',
            name: admission.name || '',
            dob: admission.dob || '',
            gender: admission.gender || 'Male',
            bloodGroup: admission.bloodGroup || '',
            fatherName: admission.fatherName || '',
            motherName: admission.motherName || '',
            guardianName: admission.guardianName || '',
            fatherOccupation: admission.fatherOccupation || '',
            motherOccupation: admission.motherOccupation || '',
            guardianOccupation: admission.guardianOccupation || '',
            parentName: admission.parentName || '',
            phone: admission.phone || '',
            emergencyContactNumber: admission.emergencyContactNumber || '',
            email: admission.email || '',
            parentEmail: admission.parentEmail || '',
            address: admission.address || '',
            classApplied: admission.classApplied || '',
            classAllotted: admission.classAllotted || '',
            section: admission.section || 'A',
            rollNo: admission.rollNo || '',
            status: admission.status || 'enquiry',
            appliedDate: admission.appliedDate || new Date().toISOString().split('T')[0],
            admissionDate: admission.admissionDate || '',
            academicYear: admission.academicYear || '',
        };
        return createDoc<Admission>('admissions', newAdmission);
    },

    update: async (id: string, updates: Partial<Admission>): Promise<Admission | null> => {
        await updateDocById('admissions', id, updates);
        return getDocById<Admission>('admissions', id);
    },

    delete: async (id: string): Promise<boolean> => {
        await deleteDocById('admissions', id);
        return true;
    },
};

// ==================== TEACHER SERVICE ====================

export const teacherService = {
    /** Returns only active / on-leave teachers — 'inactive' records are soft-deletes. */
    getAll: async (): Promise<Teacher[]> => {
        const all = await fetchCollection<Teacher>('teachers');
        return all.filter(t => t.status !== 'inactive');
    },

    getById: async (id: string): Promise<Teacher | null> => {
        return getDocById<Teacher>('teachers', id);
    },

    create: async (teacher: Partial<Teacher>): Promise<Teacher> => {
        const allTeachers = await teacherService.getAll();
        const schoolId = teacher.school_id || getSchoolId();
        const newTeacher: Omit<Teacher, 'id'> & { id?: string } = {
            employeeId: teacher.employeeId || `EMP${String(allTeachers.length + 1).padStart(3, '0')}`,
            name: teacher.name || '',
            email: (teacher.email || '').trim().toLowerCase(),
            phone: teacher.phone || '',
            dob: teacher.dob || '',
            gender: teacher.gender || '',
            bloodGroup: teacher.bloodGroup || '',
            emergencyContact: teacher.emergencyContact || '',
            subjects: teacher.subjects || [],
            classes: teacher.classes || [],
            qualification: teacher.qualification || '',
            experience: Number(teacher.experience) || 0,
            joiningDate: teacher.joiningDate || new Date().toISOString().split('T')[0],
            salary: Number(teacher.salary) || 0,
            photo: teacher.photo || undefined,
            address: teacher.address || '',
            status: teacher.status || 'active',
            school_id: schoolId,
        };
        const created = await createDoc<Teacher>('teachers', newTeacher);

        // Auto-provision a /users record so the teacher can log in and be
        // redirected to the Teacher dashboard (role must be set before first login).
        if (newTeacher.email) {
            try {
                await userService.create({
                    email: newTeacher.email,
                    name: newTeacher.name,
                    role: 'teacher',
                    school_id: schoolId || undefined,
                    isFirstLogin: true,
                });
            } catch (err) {
                console.warn('[teacherService] Auto-provisioning user record failed:', err);
            }
        }

        return created;
    },

    update: async (id: string, updates: Partial<Teacher>): Promise<Teacher | null> => {
        // Coerce experience/salary to numbers, strip any File objects from documents
        const safeUpdates: Partial<Teacher> = { ...updates };
        if (safeUpdates.experience !== undefined) {
            safeUpdates.experience = Number(safeUpdates.experience) || 0;
        }
        if (safeUpdates.salary !== undefined) {
            safeUpdates.salary = Number(safeUpdates.salary) || 0;
        }
        if (safeUpdates.email) {
            safeUpdates.email = safeUpdates.email.trim().toLowerCase();
        }
        // Strip documents that contain File objects (not Firestore-serializable)
        delete (safeUpdates as any).documents;
        await updateDocById('teachers', id, safeUpdates as Record<string, any>);
        return getDocById<Teacher>('teachers', id);
    },

    getByEmail: async (email: string): Promise<Teacher | null> => {
        const teachers = await fetchCollection<Teacher>('teachers', where('email', '==', email));
        return teachers[0] || null;
    },

    /**
     * One-time migration helper: find all teachers still marked status='inactive'
     * (created by the old soft-delete) and hard-delete them + all related data.
     * Safe to call on every mount — it's a no-op when no inactive records exist.
     */
    purgeInactive: async (): Promise<void> => {
        // Query directly — skips the getAll() filter intentionally
        const stale = await fetchCollection<Teacher>('teachers', where('status', '==', 'inactive'));
        if (stale.length === 0) return;
        console.log(`[teacherService] Purging ${stale.length} soft-deleted teacher(s)…`);
        for (const t of stale) {
            try {
                await teacherService.delete(t.id);
            } catch (err) {
                console.warn(`[teacherService.purgeInactive] Failed to purge teacher ${t.id}:`, err);
            }
        }
    },

    /**
     * Hard-delete a teacher and ALL related data across the application:
     *  - teachers doc
     *  - users doc + Firebase Auth account (via backend)
     *  - lessons authored by this teacher
     *  - timetable slots assigned to this teacher
     *  - subject_mappings for this teacher
     *  - classes where classTeacher references this teacher
     */
    delete: async (id: string): Promise<void> => {
        // Fetch the teacher first so we have email + name for related-doc queries
        const teacher = await getDocById<Teacher>('teachers', id);
        if (!teacher) return;

        const email = (teacher.email || '').trim().toLowerCase();
        const name = teacher.name || '';

        // Run all side-effect deletes in parallel for speed
        await Promise.all([
            // 1. Lessons authored by this teacher (teacherId stores email)
            fetchCollection<LessonLog>('lessons', where('teacherId', '==', email))
                .then(docs => Promise.all(docs.map(d => deleteDocById('lessons', d.id)))),

            // 2. Timetable slots assigned to this teacher (teacherId stores email)
            fetchCollection<TimetableSlot>('timetable', where('teacherId', '==', email))
                .then(docs => Promise.all(docs.map(d => deleteDocById('timetable', d.id)))),

            // 3. Subject mappings for this teacher (matched by teacherName)
            fetchCollection<SubjectMappingRecord>('subject_mappings', where('teacherName', '==', name))
                .then(docs => Promise.all(docs.map(d => deleteDocById('subject_mappings', d.id)))),

            // 4. Classes that list this teacher as classTeacher — clear the field
            fetchCollection<Class>('classes', where('classTeacher', '==', name))
                .then(docs => Promise.all(
                    docs.map(d => updateDoc(doc(db, 'classes', d.id), { classTeacher: '' }))
                )),
        ]);

        // 5. Delete the teachers doc itself
        await deleteDocById('teachers', id);

        // 6. Delete Firebase Auth account + users Firestore doc via backend
        //    (requires Admin SDK — done server-side)
        if (email) {
            try {
                const { auth: clientAuth } = await import('../services/firebase');
                const currentUser = clientAuth.currentUser;
                if (currentUser) {
                    const token = await currentUser.getIdToken();
                    const apiBase = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001').replace(/\/$/, '');
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 8000);
                    await fetch(`${apiBase}/api/auth/user`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email }),
                        signal: ctrl.signal,
                    });
                    clearTimeout(timer);
                }
            } catch (err) {
                // Non-fatal: backend may be down or the teacher may never have logged in.
                // The teacher record itself is already deleted from Firestore.
                console.warn('[teacherService.delete] Backend user delete failed (best-effort):', err);
            }
        }
    },
};

// ==================== CLASS SERVICE ====================

export const classService = {
    getAll: async (): Promise<Class[]> => {
        return fetchCollection<Class>('classes');
    },

    getById: async (id: string): Promise<Class | null> => {
        return getDocById<Class>('classes', id);
    },

    create: async (classData: Partial<Class>): Promise<Class> => {
        return createDoc<Class>('classes', {
            className: classData.className || '',
            section: classData.section || '',
            classTeacher: classData.classTeacher || '',
            capacity: classData.capacity || 40,
            currentStrength: classData.currentStrength || 0,
            subjects: classData.subjects || [],
        });
    },

    update: async (id: string, updates: Partial<Class>): Promise<void> => {
        await updateDocById('classes', id, updates);
    },

    delete: async (id: string): Promise<void> => {
        await deleteDocById('classes', id);
    },
};

// ==================== SUBJECT SERVICE ====================

export const subjectService = {
    getAll: async (): Promise<Subject[]> => {
        return fetchCollection<Subject>('subjects');
    },

    create: async (subject: Partial<Subject>): Promise<Subject> => {
        return createDoc<Subject>('subjects', {
            name: subject.name || '',
            code: subject.code || '',
            description: subject.description,
        });
    },
};

// ==================== ATTENDANCE SERVICE ====================

export const attendanceService = {
    getAll: async (): Promise<AttendanceRecord[]> => {
        return fetchCollection<AttendanceRecord>('attendance');
    },

    getByDate: async (date: string): Promise<AttendanceRecord[]> => {
        return fetchCollection<AttendanceRecord>('attendance', where('date', '==', date));
    },

    getByStudent: async (studentId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> => {
        let records = await fetchCollection<AttendanceRecord>(
            'attendance',
            where('studentId', '==', studentId),
        );
        if (startDate) records = records.filter(r => r.date >= startDate);
        if (endDate) records = records.filter(r => r.date <= endDate);
        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    getByClass: async (className: string, section: string, date: string): Promise<AttendanceRecord[]> => {
        const students = await studentService.getByClass(className, section);
        const studentIds = students.map(s => s.id);
        const records = await attendanceService.getByDate(date);
        return records.filter(r => studentIds.includes(r.studentId));
    },

    markAttendance: async (records: Partial<AttendanceRecord>[]): Promise<void> => {
        for (const r of records) {
            // Check if there's an existing record for this student on this date
            const existing = await fetchCollection<AttendanceRecord>(
                'attendance',
                where('studentId', '==', r.studentId),
                where('date', '==', r.date),
            );

            const data = {
                studentId: r.studentId!,
                date: r.date!,
                status: r.status!,
                time: r.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                markedBy: r.markedBy || 'teacher',
                remarks: r.remarks || '',
            };

            if (existing.length > 0) {
                await updateDocById('attendance', existing[0].id, data);
            } else {
                const created = await createDoc<AttendanceRecord>('attendance', data);
                // Notify parent
                const student = await studentService.getById(r.studentId!);
                if (student?.parentId) {
                    await notificationService.create({
                        userId: student.parentId,
                        type: 'attendance',
                        title: r.status === 'present' ? 'Child Arrived at School' : 'Attendance Alert',
                        message: `${student.name} marked ${r.status} at ${data.time}`,
                        date: r.date!,
                    });
                }
            }
        }
    },

    getAttendanceStats: async (studentId: string, month?: string) => {
        let records = await attendanceService.getByStudent(studentId);
        if (month) records = records.filter(r => r.date.startsWith(month));

        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const leave = records.filter(r => r.status === 'leave').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, present, absent, late, leave, percentage };
    },
};

// ==================== LESSON SERVICE ====================

export const lessonService = {
    getAll: async (): Promise<LessonLog[]> => {
        return fetchCollection<LessonLog>('lessons');
    },

    getByDate: async (date: string): Promise<LessonLog[]> => {
        return fetchCollection<LessonLog>('lessons', where('date', '==', date));
    },

    getByTeacher: async (teacherId: string, date?: string): Promise<LessonLog[]> => {
        let lessons = await fetchCollection<LessonLog>('lessons', where('teacherId', '==', teacherId));
        if (date) lessons = lessons.filter(l => l.date === date);
        return lessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    getByClass: async (className: string, section: string): Promise<LessonLog[]> => {
        const lessons = await fetchCollection<LessonLog>(
            'lessons',
            where('class', '==', className),
            where('section', '==', section),
        );
        return lessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    create: async (lesson: Partial<LessonLog>): Promise<LessonLog> => {
        return createDoc<LessonLog>('lessons', {
            date: lesson.date || new Date().toISOString().split('T')[0],
            classId: lesson.classId || '',
            class: lesson.class || '',
            section: lesson.section || '',
            subject: lesson.subject || '',
            topic: lesson.topic || '',
            objectives: lesson.objectives || [],
            description: lesson.description,
            studentsNeedingAttention: lesson.studentsNeedingAttention || [],
            notes: lesson.notes || '',
            teacherId: lesson.teacherId || '',
            teacherName: lesson.teacherName || '',
            attachments: lesson.attachments || [],
        });
    },
};

// ==================== ASSIGNMENT SERVICE ====================

export const assignmentService = {
    getAll: async (): Promise<Assignment[]> => {
        return fetchCollection<Assignment>('assignments');
    },

    getByClass: async (className: string, section: string): Promise<Assignment[]> => {
        const assignments = await fetchCollection<Assignment>(
            'assignments',
            where('class', '==', className),
            where('section', '==', section),
        );
        return assignments.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    },

    getById: async (id: string): Promise<Assignment | null> => {
        return getDocById<Assignment>('assignments', id);
    },

    create: async (assignment: Partial<Assignment>): Promise<Assignment> => {
        const newAssignment = await createDoc<Assignment>('assignments', {
            title: assignment.title || '',
            description: assignment.description || '',
            subject: assignment.subject || '',
            class: assignment.class || '',
            section: assignment.section || '',
            assignedBy: assignment.assignedBy || '',
            assignedDate: assignment.assignedDate || new Date().toISOString().split('T')[0],
            dueDate: assignment.dueDate || '',
            totalMarks: assignment.totalMarks || 0,
            attachments: assignment.attachments || [],
            status: assignment.status || 'active',
        });

        // Notify students' parents
        const students = await studentService.getByClass(newAssignment.class, newAssignment.section);
        for (const student of students) {
            if (student.parentId) {
                await notificationService.create({
                    userId: student.parentId,
                    type: 'assignment',
                    title: 'New Assignment Posted',
                    message: `${newAssignment.subject}: ${newAssignment.title}. Due date: ${newAssignment.dueDate}`,
                    date: newAssignment.assignedDate,
                });
            }
        }

        return newAssignment;
    },
};

// ==================== ASSIGNMENT SUBMISSION SERVICE ====================

export const assignmentSubmissionService = {
    getAll: async (): Promise<AssignmentSubmission[]> => {
        return fetchCollection<AssignmentSubmission>('assignment_submissions');
    },

    getByAssignment: async (assignmentId: string): Promise<AssignmentSubmission[]> => {
        return fetchCollection<AssignmentSubmission>(
            'assignment_submissions',
            where('assignmentId', '==', assignmentId),
        );
    },

    getByStudent: async (studentId: string): Promise<AssignmentSubmission[]> => {
        const subs = await fetchCollection<AssignmentSubmission>(
            'assignment_submissions',
            where('studentId', '==', studentId),
        );
        return subs.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
    },

    submit: async (submission: Partial<AssignmentSubmission>): Promise<AssignmentSubmission> => {
        return createDoc<AssignmentSubmission>('assignment_submissions', {
            assignmentId: submission.assignmentId || '',
            studentId: submission.studentId || '',
            submittedDate: submission.submittedDate || new Date().toISOString().split('T')[0],
            files: submission.files || [],
            remarks: submission.remarks,
            status: 'submitted',
        });
    },

    grade: async (id: string, marksObtained: number, feedback: string, gradedBy: string): Promise<AssignmentSubmission | null> => {
        await updateDocById('assignment_submissions', id, {
            marksObtained,
            feedback,
            gradedBy,
            gradedDate: new Date().toISOString().split('T')[0],
            status: 'graded',
        });

        const updated = await getDocById<AssignmentSubmission>('assignment_submissions', id);
        if (updated) {
            const student = await studentService.getById(updated.studentId);
            if (student?.parentId) {
                await notificationService.create({
                    userId: student.parentId,
                    type: 'assignment',
                    title: 'Assignment Graded',
                    message: `${student.name}'s assignment has been graded. Marks: ${marksObtained}`,
                    date: new Date().toISOString().split('T')[0],
                });
            }
        }
        return updated;
    },
};

// ==================== EXAM SERVICE ====================

export const examService = {
    getAll: async (): Promise<Exam[]> => {
        return fetchCollection<Exam>('exams');
    },

    getUpcoming: async (): Promise<Exam[]> => {
        const exams = await examService.getAll();
        const today = new Date().toISOString().split('T')[0];
        return exams.filter(e => e.date >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    getByClass: async (className: string, section: string): Promise<Exam[]> => {
        return fetchCollection<Exam>(
            'exams',
            where('class', '==', className),
            where('section', '==', section),
        );
    },

    create: async (exam: Partial<Exam>): Promise<Exam> => {
        return createDoc<Exam>('exams', {
            name: exam.name || '',
            type: exam.type || 'unit-test',
            subject: exam.subject || '',
            class: exam.class || '',
            section: exam.section || '',
            date: exam.date || '',
            duration: exam.duration || 60,
            totalMarks: exam.totalMarks || 100,
            passingMarks: exam.passingMarks || 40,
            syllabus: exam.syllabus,
        });
    },
};

// ==================== EXAM RESULT SERVICE ====================

export const examResultService = {
    getAll: async (): Promise<ExamResult[]> => {
        return fetchCollection<ExamResult>('exam_results');
    },

    getByStudent: async (studentId: string): Promise<ExamResult[]> => {
        return fetchCollection<ExamResult>('exam_results', where('studentId', '==', studentId));
    },

    getByExam: async (examId: string): Promise<ExamResult[]> => {
        return fetchCollection<ExamResult>('exam_results', where('examId', '==', examId));
    },

    create: async (result: Partial<ExamResult>): Promise<ExamResult> => {
        const percentage = result.totalMarks ? Math.round(((result.marksObtained || 0) / result.totalMarks) * 100) : 0;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C';
        else if (percentage >= 40) grade = 'D';

        return createDoc<ExamResult>('exam_results', {
            examId: result.examId || '',
            studentId: result.studentId || '',
            marksObtained: result.marksObtained || 0,
            totalMarks: result.totalMarks || 0,
            percentage,
            grade,
            rank: result.rank,
            remarks: result.remarks,
        });
    },
};

// ==================== FEE SERVICE ====================

export const feeService = {
    getAll: async (): Promise<FeePayment[]> => {
        return fetchCollection<FeePayment>('fee_payments');
    },

    getAllStructures: async (): Promise<FeeStructure[]> => {
        return fetchCollection<FeeStructure>('fee_structures');
    },

    getAllPayments: async (): Promise<FeePayment[]> => {
        return fetchCollection<FeePayment>('fee_payments');
    },

    getPaymentsByStudent: async (studentId: string): Promise<FeePayment[]> => {
        const payments = await fetchCollection<FeePayment>(
            'fee_payments',
            where('studentId', '==', studentId),
        );
        return payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    },

    createStructure: async (structure: any): Promise<any> => {
        return createDoc<any>('fee_structures', structure);
    },

    updateStructure: async (id: string, updates: any): Promise<void> => {
        await updateDocById('fee_structures', id, updates);
    },

    deleteStructure: async (id: string): Promise<void> => {
        await deleteDocById('fee_structures', id);
    },

    createPayment: async (payment: Partial<FeePayment>): Promise<FeePayment> => {
        const allPayments = await feeService.getAllPayments();
        const newPayment = await createDoc<FeePayment>('fee_payments', {
            studentId: payment.studentId || '',
            studentName: payment.studentName || '',
            admissionNo: payment.admissionNo || '',
            class: payment.class || '',
            receiptNo: payment.receiptNo || `REC${new Date().getFullYear()}${String(allPayments.length + 1).padStart(4, '0')}`,
            amount: payment.amount || 0,
            paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
            paymentMode: payment.paymentMode || 'cash',
            transactionId: payment.transactionId,
            collectedBy: payment.collectedBy || '',
            components: payment.components || [],
            academicYear: payment.academicYear || getActiveAcademicYearId(),
        });

        // Notify parent
        const student = await studentService.getById(newPayment.studentId);
        if (student?.parentId) {
            await notificationService.create({
                userId: student.parentId,
                type: 'fee',
                title: 'Fee Payment Received',
                message: `Payment of ₹${newPayment.amount} received. Receipt No: ${newPayment.receiptNo}`,
                date: newPayment.paymentDate,
            });
        }

        return newPayment;
    },
};

// ==================== ANNOUNCEMENT SERVICE ====================

export const announcementService = {
    getAll: async (): Promise<Announcement[]> => {
        return fetchCollection<Announcement>('announcements');
    },

    getActive: async (): Promise<Announcement[]> => {
        const all = await announcementService.getAll();
        const today = new Date().toISOString().split('T')[0];
        return all.filter(a => !a.expiryDate || a.expiryDate >= today)
            .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    },

    getForUser: async (role: string, className?: string, section?: string): Promise<Announcement[]> => {
        const announcements = await announcementService.getActive();
        return announcements.filter(a => {
            if (a.targetAudience === 'all') return true;
            if (a.targetAudience === role + 's') return true;
            if (a.targetAudience === 'specific-class' && a.class === className && a.section === section) return true;
            return false;
        });
    },

    create: async (announcement: Partial<Announcement>): Promise<Announcement> => {
        return createDoc<Announcement>('announcements', {
            title: announcement.title || '',
            message: announcement.message || '',
            type: announcement.type || 'general',
            postedBy: announcement.postedBy || '',
            postedDate: announcement.postedDate || new Date().toISOString().split('T')[0],
            targetAudience: announcement.targetAudience || 'all',
            class: announcement.class,
            section: announcement.section,
            priority: announcement.priority || 'medium',
            expiryDate: announcement.expiryDate,
            attachments: announcement.attachments || [],
        });
    },

    delete: async (id: string): Promise<void> => {
        await deleteDocById('announcements', id);
    },
};

// ==================== ENQUIRY SERVICE ====================

export const enquiryService = {
    getAll: async (): Promise<Enquiry[]> => {
        return fetchCollection<Enquiry>('enquiries');
    },

    create: async (enquiry: Partial<Enquiry>): Promise<Enquiry> => {
        return createDoc<Enquiry>('enquiries', {
            parentName: enquiry.parentName || '',
            studentName: enquiry.studentName || '',
            phone: enquiry.phone || '',
            email: enquiry.email || '',
            classApplied: enquiry.classApplied || '',
            enquiryDate: enquiry.enquiryDate || new Date().toISOString().split('T')[0],
            source: enquiry.source || 'walk-in',
            status: enquiry.status || 'new',
            followUpDate: enquiry.followUpDate,
            notes: enquiry.notes,
            assignedTo: enquiry.assignedTo,
        });
    },

    update: async (id: string, updates: Partial<Enquiry>): Promise<Enquiry | null> => {
        await updateDocById('enquiries', id, updates);
        return getDocById<Enquiry>('enquiries', id);
    },
};

// ==================== EVENT SERVICE ====================

export const eventService = {
    getAll: async (): Promise<Event[]> => {
        return fetchCollection<Event>('events');
    },

    getUpcoming: async (): Promise<Event[]> => {
        const events = await eventService.getAll();
        const today = new Date().toISOString().split('T')[0];
        return events.filter(e => e.date >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    create: async (event: Partial<Event>): Promise<Event> => {
        return createDoc<Event>('events', {
            title: event.title || '',
            description: event.description || '',
            type: event.type || 'other',
            date: event.date || '',
            startTime: event.startTime,
            endTime: event.endTime,
            venue: event.venue,
            organizer: event.organizer,
            targetAudience: event.targetAudience || 'all',
            class: event.class,
            section: event.section,
        });
    },
};

// ==================== NOTIFICATION SERVICE ====================

export const notificationService = {
    getAll: async (): Promise<Notification[]> => {
        return fetchCollection<Notification>('notifications');
    },

    getByUser: async (userId: string): Promise<Notification[]> => {
        const notifications = await fetchCollection<Notification>(
            'notifications',
            where('userId', '==', userId),
        );
        return notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    getUnreadCount: async (userId: string): Promise<number> => {
        const notifications = await notificationService.getByUser(userId);
        return notifications.filter(n => !n.read).length;
    },

    create: async (notification: Partial<Notification>): Promise<Notification> => {
        return createDoc<Notification>('notifications', {
            userId: notification.userId || '',
            type: notification.type || 'general',
            title: notification.title || '',
            message: notification.message || '',
            date: notification.date || new Date().toISOString(),
            read: notification.read || false,
            link: notification.link,
        });
    },

    markAsRead: async (id: string): Promise<void> => {
        await updateDocById('notifications', id, { read: true });
    },

    markAllAsRead: async (userId: string): Promise<void> => {
        const notifications = await notificationService.getByUser(userId);
        for (const n of notifications.filter(n => !n.read)) {
            await updateDocById('notifications', n.id, { read: true });
        }
    },
};

// ==================== TIMETABLE SERVICE ====================

export const timetableService = {
    getAll: async (): Promise<TimetableSlot[]> => {
        return fetchCollection<TimetableSlot>('timetable');
    },

    getByClass: async (className: string, section: string): Promise<TimetableSlot[]> => {
        const slots = await fetchCollection<TimetableSlot>(
            'timetable',
            where('class', '==', className),
            where('section', '==', section),
        );
        return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    },

    getByTeacher: async (teacherEmail: string): Promise<TimetableSlot[]> => {
        const slots = await fetchCollection<TimetableSlot>(
            'timetable',
            where('teacherId', '==', teacherEmail),
        );
        return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    },

    getByTeacherAndDay: async (teacherEmail: string, day: string): Promise<TimetableSlot[]> => {
        const slots = await fetchCollection<TimetableSlot>(
            'timetable',
            where('teacherId', '==', teacherEmail),
            where('day', '==', day),
        );
        return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    },

    save: async (slots: TimetableSlot[]): Promise<void> => {
        // Build deterministic IDs and upsert each slot.
        // Using setDocById (merge:true) is idempotent and preserves school_id;
        // avoids createDoc which generates random IDs and orphans old docs.
        const normalised = slots.map(s => ({
            ...s,
            id: s.id || `${s.class}-${s.section}-${s.day}-${s.startTime}`.replace(/\s+/g, '_'),
        }));

        // Delete docs that exist in Firestore but are NOT in the new set
        // (handles removed slots).  Only fetch school-scoped docs to stay tenant-safe.
        const existing = await timetableService.getAll();
        const newIds = new Set(normalised.map(s => s.id));
        for (const e of existing) {
            if (!newIds.has(e.id)) {
                await deleteDocById('timetable', e.id);
            }
        }

        // Upsert every slot with its deterministic ID
        for (const s of normalised) {
            const { id, ...rest } = s;
            await setDocById<TimetableSlot>('timetable', id, { id, ...rest });
        }
    },

    updateSlot: async (updatedSlot: TimetableSlot): Promise<void> => {
        if (updatedSlot.id) {
            const existing = await getDocById<TimetableSlot>('timetable', updatedSlot.id);
            if (existing) {
                await updateDocById('timetable', updatedSlot.id, updatedSlot);
                return;
            }
        }
        const { id, ...rest } = updatedSlot;
        await createDoc<TimetableSlot>('timetable', rest);
    },

    deleteSlot: async (id: string): Promise<void> => {
        await deleteDocById('timetable', id);
    },
};

// ==================== STATISTICS & ANALYTICS ====================

export const statisticsService = {
    getDashboardStats: async () => {
        const students = await studentService.getAll();
        const teachers = await teacherService.getAll();
        const today = new Date().toISOString().split('T')[0];
        const attendance = await attendanceService.getByDate(today);
        const announcements = await announcementService.getActive();

        return {
            totalStudents: students.length,
            totalTeachers: teachers.length,
            presentToday: attendance.filter(a => a.status === 'present').length,
            absentToday: attendance.filter(a => a.status === 'absent').length,
            activeAnnouncements: announcements.length,
            attendancePercentage: attendance.length > 0
                ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
                : 0,
        };
    },

    getStudentPerformance: async (studentId: string) => {
        const results = await examResultService.getByStudent(studentId);
        const submissions = await assignmentSubmissionService.getByStudent(studentId);
        const gradedSubmissions = submissions.filter(s => s.status === 'graded');

        const totalExamMarks = results.reduce((sum, r) => sum + r.marksObtained, 0);
        const totalExamMax = results.reduce((sum, r) => sum + r.totalMarks, 0);
        const examPercentage = totalExamMax > 0 ? Math.round((totalExamMarks / totalExamMax) * 100) : 0;

        const totalAssignmentMarks = gradedSubmissions.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
        const totalAssignmentMax = gradedSubmissions.length * 100;
        const assignmentPercentage = totalAssignmentMax > 0 ? Math.round((totalAssignmentMarks / totalAssignmentMax) * 100) : 0;

        return {
            overallPercentage: Math.round((examPercentage + assignmentPercentage) / 2),
            examPercentage,
            assignmentPercentage,
            totalExams: results.length,
            totalAssignments: submissions.length,
            gradedAssignments: gradedSubmissions.length,
            pendingAssignments: submissions.filter(s => s.status === 'submitted').length,
        };
    },

    getClassStatistics: async (className: string, section: string) => {
        const students = await studentService.getByClass(className, section);
        const today = new Date().toISOString().split('T')[0];
        const attendance = await attendanceService.getByClass(className, section, today);

        return {
            totalStudents: students.length,
            presentToday: attendance.filter(a => a.status === 'present').length,
            absentToday: attendance.filter(a => a.status === 'absent').length,
            attendancePercentage: students.length > 0
                ? Math.round((attendance.filter(a => a.status === 'present').length / students.length) * 100)
                : 0,
        };
    },

    getPlatformStats: async () => {
        const studentSnap = await getDocs(collection(db, 'students'));
        const teacherSnap = await getDocs(collection(db, 'teachers'));
        const parentSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'parent')));

        return {
            totalStudents: studentSnap.size,
            totalTeachers: teacherSnap.size,
            totalParents: parentSnap.size
        };
    },

    getSchoolStats: async (schoolId: string) => {
        const studentSnap = await getDocs(query(collection(db, 'students'), where('school_id', '==', schoolId)));
        const teacherSnap = await getDocs(query(collection(db, 'teachers'), where('school_id', '==', schoolId)));
        const parentSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'parent'), where('school_id', '==', schoolId)));

        return {
            activeStudents: studentSnap.docs.filter(d => (d.data() as any).status === 'active').length || studentSnap.size,
            activeTeachers: teacherSnap.docs.filter(d => (d.data() as any).status === 'active').length || teacherSnap.size,
            activeParents: parentSnap.size
        };
    },
};

// ==================== QUIZ SERVICE (from dataStore) ====================

export const quizService = {
    getAllQuizzes: async () => fetchCollection<any>('quizzes'),
    getQuizzesByClass: async (className: string, section: string) =>
        fetchCollection<any>('quizzes', where('class', '==', className), where('section', '==', section)),
    getQuizById: async (id: string) => getDocById<any>('quizzes', id),

    getResultsByQuiz: async (quizId: string) =>
        fetchCollection<any>('quiz_results', where('quizId', '==', quizId)),
    getResultsByStudent: async (studentId: string) =>
        fetchCollection<any>('quiz_results', where('studentId', '==', studentId)),

    getTeacherClasses: async (teacherEmail: string) => {
        const teacher = await teacherService.getByEmail(teacherEmail);
        return teacher?.classes || [];
    },

    getClassPerformance: async (className: string, section: string, subject?: string) => {
        const students = await studentService.getByClass(className, section);
        let quizzes = await quizService.getQuizzesByClass(className, section);
        if (subject) quizzes = quizzes.filter((q: any) => q.subject === subject);
        const results = await fetchCollection<any>('quiz_results');

        return students.map(student => {
            const quizIds = quizzes.map((q: any) => q.id);
            const studentResults = results.filter((r: any) => r.studentId === student.id && quizIds.includes(r.quizId));
            return {
                studentId: student.id,
                name: student.name,
                rollNo: student.rollNo,
                totalQuizzes: quizzes.length,
                completedQuizzes: studentResults.length,
                averageScore: studentResults.length > 0
                    ? Math.round(studentResults.reduce((sum: number, r: any) => sum + (r.score / r.total) * 100, 0) / studentResults.length)
                    : 0,
                results: studentResults,
            };
        });
    },

    getTeacherLeaderboard: async () => {
        // Derived from teachers collection — returns top performers
        const teachers = await teacherService.getAll();
        return teachers.slice(0, 10).map((t, i) => ({
            id: t.id,
            name: t.name,
            score: 0,
            engagement: 0,
            subject: t.subjects?.[0] || '',
        }));
    },
};

// ==================== SCHOOL SETTINGS SERVICE ====================

export const schoolSettingsService = {
    getBySchool: async (schoolId: string): Promise<SchoolSettings | null> => {
        const results = await fetchCollection<SchoolSettings>('school_settings', where('school_id', '==', schoolId));
        return results[0] || null;
    },

    create: async (settings: Partial<SchoolSettings>): Promise<SchoolSettings> => {
        return createDoc<SchoolSettings>('school_settings', {
            school_id: settings.school_id || '',
            academicYear: settings.academicYear || '',
            timezone: settings.timezone || 'Asia/Kolkata',
            currency: settings.currency || 'INR',
            attendanceRules: settings.attendanceRules || {},
            gradingRules: settings.gradingRules || { gradeScale: [], passingPercentage: 40 },
            feeRules: settings.feeRules || {},
            notificationRules: settings.notificationRules || { emailEnabled: true, smsEnabled: false, pushEnabled: false },
            branding: settings.branding || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    },

    update: async (id: string, updates: Partial<SchoolSettings>): Promise<void> => {
        await updateDocById('school_settings', id, { ...updates, updated_at: new Date().toISOString() });
    },
};

// ==================== ACADEMIC YEAR SERVICE ====================

export const academicYearService = {
    getAll: async (): Promise<AcademicYear[]> => {
        return fetchCollection<AcademicYear>('academic_years');
    },

    getBySchool: async (schoolId: string): Promise<AcademicYear[]> => {
        return fetchCollection<AcademicYear>('academic_years', where('school_id', '==', schoolId));
    },

    getCurrent: async (schoolId: string): Promise<AcademicYear | null> => {
        const years = await fetchCollection<AcademicYear>(
            'academic_years',
            where('school_id', '==', schoolId),
            where('isCurrent', '==', true),
        );
        return years[0] || null;
    },

    create: async (year: Partial<AcademicYear>): Promise<AcademicYear> => {
        return createDoc<AcademicYear>('academic_years', {
            school_id: year.school_id || '',
            name: year.name || '',
            startDate: year.startDate || '',
            endDate: year.endDate || '',
            isCurrent: year.isCurrent ?? false,
            status: year.status || 'upcoming',
            terms: year.terms || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    },

    update: async (id: string, updates: Partial<AcademicYear>): Promise<void> => {
        await updateDocById('academic_years', id, { ...updates, updated_at: new Date().toISOString() });
    },

    setCurrent: async (id: string, schoolId: string): Promise<void> => {
        // Unset all current years for this school
        const allYears = await academicYearService.getBySchool(schoolId);
        for (const y of allYears) {
            if (y.isCurrent) {
                await updateDocById('academic_years', y.id, { isCurrent: false, updated_at: new Date().toISOString() });
            }
        }
        await updateDocById('academic_years', id, { isCurrent: true, status: 'active', updated_at: new Date().toISOString() });
    },

    delete: async (id: string): Promise<void> => {
        await deleteDocById('academic_years', id);
    },
};

// ==================== STUDENT ENROLLMENT SERVICE ====================

export const studentEnrollmentService = {
    getAll: async (): Promise<StudentEnrollment[]> => {
        return fetchCollection<StudentEnrollment>('student_enrollments');
    },

    getByStudent: async (studentId: string): Promise<StudentEnrollment[]> => {
        const enrollments = await fetchCollection<StudentEnrollment>(
            'student_enrollments',
            where('studentId', '==', studentId),
        );
        return enrollments.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    },

    getByClass: async (classId: string, academicYear: string): Promise<StudentEnrollment[]> => {
        return fetchCollection<StudentEnrollment>(
            'student_enrollments',
            where('classId', '==', classId),
            where('academicYear', '==', academicYear),
        );
    },

    getActive: async (studentId: string): Promise<StudentEnrollment | null> => {
        const enrollments = await fetchCollection<StudentEnrollment>(
            'student_enrollments',
            where('studentId', '==', studentId),
            where('status', '==', 'enrolled'),
        );
        return enrollments[0] || null;
    },

    create: async (enrollment: Partial<StudentEnrollment>): Promise<StudentEnrollment> => {
        return createDoc<StudentEnrollment>('student_enrollments', {
            school_id: enrollment.school_id || '',
            studentId: enrollment.studentId || '',
            classId: enrollment.classId || '',
            class: enrollment.class || '',
            section: enrollment.section || '',
            academicYear: enrollment.academicYear || '',
            rollNo: enrollment.rollNo || '',
            startDate: enrollment.startDate || new Date().toISOString().split('T')[0],
            endDate: enrollment.endDate,
            status: enrollment.status || 'enrolled',
            promotedFromClassId: enrollment.promotedFromClassId,
            promotedFromAcademicYear: enrollment.promotedFromAcademicYear,
            remarks: enrollment.remarks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    },

    update: async (id: string, updates: Partial<StudentEnrollment>): Promise<void> => {
        await updateDocById('student_enrollments', id, { ...updates, updated_at: new Date().toISOString() });
    },

    promote: async (enrollmentId: string, newClassId: string, newClass: string, newSection: string, newAcademicYear: string, newRollNo: string): Promise<StudentEnrollment> => {
        const old = await getDocById<StudentEnrollment>('student_enrollments', enrollmentId);
        if (old) {
            await updateDocById('student_enrollments', enrollmentId, {
                status: 'promoted',
                endDate: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
            });
        }
        return studentEnrollmentService.create({
            school_id: old?.school_id || '',
            studentId: old?.studentId || '',
            classId: newClassId,
            class: newClass,
            section: newSection,
            academicYear: newAcademicYear,
            rollNo: newRollNo,
            promotedFromClassId: old?.classId,
            promotedFromAcademicYear: old?.academicYear,
            status: 'enrolled',
        });
    },
};

// ==================== FEE INVOICE SERVICE ====================

export const feeInvoiceService = {
    getAll: async (): Promise<FeeInvoice[]> => {
        return fetchCollection<FeeInvoice>('fee_invoices');
    },

    getByStudent: async (studentId: string): Promise<FeeInvoice[]> => {
        const invoices = await fetchCollection<FeeInvoice>(
            'fee_invoices',
            where('studentId', '==', studentId),
        );
        return invoices.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    },

    getByClass: async (className: string, section: string, academicYear: string): Promise<FeeInvoice[]> => {
        return fetchCollection<FeeInvoice>(
            'fee_invoices',
            where('class', '==', className),
            where('section', '==', section),
            where('academicYear', '==', academicYear),
        );
    },

    getPending: async (): Promise<FeeInvoice[]> => {
        const invoices = await fetchCollection<FeeInvoice>(
            'fee_invoices',
            where('status', '==', 'pending'),
        );
        const overdue = await fetchCollection<FeeInvoice>(
            'fee_invoices',
            where('status', '==', 'overdue'),
        );
        const partial = await fetchCollection<FeeInvoice>(
            'fee_invoices',
            where('status', '==', 'partial'),
        );
        return [...invoices, ...overdue, ...partial].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    },

    create: async (invoice: Partial<FeeInvoice>): Promise<FeeInvoice> => {
        const allInvoices = await feeInvoiceService.getAll();
        return createDoc<FeeInvoice>('fee_invoices', {
            school_id: invoice.school_id || '',
            studentId: invoice.studentId || '',
            studentName: invoice.studentName || '',
            class: invoice.class || '',
            section: invoice.section || '',
            academicYear: invoice.academicYear || '',
            invoiceNumber: invoice.invoiceNumber || `INV${new Date().getFullYear()}${String(allInvoices.length + 1).padStart(5, '0')}`,
            items: invoice.items || [],
            totalDue: invoice.totalDue || 0,
            totalPaid: invoice.totalPaid || 0,
            totalDiscount: invoice.totalDiscount || 0,
            totalBalance: invoice.totalBalance || invoice.totalDue || 0,
            dueDate: invoice.dueDate || '',
            status: invoice.status || 'pending',
            remarks: invoice.remarks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    },

    update: async (id: string, updates: Partial<FeeInvoice>): Promise<void> => {
        await updateDocById('fee_invoices', id, { ...updates, updated_at: new Date().toISOString() });
    },

    recordPayment: async (invoiceId: string, amountPaid: number): Promise<void> => {
        const invoice = await getDocById<FeeInvoice>('fee_invoices', invoiceId);
        if (!invoice) return;
        const newTotalPaid = (invoice.totalPaid || 0) + amountPaid;
        const newBalance = invoice.totalDue - invoice.totalDiscount - newTotalPaid;
        const newStatus = newBalance <= 0 ? 'paid' : 'partial';
        await updateDocById('fee_invoices', invoiceId, {
            totalPaid: newTotalPaid,
            totalBalance: Math.max(0, newBalance),
            status: newStatus,
            updated_at: new Date().toISOString(),
        });
    },
};

// ==================== AUDIT LOG SERVICE ====================

export const auditLogService = {
    getAll: async (): Promise<AuditLog[]> => {
        const logs = await fetchCollection<AuditLog>('audit_logs');
        return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    getBySchool: async (schoolId: string): Promise<AuditLog[]> => {
        const logs = await fetchCollection<AuditLog>('audit_logs', where('school_id', '==', schoolId));
        return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    getByUser: async (userId: string): Promise<AuditLog[]> => {
        const logs = await fetchCollection<AuditLog>('audit_logs', where('userId', '==', userId));
        return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    getByCollection: async (collectionName: string): Promise<AuditLog[]> => {
        const logs = await fetchCollection<AuditLog>('audit_logs', where('collectionName', '==', collectionName));
        return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    log: async (entry: Partial<AuditLog>): Promise<AuditLog> => {
        return createDoc<AuditLog>('audit_logs', {
            school_id: entry.school_id || '',
            userId: entry.userId || '',
            userName: entry.userName || '',
            action: entry.action || 'create',
            collectionName: entry.collectionName || '',
            documentId: entry.documentId || '',
            beforeData: entry.beforeData,
            afterData: entry.afterData,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            created_at: new Date().toISOString(),
        });
    },
};

// ==================== SUBJECT MAPPING SERVICE ====================

export const subjectMappingService = {
    getAll: async (schoolId: string, academicYearId?: string): Promise<SubjectMappingRecord[]> => {
        const constraints: any[] = [where('school_id', '==', schoolId)];
        if (academicYearId) {
            constraints.push(where('academic_year_id', '==', academicYearId));
        }
        return fetchCollection<SubjectMappingRecord>('subject_mappings', ...constraints);
    },

    create: async (mapping: Partial<SubjectMappingRecord>): Promise<SubjectMappingRecord> => {
        return createDoc<SubjectMappingRecord>('subject_mappings', {
            school_id: mapping.school_id || '',
            academic_year_id: mapping.academic_year_id || '',
            className: mapping.className || '',
            section: mapping.section || '',
            subjectName: mapping.subjectName || '',
            teacherName: mapping.teacherName || '',
            teacherEmail: mapping.teacherEmail || '',
            periods: mapping.periods || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    },

    update: async (id: string, mapping: Partial<SubjectMappingRecord>): Promise<void> => {
        await updateDocById('subject_mappings', id, {
            ...mapping,
            updated_at: new Date().toISOString(),
        });
    },

    delete: async (id: string): Promise<void> => {
        await deleteDocById('subject_mappings', id);
    },
};

// ==================== DEFAULT EXPORT (same shape as old service) ====================

const firestoreDataService = {
    user: userService,
    school: schoolService,
    student: studentService,
    teacher: teacherService,
    class: classService,
    subject: subjectService,
    attendance: attendanceService,
    lesson: lessonService,
    assignment: assignmentService,
    assignmentSubmission: assignmentSubmissionService,
    exam: examService,
    examResult: examResultService,
    fee: feeService,
    announcement: announcementService,
    enquiry: enquiryService,
    event: eventService,
    notification: notificationService,
    timetable: timetableService,
    statistics: statisticsService,
    schoolSettings: schoolSettingsService,
    academicYear: academicYearService,
    studentEnrollment: studentEnrollmentService,
    feeInvoice: feeInvoiceService,
    auditLog: auditLogService,
};

export default firestoreDataService;

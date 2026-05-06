#!/usr/bin/env node
/**
 * Setup test users for login flow verification
 * 
 * Run this after starting the backend to create test data
 * Usage: node setup_test_users.js
 */

require('dotenv').config({ path: './backend/.env' });

// Add backend node_modules to require path
const path = require('path');
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
module.paths.unshift(backendNodeModules);

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  // Try to use service account file
  if (require('fs').existsSync('./backend/serviceAccountKey.json')) {
    const serviceAccount = require('./backend/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Use application default credentials
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK:', err.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function setupTestUsers() {
  console.log('Setting up test users for login flow verification...\n');

  try {
    // Test 1: Existing user with Firebase Auth account
    const existingUserEmail = 'test-existing@example.com';
    console.log(`1. Creating existing user: ${existingUserEmail}`);
    
    try {
      // Create Firebase Auth user
      await auth.createUser({
        email: existingUserEmail,
        password: 'TestPassword123!',
        displayName: 'Test Existing User'
      });
      console.log(`   ✓ Created Firebase Auth account`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        console.log(`   ℹ Firebase Auth account already exists`);
      } else {
        throw err;
      }
    }

    // Create /users document for existing user
    const existingUserDoc = {
      email: existingUserEmail,
      displayName: 'Test Existing User',
      role: 'teacher',
      school_id: 'test-school-001',
      isFirstLogin: false, // Explicitly mark as not first login
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(existingUserEmail).set(existingUserDoc, { merge: true });
    console.log(`   ✓ Created /users document`);
    console.log(`   ✓ Expected result: Backend returns {exists: true, isFirstLogin: false}\n`);

    // Test 2: Provisioned user (e.g., teacher added by admin) without Firebase Auth
    const provisionedUserEmail = 'test-provisioned@example.com';
    console.log(`2. Creating provisioned user: ${provisionedUserEmail}`);

    // Create teacher record (provisioned by admin)
    const teacherDoc = {
      email: provisionedUserEmail,
      name: 'Test Provisioned Teacher',
      schoolId: 'test-school-001',
      createdAt: new Date(),
      status: 'active'
    };

    await db.collection('teachers').doc(provisionedUserEmail).set(teacherDoc);
    console.log(`   ✓ Created provisioned teacher record`);
    console.log(`   ✓ Expected result: Backend returns {exists: true, isFirstLogin: true}\n`);

    console.log('✅ Test users created successfully!\n');
    console.log('Test URLs:');
    console.log(`  Frontend: http://localhost:5174/login`);
    console.log(`  Backend:  http://localhost:3001\n`);
    console.log('Test emails:');
    console.log(`  Existing user (show password entry): ${existingUserEmail}`);
    console.log(`                Password: TestPassword123!\n`);
    console.log(`  Provisioned user (show create password): ${provisionedUserEmail}\n`);

  } catch (err) {
    console.error('Error setting up test users:', err);
    process.exit(1);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

setupTestUsers();

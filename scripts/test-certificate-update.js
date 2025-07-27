#!/usr/bin/env node

/**
 * Test script to verify certificate regeneration logic
 * This script tests the scenario where a user improves their final test score
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../account.json'); // Adjust path as needed
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testCertificateUpdate() {
  const testUserId = 'test-cert-update-user';
  
  try {
    console.log('=== Testing Certificate Update Logic ===\n');

    // Step 1: Create test user progress with initial low score
    console.log('1. Setting up test user with initial low score...');
    await db.collection('userProgress').doc(testUserId).set({
      userId: testUserId,
      name: 'Test User Certificate Update',
      email: 'test-cert-update@example.com',
      completedChapters: Array.from({length: 70}, (_, i) => `CH-${(i+1).toString().padStart(3, '0')}`),
      unlockedChapters: Array.from({length: 70}, (_, i) => `CH-${(i+1).toString().padStart(3, '0')}`),
      finalTestUnlocked: true,
      finalTestCompleted: true,
      certificateUnlocked: true,
      finalTestScore: 18,
      finalTestTotalQuestions: 50,
      paymentCompleted: true,
      lastUpdated: new Date().toISOString()
    });
    console.log('✓ Test user created with score 18/50 (36%, Grade: C)');

    // Step 2: Generate initial certificate
    console.log('\n2. Generating initial certificate...');
    const initialCertResponse = await fetch('http://localhost:3000/api/certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    
    if (initialCertResponse.ok) {
      const initialCert = await initialCertResponse.json();
      console.log('✓ Initial certificate generated');
      console.log(`  Certificate ID: ${initialCert.certificate.certificateId}`);
      console.log(`  Grade: ${initialCert.certificate.grade}`);
      console.log(`  Score: ${initialCert.certificate.finalTestScore}/${initialCert.certificate.finalTestTotalQuestions}`);
    } else {
      console.log('⚠ Certificate generation failed (expected if external API is not available)');
    }

    // Step 3: Update user score to higher value
    console.log('\n3. Updating user score to 48/50...');
    await db.collection('userProgress').doc(testUserId).update({
      finalTestScore: 48,
      finalTestTotalQuestions: 50,
      lastUpdated: new Date().toISOString()
    });
    console.log('✓ User progress updated with score 48/50 (96%, Grade: A+)');

    // Step 4: Try to generate certificate again (should update existing)
    console.log('\n4. Regenerating certificate with updated score...');
    const updatedCertResponse = await fetch('http://localhost:3000/api/certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    
    if (updatedCertResponse.ok) {
      const updatedCert = await updatedCertResponse.json();
      console.log('✓ Certificate updated successfully');
      console.log(`  Certificate ID: ${updatedCert.certificate.certificateId}`);
      console.log(`  Grade: ${updatedCert.certificate.grade}`);
      console.log(`  Score: ${updatedCert.certificate.finalTestScore}/${updatedCert.certificate.finalTestTotalQuestions}`);
      console.log(`  Message: ${updatedCert.message}`);
    } else {
      const error = await updatedCertResponse.json();
      console.log('✗ Certificate update failed:', error.message);
    }

    // Step 5: Cleanup
    console.log('\n5. Cleaning up test data...');
    
    // Delete test user progress
    await db.collection('userProgress').doc(testUserId).delete();
    
    // Delete any test certificates
    const testCertQuery = db.collection('certificates').where('userId', '==', testUserId);
    const testCertSnapshot = await testCertQuery.get();
    const deletePromises = testCertSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    console.log('✓ Test data cleaned up');

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test failed:', error);
    
    // Cleanup on error
    try {
      await db.collection('userProgress').doc(testUserId).delete();
      const testCertQuery = db.collection('certificates').where('userId', '==', testUserId);
      const testCertSnapshot = await testCertQuery.get();
      const deletePromises = testCertSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
  }
}

testCertificateUpdate();

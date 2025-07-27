#!/usr/bin/env node

/**
 * Script to regenerate a certificate for a user with updated final test scores
 * Usage: node regenerate-certificate.js <userId>
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

async function regenerateCertificate(userId) {
  try {
    console.log(`Starting certificate regeneration for user: ${userId}`);

    // Step 1: Check user progress and final test score
    const userProgressRef = db.collection('userProgress').doc(userId);
    const userProgressSnap = await userProgressRef.get();

    if (!userProgressSnap.exists) {
      console.error('User progress not found');
      return;
    }

    const progress = userProgressSnap.data();
    console.log('User progress found:');
    console.log(`- Final test score: ${progress.finalTestScore}/${progress.finalTestTotalQuestions}`);
    console.log(`- Certificate unlocked: ${progress.certificateUnlocked}`);

    if (!progress.certificateUnlocked) {
      console.error('Certificate is not unlocked for this user');
      return;
    }

    // Step 2: Check if certificate exists
    const existingCertQuery = db.collection('certificates').where('userId', '==', userId);
    const existingCertSnapshot = await existingCertQuery.get();

    if (!existingCertSnapshot.empty) {
      const existingCert = existingCertSnapshot.docs[0].data();
      console.log('Existing certificate found:');
      console.log(`- Certificate ID: ${existingCert.certificateId}`);
      console.log(`- Current stored score: ${existingCert.finalTestScore}/${existingCert.finalTestTotalQuestions}`);
      console.log(`- Current grade: ${existingCert.grade}`);
      
      // Delete existing certificate
      console.log('Deleting existing certificate...');
      await db.collection('certificates').doc(existingCertSnapshot.docs[0].id).delete();
      console.log('Existing certificate deleted.');
    } else {
      console.log('No existing certificate found.');
    }

    // Step 3: Call the certificate API to regenerate
    console.log('Certificate regeneration setup complete.');
    console.log('Now call POST /api/certificate with the userId to generate a new certificate with updated scores.');
    
    // Calculate what the new grade should be
    const percentage = Math.round((progress.finalTestScore / progress.finalTestTotalQuestions) * 100);
    const newGrade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : "C";
    
    console.log(`Expected new grade: ${newGrade} (${percentage}%)`);

  } catch (error) {
    console.error('Error regenerating certificate:', error);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node regenerate-certificate.js <userId>');
  process.exit(1);
}

regenerateCertificate(userId);

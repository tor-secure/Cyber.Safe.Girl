#!/usr/bin/env node

/**
 * Manual certificate update script
 * Use this to fix the certificate for the user with the score improvement issue
 * Usage: node fix-certificate.js <userId>
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

async function fixUserCertificate(userId) {
  try {
    console.log(`Fixing certificate for user: ${userId}\n`);

    // Step 1: Get current user progress
    const userProgressRef = db.collection('userProgress').doc(userId);
    const userProgressSnap = await userProgressRef.get();

    if (!userProgressSnap.exists) {
      console.error('❌ User progress not found');
      return;
    }

    const progress = userProgressSnap.data();
    console.log('📊 Current user progress:');
    console.log(`   Name: ${progress.name}`);
    console.log(`   Email: ${progress.email}`);
    console.log(`   Final test score: ${progress.finalTestScore}/${progress.finalTestTotalQuestions}`);
    console.log(`   Certificate unlocked: ${progress.certificateUnlocked}`);

    // Calculate current grade
    const percentage = Math.round((progress.finalTestScore / progress.finalTestTotalQuestions) * 100);
    const currentGrade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : "C";
    console.log(`   Current grade should be: ${currentGrade} (${percentage}%)\n`);

    if (!progress.certificateUnlocked) {
      console.error('❌ Certificate is not unlocked for this user');
      return;
    }

    // Step 2: Check existing certificate
    const existingCertQuery = db.collection('certificates').where('userId', '==', userId);
    const existingCertSnapshot = await existingCertQuery.get();

    if (existingCertSnapshot.empty) {
      console.log('ℹ️  No existing certificate found. User can generate a new one.');
      return;
    }

    const existingCert = existingCertSnapshot.docs[0];
    const existingCertData = existingCert.data();
    
    console.log('📜 Existing certificate:');
    console.log(`   Certificate ID: ${existingCertData.certificateId}`);
    console.log(`   Stored score: ${existingCertData.finalTestScore}/${existingCertData.finalTestTotalQuestions}`);
    console.log(`   Stored grade: ${existingCertData.grade}`);
    console.log(`   Issue date: ${new Date(existingCertData.issueDate).toLocaleDateString()}\n`);

    // Step 3: Check if update is needed
    const needsUpdate = progress.finalTestScore > (existingCertData.finalTestScore || 0);
    
    if (!needsUpdate) {
      console.log('✅ Certificate is already up to date with the latest score.');
      return;
    }

    console.log('🔄 Certificate needs update due to score improvement!');
    console.log(`   Old score: ${existingCertData.finalTestScore}/${existingCertData.finalTestTotalQuestions} (${existingCertData.grade})`);
    console.log(`   New score: ${progress.finalTestScore}/${progress.finalTestTotalQuestions} (${currentGrade})\n`);

    // Step 4: Delete old certificate
    console.log('🗑️  Deleting old certificate...');
    await existingCert.ref.delete();
    console.log('✅ Old certificate deleted\n');

    console.log('🎯 Manual fix complete!');
    console.log('Now the user can generate a new certificate with the updated score.');
    console.log('The next time they call the certificate API, it will create a new certificate with:');
    console.log(`   - Score: ${progress.finalTestScore}/${progress.finalTestTotalQuestions}`);
    console.log(`   - Grade: ${currentGrade}`);
    console.log(`   - Percentage: ${percentage}%`);

  } catch (error) {
    console.error('❌ Error fixing certificate:', error);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node fix-certificate.js <userId>');
  console.error('Example: node fix-certificate.js user123');
  process.exit(1);
}

fixUserCertificate(userId);

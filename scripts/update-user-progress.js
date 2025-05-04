const admin = require('firebase-admin');
require('dotenv').config();


// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),})
  });
}
// test
const db = admin.firestore();

async function updateUserProgress() {
  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail('hsshreyas00@gmail.com');
    const userId = userRecord.uid;
    console.log(`Found user with ID: ${userId}`);

    // Generate completed chapters array (CH-001 to CH-069)
    const completedChapters = [];
    for (let i = 1; i <= 70; i++) {
      completedChapters.push(`CH-${i.toString().padStart(3, '0')}`);
    }

    // Generate unlocked chapters array (CH-001 to CH-070)
    const unlockedChapters = [...completedChapters];
    unlockedChapters.push('CH-070'); // Add chapter 70

    // Update user progress in Firestore
    const userProgressRef = db.collection('userProgress').doc(userId);
    
    // Check if document exists
    const doc = await userProgressRef.get();
    
    if (doc.exists) {
      // Update existing document
      await userProgressRef.update({
        completedChapters,
        unlockedChapters,
        finalTestUnlocked: false, // Unlock final test
        finalTestCompleted: false,
        paymentCompleted: false, // Mark payment as completed
        lastUpdated: new Date().toISOString()
      });
      console.log(`Successfully updated progress for user ${userId} to chapter 70`);
    } else {
      // Create new document
      await userProgressRef.set({
        userId,
        email: 'test@test.com',
        name: 'Test User',
        completedChapters,
        unlockedChapters,
        finalTestUnlocked: false,
        finalTestCompleted: false,
        certificateUnlocked: false,
        paymentCompleted: false, // Set payment as completed
        lastUpdated: new Date().toISOString()
      });
      console.log(`Successfully created progress for user ${userId} at chapter 70`);
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
  } finally {
    process.exit(0);
  }
}

updateUserProgress();

// Script to reset password for a user
const admin = require('firebase-admin');

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

// Reset password for the test user
async function resetPassword() {
  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail('test@test.com');
    
    // Update user
    await admin.auth().updateUser(userRecord.uid, {
      password: 'password123',
      emailVerified: true
    });
    
    console.log(`Successfully reset password for user: ${userRecord.email}`);
    console.log('New password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
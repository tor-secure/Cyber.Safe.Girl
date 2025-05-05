// Script to reset password for a user with proper private key handling
const admin = require('firebase-admin');
const fs = require('fs');

// Read the .env.local file directly
const envFile = fs.readFileSync('.env.local', 'utf8');

// Extract the project ID
const projectIdMatch = envFile.match(/NEXT_PUBLIC_FIREBASE_PROJECT_ID=(.+)/);
const projectId = projectIdMatch ? projectIdMatch[1].trim() : null;

// Extract the client email
const clientEmailMatch = envFile.match(/NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=(.+)/);
const clientEmail = clientEmailMatch ? clientEmailMatch[1].trim() : null;

// Extract the private key - this is more complex due to newlines
const privateKeyStart = envFile.indexOf('NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="') + 'NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="'.length;
const privateKeyEnd = envFile.indexOf('"', privateKeyStart);
const privateKeyRaw = envFile.substring(privateKeyStart, privateKeyEnd);
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

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
      password: '1234567890',
      emailVerified: true
    });
    
    console.log(`Successfully reset password for user: ${userRecord.email}`);
    console.log('New password: 1234567890');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
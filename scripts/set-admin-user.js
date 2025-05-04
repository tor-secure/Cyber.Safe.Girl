/**
 * This script sets the admin claim for a user in Firebase Auth
 * 
 * Usage:
 * 1. Make sure you have the Firebase Admin SDK credentials set in your environment variables
 * 2. Run: node scripts/set-admin-user.js <user-email>
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin SDK
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

async function setAdminClaim(email) {
  try {
    // Get the user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set admin claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`Successfully set admin claim for user: ${email}`);
    console.log(`User UID: ${user.uid}`);
    
    // Verify the claim was set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('User claims:', updatedUser.customClaims);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin claim:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide a user email as an argument');
  console.error('Usage: node scripts/set-admin-user.js <user-email>');
  process.exit(1);
}

setAdminClaim(email);
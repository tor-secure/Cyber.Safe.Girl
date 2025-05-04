// Script to check if a user exists in Firebase
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

// Check if user exists
admin.auth().getUserByEmail('test@test.com')
  .then(user => {
    console.log('User exists:', user.uid);
    console.log('Email:', user.email);
    console.log('Email verified:', user.emailVerified);
    console.log('Display name:', user.displayName);
    console.log('Disabled:', user.disabled);
    
    // Get custom claims
    return admin.auth().getUser(user.uid);
  })
  .then(userRecord => {
    console.log('Custom claims:', userRecord.customClaims);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error checking user:', error);
    process.exit(1);
  });
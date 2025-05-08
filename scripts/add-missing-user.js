// Script to add a missing user to the users collection
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin with service account
try {
  // Get the private key from environment variables or .env file
  require('dotenv').config();
  
  // Handle the private key format
  let privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
  
  // Remove surrounding quotes if they exist
  privateKey = privateKey?.replace(/^"(.*)"$/, '$1');
  
  // Replace escaped newlines with actual newlines
  privateKey = privateKey?.replace(/\\n/g, '\n');
  
  console.log("Firebase Admin initialization");
  console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Client Email:", process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL);
  console.log("Private Key exists:", !!privateKey);
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
      !process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL || 
      !privateKey) {
    console.error("Missing required environment variables for Firebase Admin");
    process.exit(1);
  }
  
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
  }
  
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
  process.exit(1);
}

const db = admin.firestore();

async function addMissingUser() {
  const userId = 'AWZhrfEFmkVV3k7ARU4xSQpJanV2';
  console.log(`\nAdding user with ID: ${userId} to users collection`);
  
  // First check if user exists in userProgress collection
  const userProgressDoc = await db.collection('userProgress').doc(userId).get();
  
  if (!userProgressDoc.exists) {
    console.error('User not found in userProgress collection');
    process.exit(1);
  }
  
  const userProgressData = userProgressDoc.data();
  console.log('Found user in userProgress collection:', userProgressData);
  
  // Create user object for users collection
  const userData = {
    id: userId,
    email: userProgressData.email,
    name: userProgressData.name,
    role: 'user',
    createdAt: userProgressData.lastUpdated || new Date().toISOString(),
    lastLogin: userProgressData.lastUpdated || new Date().toISOString(),
    isAdmin: false,
    status: 'active'
  };
  
  // Add to users collection
  await db.collection('users').doc(userId).set(userData);
  console.log('Added user to users collection:', userData);
}

// Run the function
addMissingUser()
  .then(() => {
    console.log("\nUser added successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error adding user:", error);
    process.exit(1);
  });
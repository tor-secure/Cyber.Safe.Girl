// Script to check for a user by ID in the database
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

async function checkUserById() {
  const userId = 'AWZhrfEFmkVV3k7ARU4xSQpJanV2';
  console.log(`\nChecking for user with ID: ${userId}`);
  
  // Check users collection
  console.log("\n--- USERS COLLECTION ---");
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (userDoc.exists) {
    console.log('Found user in users collection:');
    console.log(userDoc.data());
  } else {
    console.log('Not found in users collection');
  }
  
  // Check if user exists in any collection
  console.log("\n--- CHECKING ALL COLLECTIONS ---");
  const collections = await db.listCollections();
  
  for (const collection of collections) {
    const collectionId = collection.id;
    const doc = await db.collection(collectionId).doc(userId).get();
    
    if (doc.exists) {
      console.log(`Found in collection: ${collectionId}`);
      console.log(doc.data());
    }
  }
}

// Run the function
checkUserById()
  .then(() => {
    console.log("\nCheck completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error checking user:", error);
    process.exit(1);
  });
// Script to check for a specific user in the database
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

async function checkSpecificUser() {
  const email = 'hsshreyas00@gmail.com';
  console.log(`\nChecking for user with email: ${email}`);
  
  // Check users collection
  console.log("\n--- USERS COLLECTION ---");
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  
  if (!usersSnapshot.empty) {
    console.log(`Found ${usersSnapshot.size} matching user(s) in users collection:`);
    usersSnapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(doc.data());
      console.log('---');
    });
  } else {
    console.log('Not found in users collection');
  }
  
  // Check certificates collection
  console.log("\n--- CERTIFICATES COLLECTION ---");
  const certsSnapshot = await db.collection('certificates').where('email', '==', email).get();
  
  if (!certsSnapshot.empty) {
    console.log(`Found ${certsSnapshot.size} matching certificate(s):`);
    certsSnapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(doc.data());
      console.log('---');
    });
  } else {
    console.log('Not found in certificates collection');
  }
  
  // Check user_progress collection
  console.log("\n--- USER_PROGRESS COLLECTION ---");
  const progressSnapshot = await db.collection('user_progress').where('email', '==', email).get();
  
  if (!progressSnapshot.empty) {
    console.log(`Found ${progressSnapshot.size} matching progress record(s):`);
    progressSnapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(doc.data());
      console.log('---');
    });
  } else {
    console.log('Not found in user_progress collection');
  }
  
  // Check userProgress collection (alternate name)
  console.log("\n--- USERPROGRESS COLLECTION ---");
  const userProgressSnapshot = await db.collection('userProgress').where('email', '==', email).get();
  
  if (!userProgressSnapshot.empty) {
    console.log(`Found ${userProgressSnapshot.size} matching progress record(s):`);
    userProgressSnapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(doc.data());
      console.log('---');
    });
  } else {
    console.log('Not found in userProgress collection');
  }
  
  // List all collections in the database
  console.log("\n--- ALL COLLECTIONS ---");
  const collections = await db.listCollections();
  console.log("Collections in the database:");
  collections.forEach(collection => {
    console.log(`- ${collection.id}`);
  });
}

// Run the function
checkSpecificUser()
  .then(() => {
    console.log("\nCheck completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error checking user:", error);
    process.exit(1);
  });
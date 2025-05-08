// Script to check database contents
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
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
  
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Firebase admin initialization error:", error);
  process.exit(1);
}

const db = admin.firestore();

async function checkDatabase() {
  console.log("\n=== DATABASE CONTENTS ===\n");
  
  // Check users collection
  console.log("--- USERS ---");
  try {
    const usersSnapshot = await db.collection("users").get();
    
    if (usersSnapshot.empty) {
      console.log("No users found in database");
    } else {
      console.log(`Found ${usersSnapshot.size} users:`);
      
      const users = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          email: userData.email,
          name: userData.name,
          role: userData.isAdmin ? "admin" : "user",
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
          ...userData
        });
      });
      
      console.log(JSON.stringify(users, null, 2));
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
  
  // Check certificates collection
  console.log("\n--- CERTIFICATES ---");
  try {
    const certificatesSnapshot = await db.collection("certificates").get();
    
    if (certificatesSnapshot.empty) {
      console.log("No certificates found in database");
    } else {
      console.log(`Found ${certificatesSnapshot.size} certificates:`);
      
      const certificates = [];
      certificatesSnapshot.forEach(doc => {
        certificates.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(JSON.stringify(certificates, null, 2));
    }
  } catch (error) {
    console.error("Error fetching certificates:", error);
  }
  
  // Check coupons collection
  console.log("\n--- COUPONS ---");
  try {
    const couponsSnapshot = await db.collection("coupons").get();
    
    if (couponsSnapshot.empty) {
      console.log("No coupons found in database");
    } else {
      console.log(`Found ${couponsSnapshot.size} coupons:`);
      
      const coupons = [];
      couponsSnapshot.forEach(doc => {
        coupons.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(JSON.stringify(coupons, null, 2));
    }
  } catch (error) {
    console.error("Error fetching coupons:", error);
  }
  
  // Check user_progress collection
  console.log("\n--- USER PROGRESS ---");
  try {
    const progressSnapshot = await db.collection("user_progress").get();
    
    if (progressSnapshot.empty) {
      console.log("No user progress records found in database");
    } else {
      console.log(`Found ${progressSnapshot.size} user progress records:`);
      
      const progress = [];
      progressSnapshot.forEach(doc => {
        progress.push({
          userId: doc.id,
          ...doc.data()
        });
      });
      
      console.log(JSON.stringify(progress, null, 2));
    }
  } catch (error) {
    console.error("Error fetching user progress:", error);
  }
  
  // Check admins collection
  console.log("\n--- ADMINS ---");
  try {
    const adminsSnapshot = await db.collection("admins").get();
    
    if (adminsSnapshot.empty) {
      console.log("No admins found in database");
    } else {
      console.log(`Found ${adminsSnapshot.size} admins:`);
      
      const admins = [];
      adminsSnapshot.forEach(doc => {
        admins.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(JSON.stringify(admins, null, 2));
    }
  } catch (error) {
    console.error("Error fetching admins:", error);
  }
}

// Run the check
checkDatabase()
  .then(() => {
    console.log("\nDatabase check completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error checking database:", error);
    process.exit(1);
  });
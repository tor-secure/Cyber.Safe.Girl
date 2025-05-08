// Script to add test data to the database
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

async function addTestData() {
  console.log("\n=== ADDING TEST DATA ===\n");
  
  // Add test users
  console.log("--- ADDING USERS ---");
  try {
    const testUsers = [
      {
        id: "user1",
        email: "user1@example.com",
        name: "Test User 1",
        isAdmin: false,
        status: "active",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      {
        id: "user2",
        email: "user2@example.com",
        name: "Test User 2",
        isAdmin: false,
        status: "active",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "user3",
        email: "user3@example.com",
        name: "Test User 3",
        isAdmin: false,
        status: "inactive",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "admin1",
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
        status: "active",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: new Date().toISOString()
      }
    ];
    
    for (const user of testUsers) {
      const userId = user.id;
      delete user.id;
      
      await db.collection("users").doc(userId).set(user);
      console.log(`Added user: ${userId}`);
      
      // Add admin to admins collection if isAdmin is true
      if (user.isAdmin) {
        await db.collection("admins").doc(userId).set({
          role: "admin",
          createdAt: user.createdAt
        });
        console.log(`Added admin: ${userId}`);
      }
    }
    
    console.log("Successfully added test users");
  } catch (error) {
    console.error("Error adding test users:", error);
  }
  
  // Add test user progress
  console.log("\n--- ADDING USER PROGRESS ---");
  try {
    const testProgress = [
      {
        userId: "user1",
        completedChapters: [1, 2, 3, 4, 5],
        quizScores: {
          "1": 80,
          "2": 90,
          "3": 75,
          "4": 85,
          "5": 95
        },
        currentChapter: 6,
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date().toISOString(),
        email: "user1@example.com",
        name: "Test User 1"
      },
      {
        userId: "user2",
        completedChapters: [1, 2, 3],
        quizScores: {
          "1": 70,
          "2": 80,
          "3": 65
        },
        currentChapter: 4,
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        email: "user2@example.com",
        name: "Test User 2"
      },
      {
        userId: "user3",
        completedChapters: [1],
        quizScores: {
          "1": 60
        },
        currentChapter: 2,
        startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        email: "user3@example.com",
        name: "Test User 3"
      }
    ];
    
    for (const progress of testProgress) {
      const userId = progress.userId;
      delete progress.userId;
      
      await db.collection("user_progress").doc(userId).set(progress);
      console.log(`Added progress for user: ${userId}`);
    }
    
    console.log("Successfully added test user progress");
  } catch (error) {
    console.error("Error adding test user progress:", error);
  }
}

// Run the script
addTestData()
  .then(() => {
    console.log("\nTest data added successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error adding test data:", error);
    process.exit(1);
  });
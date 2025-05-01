// Script to update existing user progress records with email and name
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL)}`,
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    process.exit(1);
  }
}

async function updateUserData() {
  try {
    const db = admin.firestore();
    
    // Get all users from Firebase Authentication
    const usersResult = await admin.auth().listUsers();
    const users = usersResult.users;
    
    console.log(`Found ${users.length} users in Firebase Authentication`);
    
    // Process each user
    for (const user of users) {
      console.log(`Processing user: ${user.uid} (${user.email || 'No email'})`);
      
      // Get user's display name or use email prefix
      const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Unknown');
      const email = user.email || 'No email';
      
      // Update user progress
      const userProgressRef = db.collection('userProgress').doc(user.uid);
      const userProgressDoc = await userProgressRef.get();
      
      if (userProgressDoc.exists) {
        console.log(`Updating user progress for ${user.uid}`);
        await userProgressRef.update({
          email: email,
          name: name,
          lastUpdated: new Date().toISOString()
        });
        console.log(`Updated user progress for ${user.uid}`);
      } else {
        console.log(`No user progress found for ${user.uid}`);
      }
      
      // Update quiz analytics
      const quizAnalyticsQuery = db.collection('userQuizAnalytics').where('userId', '==', user.uid);
      const quizAnalyticsSnapshot = await quizAnalyticsQuery.get();
      
      if (!quizAnalyticsSnapshot.empty) {
        console.log(`Updating ${quizAnalyticsSnapshot.size} quiz analytics records for ${user.uid}`);
        
        const batch = db.batch();
        quizAnalyticsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            email: email,
            name: name
          });
        });
        
        await batch.commit();
        console.log(`Updated quiz analytics for ${user.uid}`);
      } else {
        console.log(`No quiz analytics found for ${user.uid}`);
      }
    }
    
    console.log('User data update completed successfully');
  } catch (error) {
    console.error('Error updating user data:', error);
  }
}

// Run the update function
updateUserData()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
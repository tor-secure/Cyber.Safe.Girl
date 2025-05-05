/**
 * This script generates a test coupon in Firebase Firestore
 * 
 * Usage:
 * 1. Make sure you have the Firebase Admin SDK credentials set in your environment variables
 * 2. Run: node scripts/generate-test-coupon.js
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

// Function to generate a random string
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function generateTestCoupon() {
  try {
    const db = admin.firestore();
    
    // Generate a unique code
    const code = `TEST${generateRandomString(6)}`;
    
    // Create coupon data
    const couponData = {
      code,
      discountPercentage: 100, // 100% discount
      maxUses: 10,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      usedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'script',
    };
    
    // Add to Firestore
    const couponRef = db.collection('coupons').doc();
    await couponRef.set(couponData);
    
    console.log('Test coupon generated successfully:');
    console.log({
      id: couponRef.id,
      ...couponData
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating test coupon:', error);
    process.exit(1);
  }
}

generateTestCoupon();
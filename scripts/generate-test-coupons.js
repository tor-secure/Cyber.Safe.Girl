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

async function generateTestCoupons() {
  try {
    const db = admin.firestore();
    const couponsRef = db.collection('coupons');
    
    // Generate a public coupon (unlimited uses)
    const publicCouponData = {
      code: 'CSGPUBLIC',
      discountPercentage: 100,
      maxUses: null, // null means unlimited uses
      usedCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: null, // null means no expiry
      createdBy: 'system',
    };
    
    // Generate a one-time coupon
    const oneTimeCouponData = {
      code: 'CSGONETIME',
      discountPercentage: 100,
      maxUses: 1, // one-time use only
      usedCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: null, // null means no expiry
      createdBy: 'system',
    };
    
    // Check if coupons already exist
    const publicCouponQuery = await couponsRef.where('code', '==', 'CSGPUBLIC').get();
    const oneTimeCouponQuery = await couponsRef.where('code', '==', 'CSGONETIME').get();
    
    // Add coupons if they don't exist
    if (publicCouponQuery.empty) {
      await couponsRef.add(publicCouponData);
      console.log('Public coupon created: CSGPUBLIC');
    } else {
      console.log('Public coupon already exists: CSGPUBLIC');
    }
    
    if (oneTimeCouponQuery.empty) {
      await couponsRef.add(oneTimeCouponData);
      console.log('One-time coupon created: CSGONETIME');
    } else {
      console.log('One-time coupon already exists: CSGONETIME');
    }
    
    // List all coupons
    const allCoupons = await couponsRef.get();
    console.log('\nAll coupons:');
    allCoupons.forEach(doc => {
      console.log(`- ${doc.data().code} (Max uses: ${doc.data().maxUses || 'Unlimited'}, Used: ${doc.data().usedCount})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating test coupons:', error);
    process.exit(1);
  }
}

generateTestCoupons();
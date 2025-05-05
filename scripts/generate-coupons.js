const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
  }
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: envVars.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      // Use the private key directly, removing quotes if present
      privateKey: envVars.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/^"(.*)"$/, '$1')
    })
  });
}

const db = admin.firestore();

async function generatePublicCoupon() {
  try {
    // Check if the coupon already exists
    const existingCoupon = await db.collection('coupons')
      .where('code', '==', 'PUBLIC100')
      .limit(1)
      .get();
    
    if (!existingCoupon.empty) {
      console.log('Public coupon already exists');
      return existingCoupon.docs[0].id;
    }
    
    // Create a public coupon
    const couponData = {
      code: 'PUBLIC100',
      discountPercentage: 100,
      maxUses: null, // Unlimited uses
      expiresAt: null, // Never expires
      usedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'script',
      isPublic: true
    };
    
    const couponRef = await db.collection('coupons').add(couponData);
    console.log('Public coupon created with ID:', couponRef.id);
    return couponRef.id;
  } catch (error) {
    console.error('Error creating public coupon:', error);
    throw error;
  }
}

async function generateOneTimeCoupon() {
  try {
    // Generate a random code
    const generateRandomString = (length) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
    
    const code = `ONE-${generateRandomString(8)}`;
    
    // Create a one-time coupon
    const couponData = {
      code,
      discountPercentage: 100,
      maxUses: 1, // One-time use
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 30 days
      usedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'script',
      isOneTime: true
    };
    
    const couponRef = await db.collection('coupons').add(couponData);
    console.log('One-time coupon created with ID:', couponRef.id);
    console.log('One-time coupon code:', code);
    return { id: couponRef.id, code };
  } catch (error) {
    console.error('Error creating one-time coupon:', error);
    throw error;
  }
}

async function resetFinalTestData() {
  try {
    // Get all users
    const usersSnapshot = await db.collection('userProgress').get();
    
    // Batch update to reset final test data
    const batch = db.batch();
    
    usersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        finalTestUnlocked: false,
        paymentCompleted: false,
        paymentMethod: null,
        couponCode: null
      });
    });
    
    await batch.commit();
    console.log(`Reset final test data for ${usersSnapshot.size} users`);
  } catch (error) {
    console.error('Error resetting final test data:', error);
    throw error;
  }
}

async function main() {
  try {
    // Reset final test data
    await resetFinalTestData();
    
    // Generate coupons
    await generatePublicCoupon();
    await generateOneTimeCoupon();
    
    console.log('All operations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

main();
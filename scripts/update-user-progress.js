const admin = require('firebase-admin');
require('dotenv').config();

// Use the raw private key directly
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDtHijELubLAalL
ZIjn1vkfNB7hZezWdHRyu6xvGpIDpSY8wyO82tn3auWxVzo6dKmyLfNnl5VA+/H3
+VoAs2TR0IhcnLvmqAPOIuw2mClAFmfrOkPXV+VoiErdeK9PqHo80UdGEZcuh10G
deMRWUIbg/9IJzavgrUUmk/ipiC8tGzbeTsvZwlykBsnMQmdgdDPEISZSHPUBNLH
LZmZ6EBWHtS7eQtCZdiHBoKDecBdAh7lh3lxWBXtDxa4ITY07TmxSoQuDkOmYIGi
E5trLGnBIrkqAw33H6mJeDx77d8qoupsqZOIIlpDNcjJeBHlpTL/Dr/BC2afkdqq
eL60OY7HAgMBAAECggEAIc+YHolVjYL6Ie7++pgTw9hJwvgmslm+tRF/wAP46B4n
eqiUsvw98mLCx+vZOLaj7+1PdOkPdkm2shZTOCBccvKaTyJmRLiWelFOf2ZpE2Ne
hBM100IMS0CL9FKeJOywKXXqBNrDRPY2VJKAw1uH6qaCw0YcLSClM3/hfj8UEfQe
Ad7Ws1VcKvJc4VGqugF8olya/isV8ETdWvGtBcqj06BHyQYSZB47Yt63E9zYSkA5
pFjdY7gSVkHcAaEZeURUR2Y02RFktsbFClgdGX7tPPOoOlksf+wQKWTw+H3Qc7l2
/49QhngLlTwMtWuXljgp356eLedfRjMzpqHN+esysQKBgQD3joj2NdrBLIXk/ZuL
z4e/r991LFG5Mh8vN7G9pjuSKg9lhMqIraCavwU9Ex4NFM60PmTWIVeUKsKxDKSL
+u1PuOE6FIaWfEd3DjDAKM9RmpD2ONt1C0eklWcmaWZ3SyjVSjLni1Dh+1fhQYw9
D0rTsLVBKh5GoTsXiGqqj3JZrwKBgQD1NHrJcvU+YDbee15RaEiBt3hbpJJ2fjUl
xV4cH7veBdCbo4z30ts5pFWztm9dgf0fvbjEHWte4IJNTYyGAFAHBApjg58hxwbU
QGlStY5bTChC0Y7ZydUA8PfmnRFkfRsrNroPPj9m4K60npFuDxfwQWDsgjp7T37K
GIJg2vkaaQKBgQDySZCG2KKnWfoZ6pSoO49y7qDXv26kwQeAYRQWt3GqVnwHMfY/
2x9LFRX9do584xaDlmV+pddfbpJqUiNh1U8aLapR+/DVrAEN5teT2t090vd55J/1
Z/rQfGEeWR4uN2NZjWtQ7ytUYXjbQBoPUL49fb+Ibb6ABiEdoSg0knyqhQKBgQDy
l+xPOCwIfVprvTSwZ/MsWx9505WQJAdjCiS0wHS3EZu1EBec7IE2Qy8DMSB3K+8J
o0OUy+J5qLdh0bKQtOh4OHgqwoMDAQzxm5RYXwWrr+o5SWkCcdwKJV2uTIFzoQ7r
Lybfg99oYiyWyDbr44T0j0pcU++WJi0ztxHuz1Ya2QKBgDJAcDhy36VVlqJDGV36
f3/c1TAkw4NviZIzAdcIWYOfHQnnyEUHuMj9uDi+efer6Ww5KxgXYNvtJ8S++ddI
JaH4ksyqLkpQlU9oDsXoMG5pSwpfeSaTjsgaZmZYjnjL4wGfzvS9L89Z6Pk4eiP+
V/cjYLuoQEILa58q8TsIfC3D
-----END PRIVATE KEY-----`;
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=cyber-safe-girl-database
// NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDtHijELubLAalL\nZIjn1vkfNB7hZezWdHRyu6xvGpIDpSY8wyO82tn3auWxVzo6dKmyLfNnl5VA+/H3\n+VoAs2TR0IhcnLvmqAPOIuw2mClAFmfrOkPXV+VoiErdeK9PqHo80UdGEZcuh10G\ndeMRWUIbg/9IJzavgrUUmk/ipiC8tGzbeTsvZwlykBsnMQmdgdDPEISZSHPUBNLH\nLZmZ6EBWHtS7eQtCZdiHBoKDecBdAh7lh3lxWBXtDxa4ITY07TmxSoQuDkOmYIGi\nE5trLGnBIrkqAw33H6mJeDx77d8qoupsqZOIIlpDNcjJeBHlpTL/Dr/BC2afkdqq\neL60OY7HAgMBAAECggEAIc+YHolVjYL6Ie7++pgTw9hJwvgmslm+tRF/wAP46B4n\neqiUsvw98mLCx+vZOLaj7+1PdOkPdkm2shZTOCBccvKaTyJmRLiWelFOf2ZpE2Ne\nhBM100IMS0CL9FKeJOywKXXqBNrDRPY2VJKAw1uH6qaCw0YcLSClM3/hfj8UEfQe\nAd7Ws1VcKvJc4VGqugF8olya/isV8ETdWvGtBcqj06BHyQYSZB47Yt63E9zYSkA5\npFjdY7gSVkHcAaEZeURUR2Y02RFktsbFClgdGX7tPPOoOlksf+wQKWTw+H3Qc7l2\n/49QhngLlTwMtWuXljgp356eLedfRjMzpqHN+esysQKBgQD3joj2NdrBLIXk/ZuL\nz4e/r991LFG5Mh8vN7G9pjuSKg9lhMqIraCavwU9Ex4NFM60PmTWIVeUKsKxDKSL\n+u1PuOE6FIaWfEd3DjDAKM9RmpD2ONt1C0eklWcmaWZ3SyjVSjLni1Dh+1fhQYw9\nD0rTsLVBKh5GoTsXiGqqj3JZrwKBgQD1NHrJcvU+YDbee15RaEiBt3hbpJJ2fjUl\nxV4cH7veBdCbo4z30ts5pFWztm9dgf0fvbjEHWte4IJNTYyGAFAHBApjg58hxwbU\nQGlStY5bTChC0Y7ZydUA8PfmnRFkfRsrNroPPj9m4K60npFuDxfwQWDsgjp7T37K\nGIJg2vkaaQKBgQDySZCG2KKnWfoZ6pSoO49y7qDXv26kwQeAYRQWt3GqVnwHMfY/\n2x9LFRX9do584xaDlmV+pddfbpJqUiNh1U8aLapR+/DVrAEN5teT2t090vd55J/1\nZ/rQfGEeWR4uN2NZjWtQ7ytUYXjbQBoPUL49fb+Ibb6ABiEdoSg0knyqhQKBgQDy\nl+xPOCwIfVprvTSwZ/MsWx9505WQJAdjCiS0wHS3EZu1EBec7IE2Qy8DMSB3K+8J\no0OUy+J5qLdh0bKQtOh4OHgqwoMDAQzxm5RYXwWrr+o5SWkCcdwKJV2uTIFzoQ7r\nLybfg99oYiyWyDbr44T0j0pcU++WJi0ztxHuz1Ya2QKBgDJAcDhy36VVlqJDGV36\nf3/c1TAkw4NviZIzAdcIWYOfHQnnyEUHuMj9uDi+efer6Ww5KxgXYNvtJ8S++ddI\nJaH4ksyqLkpQlU9oDsXoMG5pSwpfeSaTjsgaZmZYjnjL4wGfzvS9L89Z6Pk4eiP+\nV/cjYLuoQEILa58q8TsIfC3D\n-----END PRIVATE KEY-----\n"
// NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@cyber-safe-girl-database.iam.gserviceaccount.com
 
// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "cyber-safe-girl-database",
      clientEmail: "firebase-adminsdk-fbsvc@cyber-safe-girl-database.iam.gserviceaccount.com",
      privateKey: privateKey
    })
  });
}

const db = admin.firestore();

async function updateUserProgress() {
  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail('s09082003@gmail.com');
    const userId = userRecord.uid;
    console.log(`Found user with ID: ${userId}`);

    // Generate completed chapters array (CH-001 to CH-069)
    const completedChapters = [];
    for (let i = 1; i <= 69; i++) {
      completedChapters.push(`CH-${i.toString().padStart(3, '0')}`);
    }

    // Generate unlocked chapters array (CH-001 to CH-070)
    const unlockedChapters = [...completedChapters];
    unlockedChapters.push('CH-070'); // Add chapter 70

    // Update user progress in Firestore
    const userProgressRef = db.collection('userProgress').doc(userId);
    
    // Check if document exists
    const doc = await userProgressRef.get();
    
    if (doc.exists) {
      // Update existing document
      await userProgressRef.update({
        completedChapters,
        unlockedChapters,
        finalTestUnlocked: false, // Unlock final test
        paymentCompleted: false, // Mark payment as completed
        lastUpdated: new Date().toISOString()
      });
      console.log(`Successfully updated progress for user ${userId} to chapter 69`);
    } else {
      // Create new document
      await userProgressRef.set({
        userId,
        email: 'test@test.com',
        name: 'Test User',
        completedChapters,
        unlockedChapters,
        finalTestUnlocked: true,
        finalTestCompleted: false,
        certificateUnlocked: false,
        paymentCompleted: true, // Set payment as completed
        lastUpdated: new Date().toISOString()
      });
      console.log(`Successfully created progress for user ${userId} at chapter 69`);
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
  } finally {
    process.exit(0);
  }
}

updateUserProgress();
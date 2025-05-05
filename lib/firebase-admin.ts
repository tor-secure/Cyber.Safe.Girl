import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  const apps = getApps()
  
  console.log("Firebase Admin initialization - Apps length:", apps.length);
  console.log("Firebase Admin initialization - Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Firebase Admin initialization - Client Email:", process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL);
  console.log("Firebase Admin initialization - Private Key exists:", !!process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY);

  if (!apps.length) {
    try {
      // Get the private key from environment variable
      let privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
      
      // Properly format the private key
      if (privateKey) {
        // Remove quotes if they exist
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        
        // Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // Ensure the key has proper PEM format
        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
          privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
        }
        
        if (!privateKey.endsWith('-----END PRIVATE KEY-----\n')) {
          if (privateKey.endsWith('-----END PRIVATE KEY-----')) {
            privateKey = privateKey + '\n';
          } else if (!privateKey.includes('-----END PRIVATE KEY-----')) {
            privateKey = privateKey + '\n-----END PRIVATE KEY-----\n';
          }
        }
      }
      
      console.log("Private key format check:", {
        originalLength: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.length,
        cleanedLength: privateKey?.length,
        startsWithDash: privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
        endsWithDash: privateKey?.endsWith('-----END PRIVATE KEY-----\n')
      });
      
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
          !process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL || 
          !privateKey) {
        console.error("Firebase admin initialization error: Missing required environment variables");
        return null;
      }
      
      const app = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })

      console.log("Firebase Admin initialization - Success:", !!app);
      return app
    } catch (error) {
      console.error("Firebase admin initialization error:", error)
      return null
    }
  }

  return apps[0]
}

// Initialize Firestore
const app = initializeFirebaseAdmin()
const adminDb = app ? getFirestore(app) : null

export { adminDb, FieldValue }

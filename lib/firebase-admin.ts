import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  const apps = getApps()
  
  console.log("Firebase Admin initialization - Apps length:", apps.length);
  console.log("Firebase Admin initialization - Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Firebase Admin initialization - Client Email:", process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL);
  console.log("Firebase Admin initialization - Private Key exists:", !!process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY);

  if (!apps.length) {
    try {
      const privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      
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
          // The private key needs to have newlines replaced
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

export { adminDb }

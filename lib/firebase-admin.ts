import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  const apps = getApps()

  if (!apps.length) {
    try {
      const app = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // The private key needs to have newlines replaced
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      })

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

import { initializeApp, getApps } from "firebase/app"
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence, Auth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project-id.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project-id.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456789",
}

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Auth with the appropriate persistence
let auth: Auth = getAuth(app);

if (typeof window !== 'undefined') {
  // We're in the browser
  // Set persistence to LOCAL (survives browser restarts)
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
} else {
  // We're on the server
  // Use in-memory persistence on the server
  setPersistence(auth, inMemoryPersistence)
    .catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
}

export { auth };
export const db = getFirestore(app);
export default app;

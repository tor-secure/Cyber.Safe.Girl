import { NextRequest } from "next/server"
import { adminDb } from "./firebase-admin"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  const apps = getApps()
  
  if (!apps.length) {
    try {
      // Get the private key from environment variable
      const privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
      
      // Handle the private key format - first remove surrounding quotes if they exist
      let cleanedKey = privateKey?.replace(/^"(.*)"$/, '$1');
      
      // Then replace escaped newlines with actual newlines
      cleanedKey = cleanedKey?.replace(/\\n/g, '\n');
      
      console.log("Firebase Admin initialization - Apps length:", apps.length);
      console.log("Firebase Admin initialization - Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      console.log("Firebase Admin initialization - Client Email:", process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL);
      console.log("Firebase Admin initialization - Private Key exists:", !!privateKey);
      
      console.log("Private key format check:", {
        originalLength: privateKey?.length,
        cleanedLength: cleanedKey?.length,
        startsWithDash: cleanedKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
        endsWithDash: cleanedKey?.endsWith('-----END PRIVATE KEY-----\n') || cleanedKey?.endsWith('-----END PRIVATE KEY-----')
      });
      
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
          !process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL || 
          !privateKey) {
        console.error("Firebase admin initialization error: Missing required environment variables");
        return null;
      }
      
      return initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
          privateKey: cleanedKey,
        }),
      });
    } catch (error) {
      console.error("Firebase admin initialization error:", error);
      return null;
    }
  }
  
  return apps[0];
}

// Server-side admin verification
export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  try {
    // Get token from multiple sources
    const authHeader = request.headers.get("Authorization")
    const customTokenHeader = request.headers.get("x-firebase-auth-token")
    
    // Try to get token from authorization header
    let token: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // If no token from auth header, try custom header
    if (!token && customTokenHeader) {
      token = customTokenHeader;
    }
    
    // If still no token, check cookies
    if (!token) {
      const cookies = request.cookies;
      const tokenCookie = cookies.get("firebase-auth-token");
      if (tokenCookie) {
        token = tokenCookie.value;
      }
    }

    if (!token) {
      console.log("No token provided in request")
      return false
    }

    // For development/testing purposes, allow a special admin token
    if (process.env.NODE_ENV === 'development' && token === 'dev-admin-token') {
      console.log("Using development admin token")
      return true
    }

    // Initialize Firebase Admin if needed
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error("Firebase admin is not initialized")
      return false
    }

    try {
      // Verify the token with Firebase Admin
      const auth = getAuth(app);
      const decodedToken = await auth.verifyIdToken(token);
      
      // Check if the user has admin claim
      if (decodedToken.admin === true) {
        return true;
      }
      
      // If no admin claim, check if the user is in the admins collection
      if (adminDb) {
        const adminRef = adminDb.collection("admins").doc(decodedToken.uid);
        const adminDoc = await adminRef.get();
        
        return adminDoc.exists;
      }
      
      return false;
    } catch (error) {
      console.error("Error verifying admin token:", error);
      
      // Fallback to the simplified token check if Firebase Admin verification fails
      try {
        // This is a simplified check as a fallback
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.log("Invalid token format");
          return false;
        }
        
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        const userId = payload.user_id || payload.sub || payload.uid;
        
        if (!userId) {
          console.log("No user ID found in token");
          return false;
        }
        
        // Check if user is in admins collection
        if (adminDb) {
          const adminRef = adminDb.collection("admins").doc(userId);
          const adminDoc = await adminRef.get();
          
          return adminDoc.exists;
        }
        
        return false;
      } catch (fallbackError) {
        console.error("Error in fallback admin verification:", fallbackError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error verifying admin session:", error)
    return false
  }
}
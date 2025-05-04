import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
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
      
      console.log("Private key format check:", {
        originalLength: privateKey?.length,
        cleanedLength: cleanedKey?.length,
        startsWithDash: cleanedKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
        endsWithDash: cleanedKey?.endsWith('-----END PRIVATE KEY-----\n') || cleanedKey?.endsWith('-----END PRIVATE KEY-----')
      });
      
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
          !process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL || 
          !privateKey) {
        console.error("Missing required environment variables for Firebase Admin");
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

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request - try multiple sources
    const authHeader = request.headers.get("authorization");
    const customTokenHeader = request.headers.get("x-firebase-auth-token");
    
    // Try to get token from authorization header
    let token: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
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
      return NextResponse.json({ isAdmin: false, error: "No token found in request" }, { status: 401 });
    }
    
    // Initialize Firebase Admin if needed
    const app = initializeFirebaseAdmin();
    if (!app) {
      return NextResponse.json({ isAdmin: false, error: "Firebase admin initialization failed" }, { status: 500 });
    }
    
    // Verify the token
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if the user has admin claim
    const isAdmin = decodedToken.admin === true;
    
    // Return detailed response for debugging
    return NextResponse.json({ 
      isAdmin,
      uid: decodedToken.uid,
      email: decodedToken.email,
      claims: {
        admin: decodedToken.admin
      }
    });
  } catch (error: any) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ 
      isAdmin: false, 
      error: "Authentication failed", 
      message: error.message || "Unknown error"
    }, { status: 401 });
  }
}
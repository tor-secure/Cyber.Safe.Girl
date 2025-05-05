import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

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

// GET: Debug authentication
export async function GET(request: NextRequest) {
  try {
    // Get all possible tokens from the request
    const authHeader = request.headers.get("authorization");
    const customTokenHeader = request.headers.get("x-firebase-auth-token");
    const cookies = request.cookies;
    const tokenCookie = cookies.get("firebase-auth-token");
    
    // Collect debug info
    const debugInfo = {
      headers: {
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader ? authHeader.substring(0, 10) + '...' : null,
        hasCustomTokenHeader: !!customTokenHeader,
        customTokenHeaderPrefix: customTokenHeader ? customTokenHeader.substring(0, 10) + '...' : null,
      },
      cookies: {
        hasTokenCookie: !!tokenCookie,
        tokenCookiePrefix: tokenCookie ? tokenCookie.value.substring(0, 10) + '...' : null,
        allCookies: Array.from(cookies.getAll()).map(c => c.name)
      },
      environment: {
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    };
    
    // Try to get token from any source
    let token: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    } else if (customTokenHeader) {
      token = customTokenHeader;
    } else if (tokenCookie) {
      token = tokenCookie.value;
    }
    
    // If we have a token, try to verify it
    let tokenInfo = null;
    if (token) {
      try {
        const app = initializeFirebaseAdmin();
        if (app) {
          const auth = getAuth(app);
          const decodedToken = await auth.verifyIdToken(token);
          
          tokenInfo = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            isAdmin: !!decodedToken.admin,
            authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
            expirationTime: new Date(decodedToken.exp * 1000).toISOString(),
            issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
          };
        } else {
          tokenInfo = { error: "Failed to initialize Firebase Admin" };
        }
      } catch (error) {
        tokenInfo = { 
          error: "Token verification failed", 
          message: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return NextResponse.json({ 
      debug: debugInfo,
      tokenInfo
    });
  } catch (error) {
    console.error("Error in debug-auth endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
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

// Helper function to get Firestore instance
function getDb() {
  const app = initializeFirebaseAdmin();
  if (!app) {
    return null;
  }
  return getFirestore(app);
}

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
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
    return { isAdmin: false, error: "Unauthorized: No token found in request" }
  }

  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      return { isAdmin: false, error: "Server configuration error" };
    }
    
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user has admin claim
    if (!decodedToken.admin) {
      return { isAdmin: false, error: "Forbidden: User is not an admin" }
    }
    
    return { isAdmin: true, uid: decodedToken.uid }
  } catch (error) {
    console.error("Error verifying admin token:", error)
    return { isAdmin: false, error: "Unauthorized: Invalid token" }
  }
}

// POST: Generate multiple coupons
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const { isAdmin, error, uid } = await verifyAdminToken(request)
    if (!isAdmin) {
      return NextResponse.json({ error }, { status: 401 })
    }

    // Get request body
    const { count, prefix, discountPercentage, maxUses, expiryDays } = await request.json()
    
    // Validate input
    if (!count || count <= 0 || count > 100) {
      return NextResponse.json({ error: "Count must be between 1 and 100" }, { status: 400 })
    }
    
    // Get Firestore instance
    const db = getDb();
    if (!db) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Calculate expiry date if expiryDays is provided
    let expiresAt = null;
    if (expiryDays && expiryDays > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      expiresAt = expiryDate.toISOString();
    }
    
    const couponsRef = db.collection("coupons")
    const generatedCoupons = []
    
    // Generate multiple coupons
    for (let i = 0; i < count; i++) {
      // Generate a random code with prefix
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
      const code = prefix ? `${prefix}-${randomPart}` : randomPart
      
      // Create new coupon
      const newCoupon = {
        code,
        discountPercentage: discountPercentage || 100,
        maxUses: maxUses || 1,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        createdBy: uid
      }
      
      const couponRef = await couponsRef.add(newCoupon)
      
      generatedCoupons.push({
        id: couponRef.id,
        ...newCoupon
      })
    }
    
    return NextResponse.json({ coupons: generatedCoupons })
  } catch (error) {
    console.error("Error generating multiple coupons:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate coupons"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore, DocumentData } from "firebase-admin/firestore"

// Define coupon type
interface Coupon {
  id: string;
  code: string;
  discountPercentage?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  createdBy?: string;
  createdAt?: string;
  lastUsedAt?: string;
}

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

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the request
    const authHeader = request.headers.get("authorization")
    let userId
    
    // If authorization header is provided, verify the token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1]
      
      if (token) {
        try {
          // Initialize Firebase Admin if needed
          const app = initializeFirebaseAdmin();
          if (!app) {
            console.error("Firebase admin initialization failed");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
          }
          
          // Verify the token
          const auth = getAuth(app);
          const decodedToken = await auth.verifyIdToken(token)
          userId = decodedToken.uid
        } catch (err) {
          console.error("Error verifying token:", err)
          // Continue with the request body approach if token verification fails
        }
      }
    }
    
    // Get request body (may contain userId for backward compatibility or couponCode to check)
    const body = await request.json()
    const { couponCode } = body
    
    // If userId is not set from token, get it from request body (backward compatibility)
    if (!userId && body.userId) {
      userId = body.userId
    }
    
    // Validate input
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Get Firestore instance
    const db = getDb();
    if (!db) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Check if user has completed all chapters
    const userProgressRef = db.collection("userProgress").doc(userId)
    const userProgressSnap = await userProgressRef.get()
    
    if (!userProgressSnap.exists) {
      return NextResponse.json({ error: "User progress not found" }, { status: 404 })
    }
    
    const progress = userProgressSnap.data()
    
    // Ensure progress is not undefined
    if (!progress) {
      return NextResponse.json({ error: "User progress is undefined" }, { status: 500 })
    }
    
    // Check if user has already passed the final test
    if (progress.finalTestPassed) {
      return NextResponse.json({ 
        eligible: true,
        reason: "FINAL_TEST_PASSED",
        message: "You have already passed the final test"
      })
    }
    
    // Check if payment is already completed or final test is unlocked
    // We still return eligibility status, but we don't prevent the user from applying new coupons
    // or making payments if they want to
    if (progress.paymentCompleted || progress.finalTestUnlocked) {
      return NextResponse.json({
        eligible: true,
        reason: "PAYMENT_COMPLETED",
        message: "You are eligible to take the final test",
        canStillApplyCoupon: true  // This flag indicates that the user can still apply coupons
      })
    }
    
    // If a specific coupon code is provided, check its validity
    if (couponCode) {
      // Verify the coupon code
      const couponsRef = db.collection("coupons")
      const couponSnapshot = await couponsRef
        .where("code", "==", couponCode)
        .limit(1)
        .get()
      
      if (couponSnapshot.empty) {
        return NextResponse.json({ 
          eligible: false,
          reason: "INVALID_COUPON",
          message: "Invalid coupon code"
        })
      }
      
      const couponDoc = couponSnapshot.docs[0]
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon
      
      // Check if coupon is expired
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ 
          eligible: false,
          reason: "COUPON_EXPIRED",
          message: "Coupon has expired"
        })
      }
      
      // Check if coupon has reached max uses
      if (coupon.maxUses && coupon.maxUses > 0 && (coupon.usedCount || 0) >= coupon.maxUses) {
        return NextResponse.json({ 
          eligible: false,
          reason: "COUPON_MAX_USES_REACHED",
          message: "Coupon has reached maximum uses"
        })
      }
      
      // Valid coupon
      return NextResponse.json({ 
        eligible: true,
        reason: "VALID_COUPON",
        message: "Valid coupon code",
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountPercentage: coupon.discountPercentage || 100
        }
      })
    }
    
    // Check if user has any valid coupon usage
    const couponUsageRef = db.collection("couponUsage")
    const couponUsageSnapshot = await couponUsageRef
      .where("userId", "==", userId)
      .limit(1)
      .get()
    
    if (!couponUsageSnapshot.empty) {
      // User has a coupon, update their progress to unlock the final test if not already
      if (!progress.finalTestUnlocked) {
        await userProgressRef.update({
          finalTestUnlocked: true,
          lastUpdated: new Date().toISOString()
        })
      }
      
      return NextResponse.json({
        eligible: true,
        reason: "COUPON_ALREADY_USED",
        message: "You are eligible to take the final test with your coupon"
      })
    }
    
    // User doesn't have a coupon and hasn't completed payment
    return NextResponse.json({
      eligible: false,
      reason: "NO_COUPON",
      message: "You need to apply a valid coupon or complete payment to take the final test"
    })
    
  } catch (error) {
    console.error("Error checking final test eligibility:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to check eligibility"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
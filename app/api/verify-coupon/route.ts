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
    let userId, userName
    
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
          
          // Get user info
          const userRecord = await auth.getUser(userId)
          userName = userRecord.displayName || userRecord.email || userId
        } catch (err) {
          console.error("Error verifying token:", err)
          // Continue with the request body approach if token verification fails
        }
      }
    }
    
    // If userId is not set from token, get it from request body (backward compatibility)
    const { userId: bodyUserId, couponCode, fullName } = await request.json()
    
    if (!userId) {
      userId = bodyUserId
      userName = fullName || "Unknown User"
    }

    if (!userId || !couponCode) {
      return NextResponse.json({ error: "User ID and coupon code are required" }, { status: 400 })
    }
    
    // Ensure we have a name for the user
    if (!userName && fullName) {
      userName = fullName
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
    if (!progress || !progress.completedChapters) {
      return NextResponse.json({ error: "User progress is undefined or invalid" }, { status: 500 })
    }

    // Check if user has completed the last chapter
    const completedChapters = progress.completedChapters || []
    const lastChapterId = "CH-070"

    if (!completedChapters.includes(lastChapterId)) {
      return NextResponse.json(
        {
          valid: false,
          message: "You need to complete all chapters before using a coupon",
        },
        { status: 200 },
      )
    }

    // We're removing this check to allow users to apply coupons even if they already have access
    // This allows users to use coupons or make payments regardless of their current access status

    // Check if coupon exists and is valid
    const couponsRef = db.collection("coupons")
    const couponQuery = await couponsRef.where("code", "==", couponCode).limit(1).get()

    if (couponQuery.empty) {
      return NextResponse.json(
        {
          valid: false,
          message: "Invalid coupon code. Only admin-generated coupons are accepted.",
        },
        { status: 200 },
      )
    }

    const couponDoc = couponQuery.docs[0]
    const couponData = couponDoc.data() as DocumentData
    const coupon: Coupon = { 
      id: couponDoc.id, 
      code: couponData.code,
      discountPercentage: couponData.discountPercentage,
      maxUses: couponData.maxUses,
      usedCount: couponData.usedCount || 0,
      expiresAt: couponData.expiresAt,
      createdBy: couponData.createdBy,
      createdAt: couponData.createdAt,
      lastUsedAt: couponData.lastUsedAt
    }
    
    // Verify this is an admin-generated coupon
    if (!coupon.createdBy) {
      return NextResponse.json(
        {
          valid: false,
          message: "Invalid coupon code. Only admin-generated coupons are accepted.",
        },
        { status: 200 },
      )
    }

    // Check if coupon is expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          message: "Coupon has expired",
        },
        { status: 200 },
      )
    }

    // Check if coupon has reached its usage limit
    if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
      return NextResponse.json(
        {
          valid: false,
          message: "Coupon has reached its usage limit",
        },
        { status: 200 },
      )
    }
    
    // Check if user has already used this coupon
    const couponUsageRef = db.collection("couponUsage")
    const existingUsageSnapshot = await couponUsageRef
      .where("couponId", "==", coupon.id)
      .where("userId", "==", userId)
      .limit(1)
      .get()
    
    if (!existingUsageSnapshot.empty) {
      return NextResponse.json({ 
        valid: true,
        message: "You have already applied this coupon",
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountPercentage: coupon.discountPercentage || 100
        }
      })
    }

    // Update coupon usage count
    await couponDoc.ref.update({
      usedCount: (coupon.usedCount || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    })

    // Get user email if available
    let userEmail = null;
    try {
      if (userId) {
        const firebaseApp = initializeFirebaseAdmin();
        if (firebaseApp) {
          const auth = getAuth(firebaseApp);
          const userRecord = await auth.getUser(userId);
          userEmail = userRecord.email || null;
        }
      }
    } catch (err) {
      console.error("Error fetching user email:", err);
      // Continue without email if there's an error
    }

    // Record coupon usage with more detailed user information
    await couponUsageRef.add({
      couponId: coupon.id,
      couponCode: couponCode,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      usedAt: new Date().toISOString(),
      discountPercentage: coupon.discountPercentage || 100
    })

    // Update user progress to mark final test as unlocked via coupon
    await userProgressRef.update({
      finalTestUnlocked: true,
      paymentMethod: "coupon",
      couponCode: couponCode,
      name: fullName || userName || null,
      lastUpdated: new Date().toISOString(),
    })

    return NextResponse.json({
      valid: true,
      message: "Coupon applied successfully! You can now take the final test.",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercentage: coupon.discountPercentage || 100
      }
    })
  } catch (error) {
    console.error("Error verifying coupon:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to verify coupon"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
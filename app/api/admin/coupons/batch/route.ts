import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAdmin: false, error: "Unauthorized: Missing or invalid token" }
  }

  const token = authHeader.split("Bearer ")[1]
  if (!token) {
    return { isAdmin: false, error: "Unauthorized: Missing token" }
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token)
    
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

// Generate a random coupon code
function generateRandomCode(prefix = "CSG") {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar looking characters
  let result = prefix ? `${prefix}-` : ""
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// POST: Create multiple coupons at once
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const { isAdmin, error, uid } = await verifyAdminToken(request)
    if (!isAdmin) {
      return NextResponse.json({ error }, { status: 401 })
    }

    // Get request body
    const { count, discountPercentage, maxUses, prefix } = await request.json()
    
    // Validate input
    if (!count || count < 1) {
      return NextResponse.json({ error: "Count must be at least 1" }, { status: 400 })
    }
    
    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Create batch of coupons
    const couponsRef = adminDb.collection("coupons")
    const batch = adminDb.batch()
    const coupons = []
    
    // Generate unique codes and add to batch
    for (let i = 0; i < count; i++) {
      let code = generateRandomCode(prefix)
      let isUnique = false
      let attempts = 0
      
      // Ensure code uniqueness (with a maximum of 10 attempts)
      while (!isUnique && attempts < 10) {
        // Check if code already exists
        const existingCoupon = await couponsRef.where("code", "==", code).limit(1).get()
        
        if (existingCoupon.empty) {
          isUnique = true
        } else {
          code = generateRandomCode(prefix)
          attempts++
        }
      }
      
      if (!isUnique) {
        return NextResponse.json({ 
          error: "Failed to generate unique coupon codes. Please try again." 
        }, { status: 500 })
      }
      
      const couponData = {
        code,
        discountPercentage: discountPercentage || 100,
        maxUses: maxUses || 1,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        createdBy: uid
      }
      
      const docRef = couponsRef.doc()
      batch.set(docRef, couponData)
      
      coupons.push({
        id: docRef.id,
        ...couponData
      })
    }
    
    // Commit the batch
    await batch.commit()
    
    return NextResponse.json({ coupons })
  } catch (error) {
    console.error("Error creating coupons batch:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create coupons"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
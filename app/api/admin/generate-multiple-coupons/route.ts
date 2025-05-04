import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"

// Function to generate a random string
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the request
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const token = authHeader.split("Bearer ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Verify the token
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    
    // Check if the user has admin claim
    const isAdmin = decodedToken.admin === true
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Get request body
    const { count, prefix, discountPercentage, maxUses, expiryDays } = await request.json()
    
    // Validate input
    if (!count || count < 1 || count > 100) {
      return NextResponse.json({ error: "Valid count (1-100) is required" }, { status: 400 })
    }
    
    if (!prefix) {
      return NextResponse.json({ error: "Prefix is required" }, { status: 400 })
    }
    
    if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100) {
      return NextResponse.json({ error: "Valid discount percentage (1-100) is required" }, { status: 400 })
    }
    
    // Calculate expiry date
    const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null
    
    // Generate coupons
    const couponsRef = adminDb.collection("coupons")
    const batch = adminDb.batch()
    const generatedCoupons = []
    
    for (let i = 0; i < count; i++) {
      // Generate a unique code
      let code
      let isUnique = false
      
      while (!isUnique) {
        code = `${prefix}${generateRandomString(6)}`
        
        // Check if code already exists
        const existingCoupon = await couponsRef.where("code", "==", code).limit(1).get()
        
        if (existingCoupon.empty) {
          isUnique = true
        }
      }
      
      // Create coupon data
      const couponData = {
        code,
        discountPercentage,
        maxUses: maxUses || null,
        expiresAt,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: decodedToken.uid,
      }
      
      // Add to batch
      const couponRef = couponsRef.doc()
      batch.set(couponRef, couponData)
      
      generatedCoupons.push({
        id: couponRef.id,
        ...couponData
      })
    }
    
    // Commit batch
    await batch.commit()
    
    return NextResponse.json({
      success: true,
      coupons: generatedCoupons
    })
  } catch (error) {
    console.error("Error generating multiple coupons:", error)
    return NextResponse.json({ error: "Failed to generate coupons" }, { status: 500 })
  }
}
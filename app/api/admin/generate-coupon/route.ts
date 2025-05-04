import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"

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
    const { code, discountPercentage, maxUses, expiryDays } = await request.json()
    
    // Validate input
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }
    
    if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100) {
      return NextResponse.json({ error: "Valid discount percentage (1-100) is required" }, { status: 400 })
    }
    
    // Check if coupon code already exists
    const couponsRef = adminDb.collection("coupons")
    const existingCoupon = await couponsRef.where("code", "==", code).limit(1).get()
    
    if (!existingCoupon.empty) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }
    
    // Calculate expiry date
    const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null
    
    // Create coupon
    const couponData = {
      code,
      discountPercentage,
      maxUses: maxUses || null,
      expiresAt,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: decodedToken.uid,
    }
    
    const couponRef = await couponsRef.add(couponData)
    
    return NextResponse.json({
      success: true,
      coupon: {
        id: couponRef.id,
        ...couponData
      }
    })
  } catch (error) {
    console.error("Error generating coupon:", error)
    return NextResponse.json({ error: "Failed to generate coupon" }, { status: 500 })
  }
}
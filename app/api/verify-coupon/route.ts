import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId, couponCode, fullName } = await request.json()

    if (!userId || !couponCode) {
      return NextResponse.json({ error: "User ID and coupon code are required" }, { status: 400 })
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Check if user has completed all chapters
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    const userProgressSnap = await userProgressRef.get()

    if (!userProgressSnap.exists) {
      return NextResponse.json({ error: "User progress not found" }, { status: 404 })
    }

    const progress = userProgressSnap.data()

    // Check if user has completed the last chapter
    const completedChapters = progress.completedChapters || []
    const lastChapterId = "CH-070"

    if (!completedChapters.includes(lastChapterId)) {
      return NextResponse.json(
        {
          error: "You need to complete all chapters before using a coupon",
        },
        { status: 403 },
      )
    }

    // Check if payment is already completed
    if (progress.paymentCompleted) {
      return NextResponse.json(
        {
          error: "Payment has already been completed",
        },
        { status: 400 },
      )
    }

    // Check if coupon exists and is valid
    const couponsRef = adminDb.collection("coupons")
    const couponQuery = await couponsRef.where("code", "==", couponCode).limit(1).get()

    if (couponQuery.empty) {
      return NextResponse.json(
        {
          valid: false,
          message: "Invalid coupon code",
        },
        { status: 200 },
      )
    }

    const couponDoc = couponQuery.docs[0]
    const coupon = couponDoc.data()

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
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        {
          valid: false,
          message: "Coupon has reached its usage limit",
        },
        { status: 200 },
      )
    }

    // Update coupon usage count
    await couponDoc.ref.update({
      usedCount: (coupon.usedCount || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    })

    // Record coupon usage
    await adminDb.collection("couponUsage").add({
      couponId: couponDoc.id,
      couponCode: couponCode,
      userId: userId,
      usedAt: new Date().toISOString(),
    })

    // Update user progress to mark payment as completed via coupon
    await userProgressRef.update({
      paymentCompleted: true,
      finalTestUnlocked: true,
      paymentMethod: "coupon",
      couponCode: couponCode,
      name: fullName || null,
      lastUpdated: new Date().toISOString(),
    })

    return NextResponse.json({
      valid: true,
      message: "Coupon applied successfully",
    })
  } catch (error) {
    console.error("Error verifying coupon:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to verify coupon"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

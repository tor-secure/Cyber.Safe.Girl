import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, paymentCompleted, paymentMethod, couponCode, discountPercentage } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Get user progress
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    const userProgressSnap = await userProgressRef.get()

    if (!userProgressSnap.exists) {
      return NextResponse.json({ error: "User progress not found" }, { status: 404 })
    }

    // Update user progress
    const updateData: Record<string, any> = {
      lastUpdated: new Date().toISOString(),
    }

    if (paymentCompleted !== undefined) {
      updateData.paymentCompleted = paymentCompleted
      updateData.finalTestUnlocked = paymentCompleted
    }

    if (fullName) {
      updateData.name = fullName
    }
    
    // Add payment method and coupon information if provided
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }
    
    if (couponCode) {
      updateData.couponCode = couponCode
    }
    
    if (discountPercentage !== undefined) {
      updateData.discountPercentage = discountPercentage
    }

    await userProgressRef.update(updateData)

    return NextResponse.json({
      success: true,
      message: "User progress updated successfully",
    })
  } catch (error) {
    console.error("Error updating user progress payment status:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update user progress"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// This would be replaced with actual Razorpay verification in production
const verifyRazorpayPayment = (orderId: string, paymentId: string, signature: string) => {
  // In a real implementation, you would verify the signature using Razorpay's method
  // For now, we'll simulate a successful verification
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orderId, paymentId, signature, fullName } = await request.json()

    if (!userId || !orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          error: "User ID, order ID, payment ID, and signature are required",
        },
        { status: 400 },
      )
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Verify payment signature
    const isVerified = verifyRazorpayPayment(orderId, paymentId, signature)

    if (!isVerified) {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment signature verification failed",
        },
        { status: 400 },
      )
    }

    // Update order status in Firestore
    const orderRef = adminDb.collection("paymentOrders").doc(orderId)
    await orderRef.update({
      status: "paid",
      paymentId: paymentId,
      paidAt: new Date().toISOString(),
    })

    // Update user progress to mark payment as completed
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    await userProgressRef.update({
      paymentCompleted: true,
      finalTestUnlocked: true,
      name: fullName || null,
      lastUpdated: new Date().toISOString(),
    })

    return NextResponse.json({
      verified: true,
      message: "Payment verified successfully",
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to verify payment"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { adminDb, FieldValue } from "@/lib/firebase-admin"

// This would be replaced with actual Razorpay verification in production
const verifyRazorpayPayment = (orderId: string, paymentId: string, signature: string) => {
  // In a real implementation, you would verify the signature using Razorpay's method
  // For now, we'll simulate a successful verification
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orderId, paymentId, signature, fullName, couponCode, discountPercentage } = await request.json()

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

    // Get order details
    const orderRef = adminDb.collection("paymentOrders").doc(orderId)
    const orderDoc = await orderRef.get()
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        {
          verified: false,
          error: "Order not found",
        },
        { status: 404 },
      )
    }
    
    const orderData = orderDoc.data()
    
    // Update order status in Firestore
    await orderRef.update({
      status: "paid",
      paymentId: paymentId,
      paidAt: new Date().toISOString(),
    })
    
    // If a coupon was used, record it in coupon usage
    if (orderData?.couponCode) {
      try {
        // Get user email if available
        let userEmail = null
        try {
          const userRecord = await adminDb.collection("users").doc(userId).get()
          if (userRecord.exists) {
            userEmail = userRecord.data()?.email || null
          }
        } catch (err) {
          console.error("Error fetching user email:", err)
          // Continue without email
        }
        
        // Find the coupon
        const couponQuery = await adminDb.collection("coupons")
          .where("code", "==", orderData.couponCode)
          .limit(1)
          .get()
          
        if (!couponQuery.empty) {
          const couponDoc = couponQuery.docs[0]
          const couponId = couponDoc.id
          
          // Record coupon usage
          await adminDb.collection("couponUsage").add({
            couponId: couponId,
            couponCode: orderData.couponCode,
            userId: userId,
            userName: fullName || "Unknown User",
            userEmail: userEmail,
            usedAt: new Date().toISOString(),
            discountPercentage: orderData.discountPercentage || 0,
            paymentId: paymentId,
            orderId: orderId,
            amountPaid: orderData.amount
          })
          
          // Update coupon usage count
          await couponDoc.ref.update({
            usedCount: FieldValue.increment(1),
            lastUsedAt: new Date().toISOString()
          })
        }
      } catch (couponErr) {
        // Log error but don't fail the payment verification
        console.error("Error recording coupon usage:", couponErr)
      }
    }

    // Update user progress to mark payment as completed
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    await userProgressRef.update({
      paymentCompleted: true,
      finalTestUnlocked: true,
      name: fullName || null,
      lastUpdated: new Date().toISOString(),
      paymentMethod: orderData?.couponCode ? "coupon_partial" : "razorpay",
      couponCode: orderData?.couponCode || null,
      discountPercentage: orderData?.discountPercentage || 0
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

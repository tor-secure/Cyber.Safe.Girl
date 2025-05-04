import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import crypto from "crypto"

// This would be replaced with actual Razorpay SDK in production
const createRazorpayOrder = async (amount: number, currency: string) => {
  // In a real implementation, you would use the Razorpay SDK to create an order
  // For now, we'll simulate the response
  const orderId = "order_" + crypto.randomBytes(8).toString("hex")

  return {
    id: orderId,
    amount: amount,
    currency: currency,
    receipt: "receipt_" + Date.now(),
    status: "created",
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, currency, fullName, couponCode, discountPercentage } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!amount || !currency) {
      return NextResponse.json({ error: "Amount and currency are required" }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    
    // Validate amount if coupon is applied
    if (couponCode && discountPercentage) {
      const originalAmount = 499;
      const expectedDiscountedAmount = Math.max(1, Math.round(originalAmount - (originalAmount * discountPercentage / 100)));
      
      if (amount !== expectedDiscountedAmount) {
        console.warn(`Amount mismatch: expected ${expectedDiscountedAmount}, got ${amount}`);
        // We'll continue with the provided amount, but log the warning
      }
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Get user progress
    const userProgressRef = adminDb.collection("userProgress").doc(userId);
    const userProgressSnap = await userProgressRef.get();

    if (!userProgressSnap.exists) {
      return NextResponse.json({ error: "User progress not found" }, { status: 404 });
    }

    const progress = userProgressSnap.data();

    // Ensure progress is not undefined
    if (!progress) {
      return NextResponse.json({ error: "User progress is undefined" }, { status: 500 });
    }

    // Check if user has completed the last chapter
    const completedChapters = progress.completedChapters || [];
    const lastChapterId = "CH-070";

    if (!completedChapters.includes(lastChapterId)) {
      return NextResponse.json(
        {
          error: "You need to complete all chapters before making a payment",
        },
        { status: 403 }
      );
    }

    // Check if payment is already completed
    if (progress.paymentCompleted) {
      return NextResponse.json(
        {
          error: "Payment has already been completed",
        },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(amount, currency);

    // Store order details in Firestore
    const orderRef = adminDb.collection("paymentOrders").doc(order.id);
    await orderRef.set({
      orderId: order.id,
      userId: userId,
      amount: amount,
      currency: currency,
      status: "created",
      fullName: fullName,
      createdAt: new Date().toISOString(),
      couponCode: couponCode || null,
      discountPercentage: discountPercentage || 0,
      originalAmount: couponCode ? 499 : amount, // Store original amount if coupon was applied
    });

    // Update user progress with name if provided
    await userProgressRef.update({
      name: fullName,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

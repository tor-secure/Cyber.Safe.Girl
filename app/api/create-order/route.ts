import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import Razorpay from "razorpay"

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const createRazorpayOrder = async (amount: number, currency: string) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
      currency: currency,
      receipt: "receipt_" + Date.now(),
    }

    const order = await razorpay.orders.create(options)
    return order
  } catch (error) {
    console.error("Razorpay order creation failed:", error)
    throw new Error("Failed to create Razorpay order")
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Razorpay credentials are configured
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured");
      return NextResponse.json({ 
        error: "Payment gateway is not configured. Please contact support." 
      }, { status: 500 });
    }

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

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    
    // Validate amount if coupon is applied
    if (couponCode && discountPercentage) {
      const originalAmount = 999;
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
    console.log(`Creating Razorpay order for amount: ₹${amount}, currency: ${currency}`);
    const order = await createRazorpayOrder(amount, currency);
    console.log(`Razorpay order created successfully: ${order.id}`);

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
      originalAmount: couponCode ? 999 : amount, // Store original amount if coupon was applied
    });

    // Update user progress with name if provided
    await userProgressRef.update({
      name: fullName,
      lastUpdated: new Date().toISOString(),
    });

    console.log(`Order stored in database successfully for user: ${userId}`);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to create order";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("Razorpay")) {
        errorMessage = "Payment gateway error. Please try again or contact support.";
      } else if (error.message.includes("Firebase") || error.message.includes("Database")) {
        errorMessage = "Database error. Please try again.";
      } else {
        errorMessage = error.message;
      }
      
      // Handle specific Razorpay errors
      if ((error as any).statusCode === 400) {
        statusCode = 400;
        errorMessage = "Invalid payment details. Please check and try again.";
      } else if ((error as any).statusCode === 401) {
        statusCode = 500;
        errorMessage = "Payment gateway configuration error. Please contact support.";
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

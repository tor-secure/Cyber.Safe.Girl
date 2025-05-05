"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentForm() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "coupon">("razorpay")
  const [couponCode, setCouponCode] = useState("")
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null)
  const [discountedAmount, setDiscountedAmount] = useState<number | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  // Check if user has completed all chapters
  useEffect(() => {
    async function checkUserProgress() {
      if (!user) {
        router.push("/login")
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch user progress
        const progressResponse = await fetch(`/api/user-progress?userId=${user.id}`)

        if (!progressResponse.ok) {
          throw new Error(`HTTP error! status: ${progressResponse.status}`)
        }

        const progressData = await progressResponse.json()
        setUserProgress(progressData.progress)

        // Check if user has already paid
        if (progressData.progress.paymentCompleted) {
          setPaymentCompleted(true)
        }

        // Check if user has completed all chapters
        const completedChapters = progressData.progress.completedChapters || []
        const lastChapterId = "CH-070"

        if (!completedChapters.includes(lastChapterId)) {
          setError("You need to complete all chapters before proceeding to payment.")
        }

        // Pre-fill name if available
        if (progressData.progress.name) {
          setFullName(progressData.progress.name)
        } else if (user.name) {
          setFullName(user.name)
        }
      } catch (err: any) {
        console.error("Failed to check user progress:", err)
        setError(err.message || "Failed to check your progress. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    checkUserProgress()
  }, [user, router])

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => {
          resolve(true)
        }
        script.onerror = () => {
          resolve(false)
        }
        document.body.appendChild(script)
      })
    }

    loadRazorpayScript()
  }, [])

  const validateName = () => {
    if (!fullName.trim()) {
      setNameError("Name is required")
      return false
    }

    if (fullName.trim().length < 3) {
      setNameError("Name must be at least 3 characters")
      return false
    }

    setNameError(null)
    return true
  }

  const handleCouponVerify = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setCouponError(null)
    setCouponSuccess(null)

    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    if (!validateName()) {
      return
    }

    setProcessingPayment(true)

    try {
      // Get user token if available
      let authHeader = {}
      if (user) {
        try {
          // Use Firebase Auth getIdToken if available
          // Firebase user type might not include getIdToken in the TypeScript definition
          // but it's available at runtime
          if (user && typeof (user as any).getIdToken === 'function') {
            const idToken = await (user as any).getIdToken()
            authHeader = {
              "Authorization": `Bearer ${idToken}`
            }
          }
        } catch (tokenError) {
          console.error("Error getting ID token:", tokenError)
          // Continue without the token
        }
      }
      
      // Verify coupon code
      const response = await fetch("/api/verify-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          userId: user.id,
          couponCode: couponCode.trim(),
          fullName: fullName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify coupon")
      }

      if (data.valid && data.coupon) {
        // Store the coupon data
        setAppliedCoupon(data.coupon)
        
        // Check if it's a 100% discount coupon
        if (data.coupon.discountPercentage === 100) {
          setCouponSuccess("Coupon applied successfully! You can now proceed to the final test.")
          setPaymentCompleted(true)

          // Update user progress to mark payment as completed
          await updateUserProgress()

          // Show success toast
          toast({
            title: "Payment Successful",
            description: "You can now proceed to the final test.",
            duration: 5000,
          })

          // Redirect to final test after a short delay
          setTimeout(() => {
            router.push("/final-test")
          }, 3000)
        } else {
          // Calculate discounted amount
          const originalAmount = 499;
          const discountPercentage = data.coupon.discountPercentage || 0;
          const discount = (originalAmount * discountPercentage) / 100;
          const finalAmount = Math.max(1, Math.round(originalAmount - discount)); // Ensure minimum 1 rupee
          
          setDiscountedAmount(finalAmount);
          setCouponSuccess(`Coupon applied successfully! You get ${discountPercentage}% discount.`);
          
          // Switch to payment tab
          setPaymentMethod("razorpay");
          
          // Show toast
          toast({
            title: "Coupon Applied",
            description: `You've received a ${discountPercentage}% discount!`,
            duration: 5000,
          });
        }
      } else {
        setCouponError(data.message || "Invalid coupon code. Only admin-generated coupons are accepted.")
      }
    } catch (err: any) {
      console.error("Coupon verification failed:", err)
      setCouponError(err.message || "Failed to verify coupon. Please try again.")
    } finally {
      setProcessingPayment(false)
    }
  }

  const handlePayment = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!validateName()) {
      return
    }

    setProcessingPayment(true)

    try {
      // Calculate the amount to charge
      const amount = discountedAmount || 499; // Use discounted amount if available
      
      // Create order on the server
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          amount: amount, // Use discounted amount if available
          currency: "INR",
          fullName: fullName.trim(),
          couponCode: appliedCoupon?.code || null,
          discountPercentage: appliedCoupon?.discountPercentage || 0
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Cyber Safe Girl",
        description: "Final Test Access Fee",
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment on the server
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.id,
                orderId: orderData.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                fullName: fullName.trim(),
                couponCode: appliedCoupon?.code || null,
                discountPercentage: appliedCoupon?.discountPercentage || 0
              }),
            })

            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || "Payment verification failed")
            }

            if (verifyData.verified) {
              setPaymentCompleted(true)

              // Update user progress to mark payment as completed
              await updateUserProgress()

              // Show success toast
              toast({
                title: "Payment Successful",
                description: "You can now proceed to the final test.",
                duration: 5000,
              })

              // Redirect to final test after a short delay
              setTimeout(() => {
                router.push("/final-test")
              }, 3000)
            } else {
              throw new Error("Payment could not be verified")
            }
          } catch (err: any) {
            console.error("Payment verification failed:", err)
            setError(err.message || "Payment verification failed. Please contact support.")
            setProcessingPayment(false)
          }
        },
        prefill: {
          name: fullName,
          email: user.email || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      console.error("Payment initialization failed:", err)
      setError(err.message || "Failed to initialize payment. Please try again.")
      setProcessingPayment(false)
    }
  }

  const updateUserProgress = async () => {
    try {
      // Update user progress to mark payment as completed
      const updateResponse = await fetch("/api/user-progress/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          fullName: fullName.trim(),
          paymentCompleted: true,
          paymentMethod: appliedCoupon ? (appliedCoupon.discountPercentage === 100 ? "coupon" : "coupon_partial") : "razorpay",
          couponCode: appliedCoupon?.code || null,
          discountPercentage: appliedCoupon?.discountPercentage || 0
        }),
      })

      if (!updateResponse.ok) {
        console.error("Failed to update payment status in user progress")
      }
    } catch (err) {
      console.error("Failed to update payment status:", err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Checking your progress...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center py-8">
              <Lock className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-6">
                You need to complete all chapters before proceeding to payment.
              </p>
              <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentCompleted) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Completed</CardTitle>
            <CardDescription>You have successfully paid for the final test</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800 mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your payment has been processed successfully. You can now proceed to the final test.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center py-4">
              <Button onClick={() => router.push("/final-test")} className="w-full">
                Go to Final Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Final Test Access</CardTitle>
          <CardDescription>Complete payment to unlock the final test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (as it will appear on your certificate)</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
              {nameError && <p className="text-sm text-red-500">{nameError}</p>}
            </div>

            <Tabs defaultValue="razorpay" onValueChange={(value) => setPaymentMethod(value as "razorpay" | "coupon")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="razorpay">Pay ₹499</TabsTrigger>
                <TabsTrigger value="coupon">Use Coupon</TabsTrigger>
              </TabsList>

              <TabsContent value="razorpay" className="space-y-4 pt-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Payment Details</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Secure payment via Razorpay. You will be redirected to the payment gateway.
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span>Final Test Access Fee</span>
                    <span className="font-medium">₹499</span>
                  </div>
                  
                  {appliedCoupon && appliedCoupon.discountPercentage < 100 && (
                    <div className="flex items-center justify-between mb-2 text-green-600">
                      <span>Coupon Discount ({appliedCoupon.discountPercentage}%)</span>
                      <span>-₹{Math.round((499 * appliedCoupon.discountPercentage) / 100)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                    <span>GST (18%)</span>
                    <span>Included</span>
                  </div>
                  <div className="flex items-center justify-between font-medium pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>₹{discountedAmount || 499}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="mt-2 pt-2 border-t text-sm text-green-600">
                      <span>Coupon "{appliedCoupon.code}" applied</span>
                    </div>
                  )}
                </div>

                <Button onClick={handlePayment} className="w-full" disabled={processingPayment}>
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="coupon" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="couponCode">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="couponCode"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                    />
                    <Button variant="outline" onClick={handleCouponVerify} disabled={processingPayment}>
                      {processingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                  {couponError && <p className="text-sm text-red-500">{couponError}</p>}
                  {couponSuccess && <p className="text-sm text-green-600">{couponSuccess}</p>}
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">How to get a coupon?</h3>
                  <p className="text-sm text-muted-foreground">
                    Coupons are available through our partners or special promotions. Contact your institution if you
                    were provided with a coupon code.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

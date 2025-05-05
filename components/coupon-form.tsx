"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

interface CouponFormProps {
  onCouponApplied?: (couponData: any) => void
  className?: string
}

export default function CouponForm({ onCouponApplied, className = "" }: CouponFormProps) {
  const { user } = useAuth()
  const [couponCode, setCouponCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!couponCode.trim()) {
      setError("Please enter a coupon code")
      return
    }
    
    if (!user) {
      setError("You must be logged in to apply a coupon")
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Check if user has getIdToken method
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
      
      const response = await fetch("/api/verify-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          userId: user.id,
          couponCode: couponCode.trim(),
          fullName: user.name || "Unknown User"
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (data.valid) {
          // Check if it's a 100% discount or partial discount
          if (data.coupon.discountPercentage === 100) {
            setSuccess("Coupon applied successfully! 100% discount granted.")
          } else {
            setSuccess(`Coupon applied successfully! ${data.coupon.discountPercentage}% discount granted.`)
          }
          
          setAppliedCoupon(data.coupon)
          setCouponCode("")
          
          if (onCouponApplied) {
            onCouponApplied(data.coupon)
          }
        } else {
          setError(data.message || "Invalid coupon code. Only admin-generated coupons are accepted.")
        }
      } else {
        setError(data.error || "Failed to verify coupon")
      }
    } catch (err: any) {
      console.error("Error applying coupon:", err)
      setError(err.message || "Failed to apply coupon")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className || "w-full max-w-md mx-auto"}>
      <form onSubmit={handleApplyCoupon} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="couponCode">Coupon Code</Label>
          <div className="flex space-x-2">
            <Input
              id="couponCode"
              placeholder="Enter your coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1"
              disabled={loading || !!appliedCoupon}
            />
            <Button type="submit" disabled={loading || !couponCode || !!appliedCoupon}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>
        
        {appliedCoupon && (
          <div className="mt-2 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Applied Coupon: {appliedCoupon.code}</p>
            <p className="text-sm text-muted-foreground">
              Discount: {appliedCoupon.discountPercentage}%
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, CheckCircle, Copy, Loader2, Plus, RefreshCw, Trash } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { format } from "date-fns"

type Coupon = {
  id: string
  code: string
  discountPercentage: number
  maxUses: number
  usedCount: number
  createdAt: string
  expiresAt: string | null
  createdBy: string
}

type CouponUsage = {
  id: string
  couponId: string
  couponCode: string
  userId: string
  userName: string
  userEmail: string | null
  usedAt: string
  discountPercentage: number
}

export default function CouponsPage() {
  const { user, idToken } = useAdminAuth()
  const [authLoading, setAuthLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponUsage, setCouponUsage] = useState<CouponUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCouponCode, setNewCouponCode] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState(100)
  const [maxUses, setMaxUses] = useState(1)
  const [expiryDate, setExpiryDate] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active")

  useEffect(() => {
    // Check if user is available
    if (user) {
      setAuthLoading(false)
      fetchCoupons()
      fetchCouponUsage()
    } else if (user === null) {
      // User is definitely not authenticated
      setAuthLoading(false)
      window.location.href = "/admin/login"
    }
    // If user is undefined, we're still loading
  }, [user])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!idToken) {
        throw new Error("Authentication token not available")
      }

      const response = await fetch("/api/admin/coupons", {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch coupons: ${response.status}`)
      }

      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (err: any) {
      console.error("Error fetching coupons:", err)
      setError(err.message || "Failed to load coupons")
    } finally {
      setLoading(false)
    }
  }

  const fetchCouponUsage = async () => {
    try {
      if (!idToken) {
        throw new Error("Authentication token not available")
      }

      const response = await fetch("/api/admin/coupon-usage", {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch coupon usage: ${response.status}`)
      }

      const data = await response.json()
      setCouponUsage(data.couponUsage || [])
    } catch (err: any) {
      console.error("Error fetching coupon usage:", err)
      // We don't set the main error here to avoid blocking the UI
    }
  }

  const handleCreateCoupon = async () => {
    try {
      setCreateLoading(true)
      setCreateError(null)
      setCreateSuccess(null)

      if (!newCouponCode) {
        throw new Error("Coupon code is required")
      }

      if (!idToken) {
        throw new Error("Authentication token not available")
      }

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          code: newCouponCode,
          discountPercentage,
          maxUses,
          expiresAt: expiryDate ? new Date(expiryDate).toISOString() : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create coupon")
      }

      const data = await response.json()
      
      // Reset form
      setNewCouponCode("")
      setDiscountPercentage(100)
      setMaxUses(1)
      setExpiryDate("")
      
      setCreateSuccess("Coupon created successfully!")
      
      // Refresh coupons list
      fetchCoupons()
    } catch (err: any) {
      console.error("Error creating coupon:", err)
      setCreateError(err.message || "Failed to create coupon")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return
    }

    try {
      setLoading(true)

      if (!idToken) {
        throw new Error("Authentication token not available")
      }

      const response = await fetch(`/api/admin/coupons?id=${couponId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to delete coupon")
      }

      // Refresh coupons list
      fetchCoupons()
    } catch (err: any) {
      console.error("Error deleting coupon:", err)
      setError(err.message || "Failed to delete coupon")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => alert("Coupon code copied to clipboard!"))
      .catch(err => console.error("Failed to copy coupon code:", err))
  }

  const generateRandomCode = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar looking characters
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setNewCouponCode(result)
  }
  
  // Wrapper function for the button click event
  const handleGenerateRandomCode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    generateRandomCode()
  }
  
  const handleGenerateMultipleCoupons = async (count: number) => {
    try {
      setLoading(true)
      setError(null)

      if (!idToken) {
        throw new Error("Authentication token not available")
      }
      
      // Generate multiple coupons
      const response = await fetch("/api/admin/coupons/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          count: count || 1,
          discountPercentage: 100, // Always 100% for one-time coupons
          maxUses: 1, // Always one-time use
          prefix: "CSG"
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate coupons")
      }

      const data = await response.json()
      
      alert(`${data.coupons.length} coupons generated successfully!`)
      
      // Refresh coupons list
      fetchCoupons()
    } catch (err: any) {
      console.error("Error generating multiple coupons:", err)
      setError(err.message || "Failed to generate coupons")
    } finally {
      setLoading(false)
    }
  }
  
  const handleGenerateOneTimeCoupon = async () => {
    try {
      setCreateLoading(true)
      setCreateError(null)
      setCreateSuccess(null)

      if (!idToken) {
        throw new Error("Authentication token not available")
      }
      
      // Generate a random code
      const code = `CSG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          code,
          discountPercentage: 100, // 100% discount
          maxUses: 1, // One-time use
          expiresAt: null // Never expires
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create coupon")
      }

      const data = await response.json()
      setCreateSuccess(`One-time coupon created: ${code}`)
      
      // Refresh coupons list
      fetchCoupons()
    } catch (err: any) {
      console.error("Error creating one-time coupon:", err)
      setCreateError(err.message || "Failed to create one-time coupon")
    } finally {
      setCreateLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null // Redirect handled in useEffect
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateOneTimeCoupon} 
            disabled={createLoading}
          >
            {createLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate One-Time Coupon
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleGenerateMultipleCoupons(5)} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate 5 Coupons
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Coupon
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {createSuccess && !showCreateDialog && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">{createSuccess}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Coupons</TabsTrigger>
          <TabsTrigger value="usage">Coupon Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={fetchCoupons} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No coupons found
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {coupon.code}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyCouponCode(coupon.code)}
                              className="h-6 w-6"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{coupon.discountPercentage}%</TableCell>
                        <TableCell>
                          {coupon.usedCount} / {coupon.maxUses === 0 ? "∞" : coupon.maxUses}
                        </TableCell>
                        <TableCell>
                          {format(new Date(coupon.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {coupon.expiresAt
                            ? format(new Date(coupon.expiresAt), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={fetchCouponUsage} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon Code</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Used On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : couponUsage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No coupon usage found
                      </TableCell>
                    </TableRow>
                  ) : (
                    couponUsage.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell className="font-medium">{usage.couponCode}</TableCell>
                        <TableCell>{usage.userName || usage.userId}</TableCell>
                        <TableCell>{usage.userEmail || "Not available"}</TableCell>
                        <TableCell>{usage.discountPercentage}%</TableCell>
                        <TableCell>
                          {format(new Date(usage.usedAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Coupon Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Generate a new coupon code that users can redeem to access the final test.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {createError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            
            {createSuccess && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">{createSuccess}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="couponCode"
                  placeholder="Enter coupon code"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleGenerateRandomCode} type="button">
                  Generate
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="1"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxUses">Maximum Uses (0 for unlimited)</Label>
              <Input
                id="maxUses"
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon} disabled={createLoading || !newCouponCode}>
              {createLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Coupon"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
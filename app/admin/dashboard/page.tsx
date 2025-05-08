"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/lib/admin-auth"
import { useAuth } from "@/lib/auth-context"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertTriangle, CheckCircle, LogOut, Share2, Mail, Copy, Check, ArrowLeft } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function AdminDashboardPage() {
  const { isAdmin, isLoading: adminLoading, idToken } = useAdminAuth()
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("generate")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<any[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState(100)
  const [maxUses, setMaxUses] = useState(1)
  const [expiryDays, setExpiryDays] = useState(30)
  const [generatingMultiple, setGeneratingMultiple] = useState(false)
  const [numberOfCoupons, setNumberOfCoupons] = useState(5)
  const [prefix, setPrefix] = useState("CSG")
  const [copySuccess, setCopySuccess] = useState<string>("")
  const [generatedCoupons, setGeneratedCoupons] = useState<any[]>([])
  const [showShareDialog, setShowShareDialog] = useState(false)

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/admin/login")
    } else if (!adminLoading && isAdmin && idToken) {
      fetchCoupons()
    }
  }, [adminLoading, isAdmin, idToken, router])

  const fetchCoupons = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to get token from multiple sources
      const token = idToken || localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      
      if (!token) {
        console.warn("Authentication token not available, skipping fetch")
        setLoading(false)
        return
      }
      
      const response = await fetch("/api/admin/coupons", {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-firebase-auth-token': token // Add custom header as fallback
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (err: any) {
      console.error("Failed to fetch coupons:", err)
      setError(err.message || "Failed to fetch coupons")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Get token from multiple sources
      let token = idToken;
      
      // If no token in context, try localStorage and sessionStorage
      if (!token) {
        token = localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      }
      
      // If still no token, try to get a fresh one from Firebase
      if (!token && auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken(true);
          if (token) {
            localStorage.setItem('firebase-auth-token', token);
            sessionStorage.setItem('firebase-auth-token', token);
          }
        } catch (tokenError) {
          console.error("Error getting fresh token:", tokenError);
        }
      }
      
      if (!token) {
        setError("Authentication token not available. Please refresh the page or log in again.");
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch("/api/admin/generate-coupon", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-firebase-auth-token": token // Add custom header as fallback
          },
          body: JSON.stringify({
            code: couponCode,
            discountPercentage,
            maxUses,
            expiryDays,
          }),
        })

        const responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(responseData.error || "Failed to generate coupon")
        }
        
        // Create a coupon object with the necessary properties
        const generatedCoupon = {
          code: couponCode,
          discountPercentage: discountPercentage,
          maxUses: maxUses,
          expiryDays: expiryDays
        };
        
        // Show toast with share options
        toast({
          title: "Coupon Generated",
          description: `Code: ${couponCode}`,
          action: (
            <div className="flex space-x-2">
              <ToastAction 
                altText="WhatsApp" 
                onClick={() => handleShareCoupon(generatedCoupon, 'whatsapp')}
              >
                <Share2 className="h-4 w-4 mr-1" /> WhatsApp
              </ToastAction>
              <ToastAction 
                altText="Email" 
                onClick={() => handleShareCoupon(generatedCoupon, 'email')}
              >
                <Mail className="h-4 w-4 mr-1" /> Email
              </ToastAction>
              <ToastAction 
                altText="Copy" 
                onClick={() => handleShareCoupon(generatedCoupon, 'copy')}
              >
                {copySuccess === couponCode ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copy
              </ToastAction>
            </div>
          ),
        })
        
        setSuccess(`Coupon generated successfully: ${couponCode}`)
        setCouponCode("")
        fetchCoupons()
      } catch (innerErr: any) {
        console.error("Failed to generate coupon:", innerErr)
        setError(innerErr.message || "Failed to generate coupon")
      }
    } catch (err: any) {
      console.error("Failed to generate coupon:", err)
      setError(err.message || "Failed to generate coupon")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMultipleCoupons = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Get token from multiple sources
      let token = idToken;
      
      // If no token in context, try localStorage and sessionStorage
      if (!token) {
        token = localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      }
      
      // If still no token, try to get a fresh one from Firebase
      if (!token && auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken(true);
          if (token) {
            localStorage.setItem('firebase-auth-token', token);
            sessionStorage.setItem('firebase-auth-token', token);
          }
        } catch (tokenError) {
          console.error("Error getting fresh token:", tokenError);
        }
      }
      
      if (!token) {
        setError("Authentication token not available. Please refresh the page or log in again.");
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch("/api/admin/generate-multiple-coupons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-firebase-auth-token": token // Add custom header as fallback
          },
          body: JSON.stringify({
            count: numberOfCoupons,
            prefix,
            discountPercentage,
            maxUses,
            expiryDays,
          }),
        })

        const responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(responseData.error || "Failed to generate coupons")
        }
        
        // Create coupon objects with the necessary properties
        const generatedCouponsList = Array.from({ length: numberOfCoupons }, (_, i) => ({
          code: `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          discountPercentage: discountPercentage,
          maxUses: maxUses,
          expiryDays: expiryDays
        }));
        
        // Store generated coupons for sharing
        setGeneratedCoupons(generatedCouponsList);
        
        // Show share dialog
        setShowShareDialog(true);
        
        setSuccess(`${numberOfCoupons} coupons generated successfully`)
        fetchCoupons()
      } catch (innerErr: any) {
        console.error("Failed to generate coupons:", innerErr)
        setError(innerErr.message || "Failed to generate coupons")
      }
    } catch (err: any) {
      console.error("Failed to generate coupons:", err)
      setError(err.message || "Failed to generate coupons")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/admin/login")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }
  
  const handleShareCoupon = (coupon: any, method: string) => {
    const couponText = `Coupon Code: ${coupon.code}\nDiscount: ${coupon.discountPercentage}%\n${coupon.maxUses === 1 ? 'One-time use only' : `Can be used ${coupon.maxUses} times`}${coupon.expiryDays ? `\nExpires in: ${coupon.expiryDays} days` : ''}`
    
    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(couponText)}`, '_blank')
        break
      case 'email':
        window.open(`mailto:?subject=Your Discount Coupon&body=${encodeURIComponent(couponText)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(couponText)
          .then(() => {
            setCopySuccess(typeof coupon === 'string' ? coupon : coupon.code);
            setTimeout(() => setCopySuccess(""), 2000);
          })
          .catch(err => console.error("Failed to copy coupon details:", err))
        break
      default:
        break
    }
  }
  
  const handleShareMultipleCoupons = (method: string) => {
    if (generatedCoupons.length === 0) return
    
    const couponsText = generatedCoupons.map(coupon => 
      `Coupon Code: ${coupon.code}\nDiscount: ${coupon.discountPercentage}%\n${coupon.maxUses === 1 ? 'One-time use only' : `Can be used ${coupon.maxUses} times`}${coupon.expiryDays ? `\nExpires in: ${coupon.expiryDays} days` : ''}`
    ).join('\n\n---\n\n')
    
    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(couponsText)}`, '_blank')
        break
      case 'email':
        window.open(`mailto:?subject=Your Discount Coupons&body=${encodeURIComponent(couponsText)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(couponsText)
          .then(() => {
            setSuccess("Coupons copied to clipboard!");
            setTimeout(() => setSuccess(null), 2000);
          })
          .catch(err => console.error("Failed to copy coupon details:", err))
        break
      default:
        break
    }
    
    setShowShareDialog(false)
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Debug function
  const debugAuth = async () => {
    try {
      if (!idToken) {
        alert("Not authenticated")
        return
      }
      
      const response = await fetch("/api/admin/debug-auth", {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'x-firebase-auth-token': idToken
        }
      })
      
      const data = await response.json()
      console.log("Auth Debug Info:", data)
      alert("Auth debug info logged to console")
    } catch (error) {
      console.error("Debug error:", error)
      alert("Error debugging auth. Check console.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-wrap items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debugAuth} 
              className="hidden sm:inline-flex text-xs sm:text-sm h-8 sm:h-9"
            >
              Debug Auth
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/admin/coupons")}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <span className="whitespace-nowrap">Coupon Management</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
              {user?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Coupons</TabsTrigger>
          <TabsTrigger value="manage">Manage Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Generate Coupon</CardTitle>
              <CardDescription className="text-sm sm:text-base">Create new coupon codes for users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Single Coupon</TabsTrigger>
                  <TabsTrigger value="multiple">Multiple Coupons</TabsTrigger>
                </TabsList>
                
                <TabsContent value="single">
                  <form onSubmit={handleGenerateCoupon} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="couponCode">Coupon Code</Label>
                      <Input
                        id="couponCode"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code (e.g., CSG100)"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="discountPercentage">Discount Percentage</Label>
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="1"
                        max="100"
                        value={discountPercentage}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 100 : parseInt(e.target.value);
                          setDiscountPercentage(isNaN(value) ? 100 : value);
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxUses">Maximum Uses</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                          setMaxUses(isNaN(value) ? 1 : value);
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expiryDays">Expiry (Days)</Label>
                      <Input
                        id="expiryDays"
                        type="number"
                        min="1"
                        value={expiryDays}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 30 : parseInt(e.target.value);
                          setExpiryDays(isNaN(value) ? 30 : value);
                        }}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Coupon"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="multiple">
                  <form onSubmit={handleGenerateMultipleCoupons} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="numberOfCoupons">Number of Coupons</Label>
                      <Input
                        id="numberOfCoupons"
                        type="number"
                        min="1"
                        max="100"
                        value={numberOfCoupons}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 5 : parseInt(e.target.value);
                          setNumberOfCoupons(isNaN(value) ? 5 : value);
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Coupon Prefix</Label>
                      <Input
                        id="prefix"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="Enter prefix (e.g., CSG)"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="discountPercentageMultiple">Discount Percentage</Label>
                      <Input
                        id="discountPercentageMultiple"
                        type="number"
                        min="1"
                        max="100"
                        value={discountPercentage}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 100 : parseInt(e.target.value);
                          setDiscountPercentage(isNaN(value) ? 100 : value);
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxUsesMultiple">Maximum Uses Per Coupon</Label>
                      <Input
                        id="maxUsesMultiple"
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                          setMaxUses(isNaN(value) ? 1 : value);
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expiryDaysMultiple">Expiry (Days)</Label>
                      <Input
                        id="expiryDaysMultiple"
                        type="number"
                        min="1"
                        value={expiryDays}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 30 : parseInt(e.target.value);
                          setExpiryDays(isNaN(value) ? 30 : value);
                        }}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Multiple Coupons"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Manage Coupons</CardTitle>
              <CardDescription className="text-sm sm:text-base">View and manage existing coupon codes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 sm:h-8 w-6 sm:w-8 animate-spin text-primary" />
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No coupons found. Generate some coupons first.
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Uses</TableHead>
                        <TableHead>Max Uses</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => {
                        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                        const isFullyUsed = coupon.maxUses && coupon.usedCount >= coupon.maxUses
                        const status = isExpired ? "Expired" : isFullyUsed ? "Fully Used" : "Active"
                        
                        return (
                          <TableRow key={coupon.id}>
                            <TableCell className="font-medium">{coupon.code}</TableCell>
                            <TableCell>{coupon.discountPercentage}%</TableCell>
                            <TableCell>{coupon.usedCount || 0}</TableCell>
                            <TableCell>{coupon.maxUses || "∞"}</TableCell>
                            <TableCell>
                              {coupon.expiresAt
                                ? new Date(coupon.expiresAt).toLocaleDateString()
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  status === "Active"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : status === "Expired"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                }`}
                              >
                                {status}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Share Dialog for Multiple Coupons */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Generated Coupons</DialogTitle>
            <DialogDescription>
              Choose how you want to share the {generatedCoupons.length} generated coupons.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 py-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => handleShareMultipleCoupons('whatsapp')}
            >
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share via WhatsApp</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => handleShareMultipleCoupons('email')}
            >
              <Mail className="mr-2 h-4 w-4" />
              <span>Share via Email</span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => handleShareMultipleCoupons('copy')}
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy to Clipboard</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowShareDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
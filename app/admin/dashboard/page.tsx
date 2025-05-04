"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/lib/admin-auth"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertTriangle, CheckCircle, LogOut } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminDashboardPage() {
  const { isAdmin, isLoading: adminLoading, idToken } = useAdminAuth()
  const { user, logout } = useAuth()
  const router = useRouter()

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
      if (!idToken) {
        throw new Error("Not authenticated")
      }
      
      const response = await fetch("/api/admin/coupons", {
        headers: {
          Authorization: `Bearer ${idToken}`
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
      if (!idToken) {
        throw new Error("Not authenticated")
      }
      
      const response = await fetch("/api/admin/generate-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          code: couponCode,
          discountPercentage,
          maxUses,
          expiryDays,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate coupon")
      }

      const data = await response.json()
      setSuccess(`Coupon generated successfully: ${data.coupon.code}`)
      setCouponCode("")
      fetchCoupons()
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
      if (!idToken) {
        throw new Error("Not authenticated")
      }
      
      const response = await fetch("/api/admin/generate-multiple-coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          count: numberOfCoupons,
          prefix,
          discountPercentage,
          maxUses,
          expiryDays,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate coupons")
      }

      const data = await response.json()
      setSuccess(`${data.coupons.length} coupons generated successfully`)
      fetchCoupons()
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

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/coupons")}>
            Coupon Management
          </Button>
          <span className="text-sm text-muted-foreground">
            Logged in as: {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
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
              <CardTitle>Generate Coupon</CardTitle>
              <CardDescription>Create new coupon codes for users</CardDescription>
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
              <CardTitle>Manage Coupons</CardTitle>
              <CardDescription>View and manage existing coupon codes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No coupons found. Generate some coupons first.
                </div>
              ) : (
                <div className="rounded-md border">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
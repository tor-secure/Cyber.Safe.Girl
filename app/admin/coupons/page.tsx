"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Trash,
  Share2,
  Mail,
  Check,
  ArrowLeft,
} from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

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
  const { toast } = useToast()
  const router = useRouter()
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
  const [selectedCoupons, setSelectedCoupons] = useState<Coupon[]>([])
  const [showBulkShareDialog, setShowBulkShareDialog] = useState(false)
  const [generatedCoupons, setGeneratedCoupons] = useState<Coupon[]>([])
  const [copySuccess, setCopySuccess] = useState<string>("")

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

      // Try to get token from multiple sources
      const token = idToken || localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      
      if (!token) {
        // Instead of throwing an error, just log a warning and return
        console.warn("Authentication token not available, skipping fetch")
        setLoading(false)
        return
      }

      const response = await fetch("/api/admin/coupons", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-firebase-auth-token": token, // Add custom header as fallback
        },
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
      // Try to get token from multiple sources
      const token = idToken || localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      
      if (!token) {
        // Instead of throwing an error, just log a warning and return
        console.warn("Authentication token not available, skipping fetch")
        return
      }

      const response = await fetch("/api/admin/coupon-usage", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-firebase-auth-token": token,
        },
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
        setCreateError("Coupon code is required");
        setCreateLoading(false);
        return;
      }

      // Try to get token from multiple sources
      const token = idToken || localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      
      if (!token) {
        setCreateError("Authentication token not available. Please refresh the page or log in again.");
        setCreateLoading(false);
        return;
      }

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-firebase-auth-token": token,
        },
        body: JSON.stringify({
          code: newCouponCode,
          discountPercentage,
          maxUses,
          expiresAt: expiryDate ? new Date(expiryDate).toISOString() : null,
        }),
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

      // Try to get token from multiple sources
      const token = idToken || localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      
      if (!token) {
        setError("Authentication token not available. Please refresh the page or log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/coupons?id=${couponId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-firebase-auth-token": token,
        },
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
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopySuccess(code)
        setTimeout(() => setCopySuccess(""), 2000)
      })
      .catch((err) => console.error("Failed to copy coupon code:", err))
  }

  const handleShareCoupon = (coupon: Coupon, method: string) => {
    const couponText = `Coupon Code: ${coupon.code}\nDiscount: ${coupon.discountPercentage}%\n${coupon.maxUses === 1 ? "One-time use only" : `Can be used ${coupon.maxUses} times`}${coupon.expiresAt ? `\nExpires: ${format(new Date(coupon.expiresAt), "MMM d, yyyy")}` : ""}`

    switch (method) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(couponText)}`, "_blank")
        break
      case "email":
        window.open(`mailto:?subject=Your Discount Coupon&body=${encodeURIComponent(couponText)}`, "_blank")
        break
      case "copy":
        navigator.clipboard
          .writeText(couponText)
          .then(() => {
            setCopySuccess(coupon.code)
            setTimeout(() => setCopySuccess(""), 2000)
          })
          .catch((err) => console.error("Failed to copy coupon details:", err))
        break
      default:
        break
    }
  }

  const toggleCouponSelection = (coupon: Coupon) => {
    setSelectedCoupons((prev) => {
      const isSelected = prev.some((c) => c.id === coupon.id)
      if (isSelected) {
        return prev.filter((c) => c.id !== coupon.id)
      } else {
        return [...prev, coupon]
      }
    })
  }

  const handleBulkShare = (method: string) => {
    if (selectedCoupons.length === 0) return

    const couponsText = selectedCoupons
      .map(
        (coupon) =>
          `Coupon Code: ${coupon.code}\nDiscount: ${coupon.discountPercentage}%\n${coupon.maxUses === 1 ? "One-time use only" : `Can be used ${coupon.maxUses} times`}${coupon.expiresAt ? `\nExpires: ${format(new Date(coupon.expiresAt), "MMM d, yyyy")}` : ""}`,
      )
      .join("\n\n---\n\n")

    switch (method) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(couponsText)}`, "_blank")
        break
      case "email":
        window.open(`mailto:?subject=Your Discount Coupons&body=${encodeURIComponent(couponsText)}`, "_blank")
        break
      case "copy":
        navigator.clipboard
          .writeText(couponsText)
          .then(() => {
            setCreateSuccess("Coupons copied to clipboard!")
            setTimeout(() => setCreateSuccess(null), 2000)
          })
          .catch((err) => console.error("Failed to copy coupon details:", err))
        break
      default:
        break
    }

    setShowBulkShareDialog(false)
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

      // Try to get token from multiple sources
      const token = idToken || localStorage.getItem('firebase-auth-token') || sessionStorage.getItem('firebase-auth-token');
      
      if (!token) {
        setError("Authentication token not available. Please refresh the page or log in again.");
        setLoading(false);
        return;
      }

      // Generate multiple coupons
      const response = await fetch("/api/admin/coupons/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-firebase-auth-token": token,
        },
        body: JSON.stringify({
          count: count || 1,
          discountPercentage: 100, // Always 100% for one-time coupons
          maxUses: 1, // Always one-time use
          prefix: "CSG",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate coupons")
      }

      const data = await response.json()

      // Store generated coupons for sharing
      const newCoupons = data.coupons.map((coupon: any) => ({
        id: coupon.id,
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        maxUses: coupon.maxUses,
        usedCount: 0,
        createdAt: coupon.createdAt,
        expiresAt: coupon.expiresAt,
        createdBy: coupon.createdBy,
      }))

      // Show dialog for sharing multiple coupons
      setSelectedCoupons(newCoupons)
      setShowBulkShareDialog(true)

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
        setCreateError("Authentication token not available. Please refresh the page or log in again.");
        setCreateLoading(false);
        return;
      }

      // Generate a random code
      const code = `CSG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-firebase-auth-token": token,
        },
        body: JSON.stringify({
          code,
          discountPercentage: 100, // 100% discount
          maxUses: 1, // One-time use
          expiresAt: null, // Never expires
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create coupon")
      }

      const data = await response.json()

      // Show toast with share options
      toast({
        title: "Coupon Generated",
        description: `Code: ${code}`,
        action: (
          <div className="flex space-x-2">
            <ToastAction
              altText="WhatsApp"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(`Coupon Code: ${code}\nDiscount: 100%\nOne-time use only`)}`,
                  "_blank",
                )
              }
            >
              <Share2 className="h-4 w-4 mr-1" /> WhatsApp
            </ToastAction>
            <ToastAction
              altText="Email"
              onClick={() =>
                window.open(
                  `mailto:?subject=Your Discount Coupon&body=${encodeURIComponent(`Coupon Code: ${code}\nDiscount: 100%\nOne-time use only`)}`,
                  "_blank",
                )
              }
            >
              <Mail className="h-4 w-4 mr-1" /> Email
            </ToastAction>
            <ToastAction
              altText="Copy"
              onClick={() => {
                navigator.clipboard.writeText(`Coupon Code: ${code}\nDiscount: 100%\nOne-time use only`).then(() => {
                  setCopySuccess(code)
                  setTimeout(() => setCopySuccess(""), 2000)
                })
              }}
            >
              {copySuccess === code ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copy
            </ToastAction>
          </div>
        ),
      })

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
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/dashboard")}
          className="text-xs sm:text-sm h-8 sm:h-10 mr-2"
          size="sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="whitespace-nowrap">Back to Dashboard</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <div className="flex flex-wrap items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant="outline"
            onClick={handleGenerateOneTimeCoupon}
            disabled={createLoading}
            className="text-xs sm:text-sm h-8 sm:h-10"
            size="sm"
          >
            {createLoading ? (
              <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="whitespace-nowrap">One-Time Coupon</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleGenerateMultipleCoupons(5)}
            disabled={loading}
            className="text-xs sm:text-sm h-8 sm:h-10"
            size="sm"
          >
            {loading ? (
              <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="whitespace-nowrap">5 Coupons</span>
          </Button>

          <Button onClick={() => setShowCreateDialog(true)} className="text-xs sm:text-sm h-8 sm:h-10" size="sm">
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">Custom Coupon</span>
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
          <div className="flex justify-between items-center">
            <div>
              {selectedCoupons.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkShareDialog(true)}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                  size="sm"
                >
                  <Share2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap">Share {selectedCoupons.length}</span>
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={fetchCoupons}
              disabled={loading}
              className="text-xs sm:text-sm h-8 sm:h-10"
              size="sm"
            >
              <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="whitespace-nowrap">Refresh</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={selectedCoupons.length > 0 && selectedCoupons.length === coupons.length}
                            placeholder="coupon"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCoupons(coupons)
                              } else {
                                setSelectedCoupons([])
                              }
                            }}
                          />
                        </div>
                      </TableHead>
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
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : coupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No coupons found
                        </TableCell>
                      </TableRow>
                    ) : (
                      coupons.map((coupon) => (
                        <TableRow
                          key={coupon.id}
                          className={selectedCoupons.some((c) => c.id === coupon.id) ? "bg-muted/40" : ""}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={selectedCoupons.some((c) => c.id === coupon.id)}
                              placeholder="coupon"
                              onChange={() => toggleCouponSelection(coupon)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {coupon.code}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyCouponCode(coupon.code)}
                                className="h-6 w-6"
                              >
                                {copySuccess === coupon.code ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{coupon.discountPercentage}%</TableCell>
                          <TableCell>
                            {coupon.usedCount} / {coupon.maxUses === 0 ? "∞" : coupon.maxUses}
                          </TableCell>
                          <TableCell>{format(new Date(coupon.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {coupon.expiresAt ? format(new Date(coupon.expiresAt), "MMM d, yyyy") : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <Share2 className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Share Coupon</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleShareCoupon(coupon, "whatsapp")}>
                                          <svg
                                            className="h-4 w-4 mr-2"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.88 11.94L4 20l4.2-1.1a7.93 7.93 0 0 0 3.8.96h.01a7.95 7.95 0 0 0 7.94-7.93 7.88 7.88 0 0 0-2.35-5.61zm-5.55 12.18h-.01a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.65.67-2.43-.16-.25a6.6 6.6 0 0 1-1.01-3.49 6.59 6.59 0 0 1 6.6-6.59 6.58 6.58 0 0 1 4.68 1.94 6.54 6.54 0 0 1 1.93 4.66 6.6 6.6 0 0 1-6.6 6.57zm3.62-4.93c-.2-.1-1.17-.58-1.35-.64-.18-.07-.32-.1-.45.1-.13.2-.5.64-.62.77-.11.13-.23.15-.43.05a5.44 5.44 0 0 1-2.7-2.35c-.2-.35.2-.33.58-1.1a.37.37 0 0 0-.02-.35c-.05-.1-.45-1.08-.62-1.47-.16-.39-.32-.33-.45-.34h-.38c-.13 0-.35.05-.53.25-.18.2-.7.69-.7 1.67 0 .99.72 1.94.82 2.08.1.13 1.4 2.13 3.39 2.99.47.2.84.33 1.13.42.48.15.91.13 1.25.08.38-.06 1.17-.48 1.33-.94.17-.46.17-.86.12-.94-.05-.08-.18-.13-.38-.23z" />
                                          </svg>
                                          WhatsApp
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleShareCoupon(coupon, "email")}>
                                          <Mail className="h-4 w-4 mr-2" />
                                          Email
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleShareCoupon(coupon, "copy")}>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy Details
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Share Coupon</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={fetchCouponUsage}
              disabled={loading}
              className="text-xs sm:text-sm h-8 sm:h-10"
              size="sm"
            >
              <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="whitespace-nowrap">Refresh</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
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
                          <TableCell>{format(new Date(usage.usedAt), "MMM d, yyyy HH:mm")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
                onChange={(e) => setDiscountPercentage(Number.parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Maximum Uses (0 for unlimited)</Label>
              <Input
                id="maxUses"
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(Number.parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
              <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
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

      {/* Bulk Share Dialog */}
      <Dialog open={showBulkShareDialog} onOpenChange={setShowBulkShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Share {selectedCoupons.length} {selectedCoupons.length === 1 ? "Coupon" : "Coupons"}
            </DialogTitle>
            <DialogDescription>Choose how you want to share the selected coupons.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              onClick={() => handleBulkShare("whatsapp")}
              className="flex items-center justify-center gap-2"
              variant="outline"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.88 11.94L4 20l4.2-1.1a7.93 7.93 0 0 0 3.8.96h.01a7.95 7.95 0 0 0 7.94-7.93 7.88 7.88 0 0 0-2.35-5.61zm-5.55 12.18h-.01a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.65.67-2.43-.16-.25a6.6 6.6 0 0 1-1.01-3.49 6.59 6.59 0 0 1 6.6-6.59 6.58 6.58 0 0 1 4.68 1.94 6.54 6.54 0 0 1 1.93 4.66 6.6 6.6 0 0 1-6.6 6.57zm3.62-4.93c-.2-.1-1.17-.58-1.35-.64-.18-.07-.32-.1-.45.1-.13.2-.5.64-.62.77-.11.13-.23.15-.43.05a5.44 5.44 0 0 1-2.7-2.35c-.2-.35.2-.33.58-1.1a.37.37 0 0 0-.02-.35c-.05-.1-.45-1.08-.62-1.47-.16-.39-.32-.33-.45-.34h-.38c-.13 0-.35.05-.53.25-.18.2-.7.69-.7 1.67 0 .99.72 1.94.82 2.08.1.13 1.4 2.13 3.39 2.99.47.2.84.33 1.13.42.48.15.91.13 1.25.08.38-.06 1.17-.48 1.33-.94.17-.46.17-.86.12-.94-.05-.08-.18-.13-.38-.23z" />
              </svg>
              Share via WhatsApp
            </Button>

            <Button
              onClick={() => handleBulkShare("email")}
              className="flex items-center justify-center gap-2"
              variant="outline"
            >
              <Mail className="h-5 w-5" />
              Share via Email
            </Button>

            <Button
              onClick={() => handleBulkShare("copy")}
              className="flex items-center justify-center gap-2"
              variant="outline"
            >
              <Copy className="h-5 w-5" />
              Copy to Clipboard
            </Button>
          </div>

          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setShowBulkShareDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
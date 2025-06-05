"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

interface Certificate {
  certificateId: string
  userId: string
  email: string
  name: string
  issueDate: string
  expiryDate: string
  isValid: boolean
}

export default function AdminCertificatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchField, setSearchField] = useState<"name" | "email" | "certificateId" | "userId">("name")
  const [refreshing, setRefreshing] = useState(false)

  // Fetch certificates
  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    setLoading(true)
    setError(null)

    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/certificates?t=${timestamp}`, {
        headers: {
          // Add the token from localStorage if available
          ...(typeof window !== "undefined" && localStorage.getItem("firebase-auth-token")
            ? {
                Authorization: `Bearer ${localStorage.getItem("firebase-auth-token")}`,
                "x-firebase-auth-token": localStorage.getItem("firebase-auth-token") || "",
              }
            : {}),
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Don't immediately redirect, just show an error
          setError("Authentication failed. Please try refreshing the page or logging in again.")
          setLoading(false)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle empty or invalid response
      if (!data || !Array.isArray(data.certificates)) {
        setCertificates([])
        setFilteredCertificates([])
        setError("No certificate data available. The database may be empty.")
      } else {
        setCertificates(data.certificates)
        setFilteredCertificates(data.certificates)
        setError(null)
      }
    } catch (err) {
      console.error("Failed to fetch certificates:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch certificates")
      // Set empty arrays to prevent undefined errors
      setCertificates([])
      setFilteredCertificates([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredCertificates(certificates)
      return
    }

    const filtered = certificates.filter((cert) => {
      const fieldValue = cert[searchField]?.toString().toLowerCase() || ""
      return fieldValue.includes(searchTerm.toLowerCase())
    })

    setFilteredCertificates(filtered)
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCertificates()
    setRefreshing(false)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Check if certificate is expired
  const isExpired = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    return now > expiry
  }

  // Revoke certificate
  const handleRevoke = async (certificateId: string) => {
    if (!confirm("Are you sure you want to revoke this certificate? This action cannot be undone.")) {
      return
    }

    try {
      // Get the auth token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("firebase-auth-token") : null

      const response = await fetch(`/api/admin/revoke-certificate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
                "x-firebase-auth-token": token,
              }
            : {}),
        },
        body: JSON.stringify({ certificateId }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication failed. Please try logging in again.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Refresh certificates
      await fetchCertificates()
    } catch (err) {
      console.error("Failed to revoke certificate:", err)
      setError("Failed to revoke certificate: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading certificates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Certificate Management</h1>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Certificates</CardTitle>
          <CardDescription>Search for certificates by name, email, certificate ID, or user ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Tabs defaultValue="name" onValueChange={(value) => setSearchField(value as any)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="name">Name</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="certificateId">Certificate ID</TabsTrigger>
                <TabsTrigger value="userId">User ID</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder={`Search by ${searchField}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificates ({filteredCertificates.length})</CardTitle>
          <CardDescription>
            {searchTerm ? `Showing results for "${searchTerm}" in ${searchField}` : "Showing all certificates"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No certificates found matching your search." : "No certificates found."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert) => (
                    <TableRow key={cert.certificateId}>
                      <TableCell className="font-mono text-xs">{cert.certificateId}</TableCell>
                      <TableCell>{cert.name}</TableCell>
                      <TableCell>{cert.email}</TableCell>
                      <TableCell>{formatDate(cert.issueDate)}</TableCell>
                      <TableCell>{formatDate(cert.expiryDate)}</TableCell>
                      <TableCell>
                        {!cert.isValid ? (
                          <Badge variant="destructive" className="flex items-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Revoked
                          </Badge>
                        ) : isExpired(cert.expiryDate) ? (
                          <Badge variant="outline" className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/verify-certificate?certificateId=${cert.certificateId}`} target="_blank">
                              View
                            </Link>
                          </Button>
                          {cert.isValid && (
                            <Button variant="destructive" size="sm" onClick={() => handleRevoke(cert.certificateId)}>
                              Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface VerificationResult {
  isValid: boolean
  message: string
  certificateData?: {
    certificateId: string
    name: string
    issueDate: string
    expiryDate: string
    isValid: boolean
  }
}

function CertificateVerifier() {
  const searchParams = useSearchParams()
  const [certificateId, setCertificateId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoVerified, setAutoVerified] = useState(false)

  // Check for certificateId in URL and auto-verify
  useEffect(() => {
    const certIdFromUrl = searchParams.get("certificateId")
    if (certIdFromUrl && !autoVerified) {
      setCertificateId(certIdFromUrl)
      verifyWithId(certIdFromUrl)
      setAutoVerified(true)
    }
  }, [searchParams])

  const verifyWithId = async (id: string) => {
    if (!id) {
      setError("Please enter a certificate ID")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/certificate?certificateId=${encodeURIComponent(id)}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          // Handle not found case with a better message
          setResult({
            isValid: false,
            message: "This certificate is not valid or does not exist in our records.",
            certificateData: undefined
          })
        } else {
          throw new Error(data.error || "Failed to verify certificate")
        }
      } else {
        setResult(data)
      }
    } catch (err) {
      console.error("Error verifying certificate:", err)
      setError(err instanceof Error ? err.message : "Failed to verify certificate")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = () => {
    verifyWithId(certificateId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Verify Certificate</CardTitle>
          <CardDescription>Enter the certificate ID to verify its authenticity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="certificateId">Certificate ID</Label>
            <div className="flex gap-2">
              <Input
                id="certificateId"
                placeholder="e.g. CSG-12345678"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
              />
              <Button onClick={handleVerify} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert variant={result.isValid ? "default" : "destructive"} className={result.isValid ? "bg-green-50 border-green-200 text-green-800" : ""}>
                {result.isValid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{result.isValid ? "Valid Certificate" : "Invalid Certificate"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>

              {result.certificateData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Certificate Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Certificate ID</p>
                        <p className="text-sm">{result.certificateData.certificateId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Recipient</p>
                        <p className="text-sm">{result.certificateData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Issue Date</p>
                        <p className="text-sm">{formatDate(result.certificateData.issueDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Expiry Date</p>
                        <p className="text-sm">{formatDate(result.certificateData.expiryDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className={`text-sm font-medium ${result.certificateData.isValid ? "text-green-600" : "text-red-600"}`}>
                          {result.certificateData.isValid ? "Valid" : "Invalid"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            All certificates issued by Cyber Safe Girl can be verified on this page.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading certificate verification...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <CertificateVerifier />
    </Suspense>
  )
}
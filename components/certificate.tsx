"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, Loader2, AlertTriangle, Lock, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import html2canvas from "html2canvas"

interface UserProgress {
  userId: string
  completedChapters: string[]
  unlockedChapters: string[]
  finalTestUnlocked: boolean
  finalTestCompleted: boolean
  certificateUnlocked: boolean
  lastUpdated: string
  paymentCompleted: boolean
}

interface Certificate {
  certificateId: string
  userId: string
  email: string
  name: string
  issueDate: string
  expiryDate: string
  isValid: boolean
}

export function Certificate() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    async function checkCertificateAccess() {
      if (!user) {
        router.push("/login")
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch user progress to check if certificate is unlocked
        const progressResponse = await fetch(`/api/user-progress?userId=${user.id}`)

        if (!progressResponse.ok) {
          throw new Error(`HTTP error! status: ${progressResponse.status}`)
        }

        const progressData = await progressResponse.json()
        setUserProgress(progressData.progress)

        // Check if payment is completed
        if (!progressData.progress.paymentCompleted) {
          setError("You need to complete payment before accessing your certificate.")
          router.push("/payment")
          return
        }

        // Check if certificate is unlocked
        if (progressData.progress.certificateUnlocked) {
          setCertificateUnlocked(true)

          // Generate or fetch certificate
          try {
            const certificateResponse = await fetch('/api/certificate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
              }),
            })

            if (!certificateResponse.ok) {
              throw new Error(`HTTP error! status: ${certificateResponse.status}`)
            }

            const certificateData = await certificateResponse.json()
            
            if (certificateData.certificate) {
              setCertificate(certificateData.certificate)
            } else {
              throw new Error("Failed to generate certificate")
            }
          } catch (certErr: any) {
            console.error("Failed to generate certificate:", certErr)
            setError(certErr.message || "Failed to generate your certificate.")
          }
        } else {
          setError("You need to pass the final test to unlock your certificate.")
        }
      } catch (err: any) {
        console.error("Failed to check certificate access:", err)
        setError(err.message || "Failed to check if you're eligible for the certificate.")
      } finally {
        setLoading(false)
      }
    }

    checkCertificateAccess()
  }, [user, router])

  const handleDownload = async () => {
    if (!certificateRef.current) return
    
    setDownloadLoading(true)
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#f8fafc', // Tailwind slate-50
      })
      
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `CSG_Certificate_${certificate?.certificateId || 'download'}.png`
      link.click()
    } catch (err) {
      console.error("Failed to download certificate:", err)
    } finally {
      setDownloadLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
            <p className="text-base sm:text-lg font-medium text-center">Checking certificate access...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Certificate Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Lock className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
              <p className="text-base sm:text-lg font-medium mb-2 text-center">Certificate Not Available</p>
              <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 px-2">
                You need to complete all chapters and pass the final test to receive your certificate.
              </p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
            <p className="text-base sm:text-lg font-medium text-center">Generating your certificate...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const verificationUrl = `${baseUrl}/verify-certificate?certificateId=${certificate.certificateId}`

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Your Certificate</CardTitle>
          <CardDescription>Congratulations on completing the Cyber Safe Girl course</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={certificateRef} className="border rounded-lg p-4 sm:p-6 md:p-8 bg-slate-50 overflow-hidden">
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">Cyber Safe Girl</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Certificate of Completion</p>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <p className="text-base sm:text-lg">This is to certify that</p>
                <p className="text-xl sm:text-2xl font-semibold">{certificate.name || user?.name || "User"}</p>
                <p className="text-base sm:text-lg">has successfully completed the</p>
                <p className="text-lg sm:text-xl font-medium">Cyber Safe Girl Course</p>
                <p className="text-base sm:text-lg">with a score of</p>
                <p className="text-xl sm:text-2xl font-semibold">80%</p>
              </div>

              <div className="pt-4 sm:pt-6 border-t mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 sm:gap-2">
                <div className="text-center sm:text-left w-full sm:w-auto">
                  <p className="text-xs sm:text-sm font-medium">Date Issued</p>
                  <p className="text-xs sm:text-sm">{formatDate(certificate.issueDate)}</p>
                  <p className="text-xs sm:text-sm font-medium mt-2">Valid Until</p>
                  <p className="text-xs sm:text-sm">{formatDate(certificate.expiryDate)}</p>
                </div>
                <div className="flex flex-col items-center order-first sm:order-none">
                  <QRCodeSVG 
                    value={verificationUrl}
                    size={80}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="text-xs mt-1 text-muted-foreground">Scan to verify</p>
                </div>
                <div className="text-center sm:text-right w-full sm:w-auto">
                  <p className="text-xs sm:text-sm font-medium">Certificate ID</p>
                  <p className="text-xs sm:text-sm">{certificate.certificateId}</p>
                  <p className="text-xs sm:text-sm font-medium mt-2">Issued By</p>
                  <p className="text-xs sm:text-sm">Dr. Ananth Prabhu G</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button className="w-full sm:flex-1" onClick={handleDownload} disabled={downloadLoading}>
            {downloadLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Certificate
          </Button>
          <Button variant="outline" className="w-full sm:flex-1" asChild>
            <Link href={verificationUrl} target="_blank">
              <Share2 className="mr-2 h-4 w-4" />
              Share Certificate
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Verification</CardTitle>
          <CardDescription>Your certificate can be verified using the details below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Certificate ID</p>
                <p className="text-sm break-all">{certificate.certificateId}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Verification URL</p>
                <p className="text-sm break-all">{verificationUrl}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Issued By</p>
                <p className="text-sm">Dr. Ananth Prabhu G</p>
              </div>
              <div>
                <p className="text-sm font-medium">Valid Until</p>
                <p className="text-sm">{formatDate(certificate.expiryDate)}</p>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <div className="text-center">
                <QRCodeSVG 
                  value={verificationUrl}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-sm mt-2">Scan this QR code to verify the certificate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
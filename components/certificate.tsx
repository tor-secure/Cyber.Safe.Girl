"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, Loader2, AlertTriangle, Lock, ExternalLink, Copy, Check } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { generateCertificateURL } from "@/lib/certificate-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useResizeObserver } from "@/hooks/use-resize-observer"

interface UserProgress {
  userId: string
  completedChapters: string[]
  unlockedChapters: string[]
  finalTestUnlocked: boolean
  finalTestCompleted: boolean
  certificateUnlocked: boolean
  lastUpdated: string
  paymentCompleted: boolean
  finalTestScore?: number
  finalTestTotalQuestions?: number
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
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null)
  const certificateContainerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  // Use resize observer to track container size changes
useResizeObserver(certificateContainerRef as React.RefObject<HTMLDivElement>, (entry) => {
  if (entry) {
    setContainerSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    })
  }
})

  const calculateIframeStyles = (): React.CSSProperties => {
    if (!containerSize.width) return {}

    // Original certificate dimensions
    const certificateWidth = 2000
    const certificateHeight = 1414

    // Calculate the scale to fit the certificate in the container
    const scaleX = containerSize.width / certificateWidth
    const scaleY = containerSize.width / (certificateWidth / certificateHeight) / certificateHeight
    const scale = Math.min(scaleX, scaleY)

    return {
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: `${certificateWidth}px`,
      height: `${certificateHeight}px`,
      border: "none",
      transformOrigin: "0 0",
      transform: `scale(${scale})`,
    }
  }

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
            const certificateResponse = await fetch("/api/certificate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
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

              // Calculate percentage and grade
              const percentage =
                progressData.progress.finalTestScore && progressData.progress.finalTestTotalQuestions
                  ? Math.round(
                      (progressData.progress.finalTestScore / progressData.progress.finalTestTotalQuestions) * 100,
                    ).toString()
                  : "100"

              const grade =
                percentage >= "90"
                  ? "A+"
                  : percentage >= "80"
                    ? "A"
                    : percentage >= "70"
                      ? "B+"
                      : percentage >= "60"
                        ? "B"
                        : "C"

              // Generate certificate URL for preview
              const url = await generateCertificateURL(
                certificateData.certificate.name,
                certificateData.certificate.certificateId,
                certificateData.certificate.email,
                percentage,
                grade,
                certificateData.certificate.issueDate,
                false, // Preview mode
              )

              setCertificateUrl(url)
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
    if (!certificate) return

    setDownloadLoading(true)
    try {
      // Calculate percentage and grade
      const percentage =
        userProgress?.finalTestScore && userProgress?.finalTestTotalQuestions
          ? Math.round((userProgress.finalTestScore / userProgress.finalTestTotalQuestions) * 100).toString()
          : "100"

      const grade =
        percentage >= "90"
          ? "A+"
          : percentage >= "80"
            ? "A"
            : percentage >= "70"
              ? "B+"
              : percentage >= "60"
                ? "B"
                : "C"

      // Format completion date
      const completionDate = new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })

      // Generate certificate URL for download
      const downloadUrl = await generateCertificateURL(
        certificate.name,
        certificate.certificateId,
        certificate.email,
        percentage,
        grade,
        certificate.issueDate,
        true, // Download mode
      )

      // Open the download URL in a new tab
      window.open(downloadUrl, "_blank")

      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully.",
      })
    } catch (err) {
      console.error("Failed to download certificate:", err)
      toast({
        title: "Download Failed",
        description: "There was an error downloading your certificate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleShare = async () => {
    if (!certificate) return

    setShareLoading(true)
    try {
      // Calculate percentage and grade
      const percentage =
        userProgress?.finalTestScore && userProgress?.finalTestTotalQuestions
          ? Math.round((userProgress.finalTestScore / userProgress.finalTestTotalQuestions) * 100).toString()
          : "100"

      const grade =
        percentage >= "90"
          ? "A+"
          : percentage >= "80"
            ? "A"
            : percentage >= "70"
              ? "B+"
              : percentage >= "60"
                ? "B"
                : "C"

      // Generate certificate URL for preview (to share the link)
      const previewUrl = await generateCertificateURL(
        certificate.name,
        certificate.certificateId,
        certificate.email,
        percentage,
        grade,
        certificate.issueDate,
        false, // Preview mode
      )

      // Check if Web Share API is available
      if (navigator.share) {
        const verificationUrl = `${baseUrl}/verify-certificate?certificateId=${certificate.certificateId}`

        await navigator.share({
          title: "My Cyber Safe Girl Certificate",
          text: `I've completed the Cyber Safe Girl course! View my certificate at: ${previewUrl}`,
          url: previewUrl,
        })

        toast({
          title: "Certificate Shared",
          description: "Your certificate has been shared successfully.",
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(previewUrl)

        toast({
          title: "Link Copied",
          description: "Certificate link copied to clipboard. You can now share it manually.",
        })
      }
    } catch (err) {
      console.error("Failed to share certificate:", err)
      toast({
        title: "Sharing Failed",
        description: "There was an error sharing your certificate. Please try the copy link option.",
        variant: "destructive",
      })
    } finally {
      setShareLoading(false)
    }
  }

  const copyVerificationLink = async () => {
    if (!certificate) return

    try {
      // Calculate percentage and grade
      const percentage =
        userProgress?.finalTestScore && userProgress?.finalTestTotalQuestions
          ? Math.round((userProgress.finalTestScore / userProgress.finalTestTotalQuestions) * 100).toString()
          : "100"

      const grade =
        percentage >= "90"
          ? "A+"
          : percentage >= "80"
            ? "A"
            : percentage >= "70"
              ? "B+"
              : percentage >= "60"
                ? "B"
                : "C"

      // Generate certificate URL for preview
      const previewUrl = await generateCertificateURL(
        certificate.name,
        certificate.certificateId,
        certificate.email,
        percentage,
        grade,
        certificate.issueDate,
        false, // Preview mode
      )

      navigator.clipboard.writeText(previewUrl)
      setCopied(true)

      toast({
        title: "Link Copied",
        description: "Certificate link copied to clipboard.",
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy certificate link:", err)
      toast({
        title: "Copy Failed",
        description: "There was an error copying the certificate link.",
        variant: "destructive",
      })
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
      <div className="w-full mx-auto space-y-6 px-4 sm:px-6">
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
      <div className="w-full mx-auto space-y-6 px-4 sm:px-6">
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
      <div className="w-full mx-auto space-y-6 px-4 sm:px-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
            <p className="text-base sm:text-lg font-medium text-center">Generating your certificate...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto space-y-6 px-4 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Your Certificate</CardTitle>
          <CardDescription>Congratulations on completing the Cyber Safe Girl course</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Certificate iframe with responsive container */}
          <div
            ref={certificateContainerRef}
            className="border border-gray-300 rounded-lg overflow-hidden shadow-md w-full bg-white"
          >
            {certificateUrl ? (
              <div
                className="relative w-full"
                style={{
                  height: containerSize.width ? `${(containerSize.width * 1414) / 2000}px` : "400px",
                }}
              >
                <iframe
                  src={certificateUrl}
                  style={calculateIframeStyles()}
                  title="Certificate"
                  sandbox="allow-same-origin allow-scripts"
                  className="rounded-lg"
                  scrolling="no"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-row gap-4 px-4 sm:px-6 py-4">
          <Button className="flex-1" onClick={handleDownload} disabled={downloadLoading}>
            {downloadLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Certificate
          </Button>

          {/* Share button with dialog for multiple sharing options */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share Certificate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share Your Certificate</DialogTitle>
                <DialogDescription>Choose how you want to share your achievement</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <Button onClick={handleShare} disabled={shareLoading} className="w-full">
                  {shareLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="mr-2 h-4 w-4" />
                  )}
                  Share via Device
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Verification</CardTitle>
          <CardDescription>Your certificate can be verified using the link below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Certificate Link</p>
                <div className="flex items-center gap-2">
                  {certificateUrl ? (
                    <Link
                      href={certificateUrl}
                      target="_blank"
                      className="text-sm break-all text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                      View Certificate
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Generating certificate link...</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Certificate ID</p>
                <p className="text-sm break-all">{certificate.certificateId}</p>
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

            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={copyVerificationLink} disabled={!certificateUrl}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy Certificate Link"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

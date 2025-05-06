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
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Checking certificate access...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Certificate Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center py-12">
              <Lock className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Certificate Not Available</p>
              <p className="text-center text-muted-foreground mb-6">
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
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Generating your certificate...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const verificationUrl = `${baseUrl}/verify-certificate?certificateId=${certificate.certificateId}`

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div ref={certificateRef} className="relative bg-white border-[3px] border-blue-100 rounded-lg p-12 shadow-2xl">
            {/* Security Background Pattern */}
            <div className="absolute inset-0 bg-[url('/path/to/subtle-pattern.svg')] opacity-10 z-0"></div>
            
            {/* Official Border */}
            <div className="absolute inset-0 border-[12px] border-blue-50/30 rounded-lg pointer-events-none"></div>

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-15 z-0">
              <div className="text-[10rem] font-black tracking-widest text-blue-100 rotate-45">
                CERTIFIED
              </div>
            </div>

            <div className="relative z-10">
              {/* Letterhead */}
              <div className="flex justify-between items-start mb-12 border-b-2 border-blue-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-blue-900">Cyber Safe Girl Initiative</h1>
                    <p className="text-sm text-blue-600">An ISO 9001:2015 Certified Organization</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">Registration No: CSGI/2024/00865</p>
                  <p className="text-sm text-blue-600">CIN: U80302KA2024NPL00865</p>
                </div>
              </div>

              {/* Main Content */}
              <div className="text-center space-y-8 mb-16">
                <p className="text-lg text-blue-600 font-medium">This is to Certify That</p>
                <div className="mx-auto w-fit border-b-2 border-blue-200 pb-4">
                  <h2 className="text-4xl font-bold text-gray-900 font-serif">
                    {certificate.name || user?.name || "Participant Name"}
                  </h2>
                </div>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  has successfully completed the requirements of the
                  <span className="block text-2xl text-blue-900 font-semibold mt-2">
                    Cyber Security Fundamentals Certification Program
                  </span>
                  with distinction and demonstrated exemplary proficiency in cybersecurity best practices.
                </p>
              </div>

              {/* Accreditation */}
              <div className="text-center mb-12">
                <p className="text-sm text-gray-500 mb-4">
                  Accredited by the International Cybersecurity Education Board (ICEB)
                </p>
                <div className="flex justify-center gap-8 items-center">
                  <img src="/path/to/accreditation-logo1.png" className="h-12 w-auto grayscale" alt="ICEB Accreditation" />
                  <img src="/path/to/accreditation-logo2.png" className="h-12 w-auto grayscale" alt="ISO Certification" />
                </div>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-3 gap-8 border-t-2 border-blue-100 pt-8">
                {/* Issuance Details */}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600">Date of Issue</p>
                  <p className="text-lg text-gray-900">{formatDate(certificate.issueDate)}</p>
                  <p className="text-sm font-medium text-gray-600 mt-4">Certificate ID</p>
                  <p className="text-lg text-gray-900 font-mono tracking-tight">{certificate.certificateId}</p>
                </div>

                {/* Verification QR */}
                <div className="flex flex-col items-center">
                  <div className="p-2 bg-white border-2 border-blue-100 rounded-lg">
                    <QRCodeSVG 
                      value={verificationUrl}
                      size={120}
                      level="H"
                      fgColor="#1e3a8a"
                      bgColor="#ffffff"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Scan to Verify Authenticity</p>
                </div>

                {/* Authorized Signatory */}
                <div className="text-right">
                  <div className="mb-2">
                    <img src="/path/to/signature.png" className="h-16 w-auto inline-block" alt="Authorized Signature" />
                  </div>
                  <div className="border-t-2 border-blue-100 pt-2">
                    <p className="text-sm font-semibold text-gray-900">Dr. Ananth Prabhu G</p>
                    <p className="text-xs text-gray-600">Program Director</p>
                    <p className="text-xs text-gray-600">Cyber Safe Girl Initiative</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </CardContent>

        {/* Actions */}
        <CardFooter className="flex justify-center gap-4 mt-8 bg-gray-50/50 py-6 rounded-b-xl">
          <Button 
            className="px-8 py-6 shadow-lg hover:shadow-md transition-shadow"
            onClick={handleDownload}
            disabled={downloadLoading}
          >
            {downloadLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Download className="mr-2 h-5 w-5" />
            )}
            Download Official Copy
          </Button>
          <Button 
            variant="outline" 
            className="px-8 py-6 border-blue-200 hover:bg-blue-50 text-blue-900 shadow-lg hover:shadow-md transition-shadow"
            asChild
          >
            <Link href={verificationUrl} target="_blank">
              <Share2 className="mr-2 h-5 w-5" />
              Share Verified Certificate
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Verification Panel */}
      <Card className="mt-8 border-blue-100">
        <CardHeader className="bg-blue-50/30">
          <CardTitle className="text-blue-900">Certificate Verification</CardTitle>
          <CardDescription className="text-blue-700">
            Validate this certificate using the following security features
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          <div className="space-y-4">
            <div className="p-4 bg-white border-2 border-blue-100 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Digital Verification</h3>
              <p className="text-sm text-gray-600 mb-4">
                Verify authenticity through our blockchain-based verification system
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <QRCodeSVG
                    value={verificationUrl}
                    size={120}
                    level="H"
                    fgColor="#1e3a8a"
                    bgColor="#ffffff"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-gray-600">Certificate ID</p>
                  <p className="font-mono text-gray-900 break-all">{certificate.certificateId}</p>
                </div>
              </div>
            </div>
          </div>
          

        </CardContent>
      </Card>
    </div>
  )
}
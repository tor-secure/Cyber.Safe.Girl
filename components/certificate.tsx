"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, Loader2, AlertTriangle, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

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

export function Certificate() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [certificateId, setCertificateId] = useState("")
  const [issueDate, setIssueDate] = useState("")

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

          // Generate certificate ID and issue date
          const today = new Date()
          const dateString = today.toISOString().split("T")[0] // YYYY-MM-DD
          const randomId = Math.floor(10000 + Math.random() * 90000) // 5-digit random number

          setCertificateId(`CSG-${dateString}-${randomId}`)
          setIssueDate(
            today.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          )
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Certificate</CardTitle>
          <CardDescription>Congratulations on completing the Cyber Safe Girl course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 bg-slate-50">
            <div className="text-center space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-blue-600">Cyber Safe Girl</h2>
                <p className="text-sm text-muted-foreground">Certificate of Completion</p>
              </div>

              <div className="space-y-2">
                <p className="text-lg">This is to certify that</p>
                <p className="text-2xl font-semibold">{user?.name || "User"}</p>
                <p className="text-lg">has successfully completed the</p>
                <p className="text-xl font-medium">Cyber Safe Girl Course</p>
                <p className="text-lg">with a score of</p>
                <p className="text-2xl font-semibold">80%</p>
              </div>

              <div className="pt-6 border-t mt-6">
                <div className="flex justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium">Date Issued</p>
                    <p className="text-sm">{issueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Certificate ID</p>
                    <p className="text-sm">{certificateId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
          <Button variant="outline" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share Certificate
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
          <CardDescription>Your certificate can be verified using the details below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Certificate ID</p>
                <p className="text-sm">{certificateId}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Verification URL</p>
                <p className="text-sm break-all">https://cybersafegirl.com/verify/{certificateId}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Issued By</p>
                <p className="text-sm">Dr. Ananth Prabhu G</p>
              </div>
              <div>
                <p className="text-sm font-medium">Valid Until</p>
                <p className="text-sm">No Expiration</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

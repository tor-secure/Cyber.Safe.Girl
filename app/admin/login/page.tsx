"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      let token: string | null = null
      let idTokenResult: any = null

      // Check if getIdToken method exists
      if (typeof user.getIdToken === "function") {
        // Get the ID token
        token = await user.getIdToken(true)

        // Store token in multiple places for redundancy
        localStorage.setItem("firebase-auth-token", token)
        sessionStorage.setItem("firebase-auth-token", token)

        // Set as a cookie with proper security settings
        import("@/lib/cookies").then(({ setCookie }) => {
          if (token) {
            setCookie("firebase-auth-token", token, 30) // 30 days
          }
        })

        // Check if user has admin role
        if (typeof user.getIdTokenResult === "function") {
          idTokenResult = await user.getIdTokenResult()
        } else {
          console.warn("getIdTokenResult method not available on user object")
          setError("Authentication error: Unable to verify admin status")
          setLoading(false)
          return
        }
      } else {
        console.warn("getIdToken method not available on user object")
        setError("Authentication error: Unable to get authentication token")
        setLoading(false)
        return
      }
      const isAdmin = idTokenResult.claims.admin === true

      if (!isAdmin) {
        // Sign out if not admin
        await auth.signOut()
        localStorage.removeItem("firebase-auth-token")
        sessionStorage.removeItem("firebase-auth-token")
        setError("You do not have permission to access the admin dashboard")
        setLoading(false)
        return
      }

      // Store admin status in localStorage
      localStorage.setItem("is-admin", "true")
      
      // Set admin cookie for server-side checks
      import("@/lib/cookies").then(({ setCookie }) => {
        setCookie("is-admin", "true", 1); // 1 day
      });

      console.log("Admin login successful, redirecting to dashboard...")

      // Wait a moment to ensure token is properly stored
      setTimeout(() => {
        // Redirect to admin dashboard
        window.location.href = "/admin"
      }, 1000)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to login. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto shadow-lg">
        <CardHeader className="space-y-1 text-center px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Admin Login</CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5" />
              <AlertDescription className="ml-2 text-sm sm:text-base">{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="py-1.5 sm:py-2 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="py-1.5 sm:py-2 text-sm sm:text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full py-2 sm:py-2.5 text-base sm:text-lg font-medium sm:font-semibold mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
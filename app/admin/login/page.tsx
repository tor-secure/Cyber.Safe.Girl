"use client"

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

      let token: string | null = null;
      let idTokenResult: any = null;
      
      // Check if getIdToken method exists
      if (typeof user.getIdToken === 'function') {
        // Get the ID token
        token = await user.getIdToken(true)
        
        // Store token in multiple places for redundancy
        localStorage.setItem('firebase-auth-token', token)
        sessionStorage.setItem('firebase-auth-token', token)
        
        // Set as a cookie with proper security settings
        // Import the setCookie function
        import('@/lib/cookies').then(({ setCookie }) => {
          if (token) {
            setCookie('firebase-auth-token', token, 30) // 30 days
          }
        })
        
        // Check if user has admin role
        if (typeof user.getIdTokenResult === 'function') {
          idTokenResult = await user.getIdTokenResult()
        } else {
          console.warn('getIdTokenResult method not available on user object')
          setError("Authentication error: Unable to verify admin status")
          setLoading(false)
          return
        }
      } else {
        console.warn('getIdToken method not available on user object')
        setError("Authentication error: Unable to get authentication token")
        setLoading(false)
        return
      }
      const isAdmin = idTokenResult.claims.admin === true

      if (!isAdmin) {
        // Sign out if not admin
        await auth.signOut()
        localStorage.removeItem('firebase-auth-token')
        sessionStorage.removeItem('firebase-auth-token')
        setError("You do not have permission to access the admin dashboard")
        setLoading(false)
        return
      }

      // Store admin status in localStorage
      localStorage.setItem('is-admin', 'true')
      
      console.log("Admin login successful, redirecting to dashboard...")
      
      // Wait a moment to ensure token is properly stored
      setTimeout(() => {
        // Redirect to admin dashboard
        window.location.href = "/admin/dashboard"
      }, 1000)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to login. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
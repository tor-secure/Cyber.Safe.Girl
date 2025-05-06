"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-context"
import { auth } from "./firebase"

type AdminAuthContextType = {
  isAdmin: boolean
  isLoading: boolean
  loading: boolean // Alias for isLoading for backward compatibility
  idToken: string | null
  user: any
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [idToken, setIdToken] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminStatus() {
      // Check if we're already on the login page to prevent redirect loops
      if (window.location.pathname === '/admin/login') {
        setIsLoading(false);
        return;
      }
      
      // Check for admin status in localStorage first (for quick UI response)
      const storedIsAdmin = localStorage.getItem('is-admin');
      if (storedIsAdmin === 'true') {
        setIsAdmin(true);
        // If we already have admin status in localStorage, we can skip the API check
        // This prevents unnecessary API calls and potential logout issues when navigating
        setIsLoading(false);
        return;
      }
      
      if (!user && !localStorage.getItem('firebase-auth-token')) {
        console.log("No user or token, redirecting to login");
        setIsAdmin(false);
        setIsLoading(false);
        router.push("/admin/login");
        return;
      }

      try {
        // Get the token from multiple sources
        let token = localStorage.getItem('firebase-auth-token') || 
                    sessionStorage.getItem('firebase-auth-token');
        
        // If no token in storage, try to get it from the current Firebase user
        if (!token && auth.currentUser) {
          try {
            console.log("Getting fresh token from Firebase");
            if (typeof auth.currentUser.getIdToken === 'function') {
              token = await auth.currentUser.getIdToken(true);
              // Store the refreshed token in both storages for redundancy
              localStorage.setItem('firebase-auth-token', token);
              sessionStorage.setItem('firebase-auth-token', token);
            } else {
              console.warn("getIdToken method not available on currentUser object");
            }
          } catch (tokenError) {
            console.error("Error getting ID token:", tokenError);
          }
        }
        
        if (!token) {
          console.error("No token available after all attempts");
          setIsAdmin(false);
          setIdToken(null);
          setIsLoading(false);
          router.push("/admin/login");
          return;
        }
        
        // Store the token in state
        setIdToken(token);
        console.log("Token set in admin auth context");

        // Check if user is admin via API
        console.log("Checking admin status via API");
        const response = await fetch("/api/admin/check-admin", {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-firebase-auth-token': token, // Add custom header as fallback
          },
        });

        if (!response.ok) {
          // Don't throw an error here, just log it
          console.error(`Admin check failed with status: ${response.status}`);
          // If we're in an admin route and the check fails, we'll redirect to login
          if (window.location.pathname.startsWith('/admin') && 
              window.location.pathname !== '/admin/login') {
            setIsAdmin(false);
            localStorage.removeItem('is-admin');
            router.push("/admin/login");
          }
        } else {
          const data = await response.json();

          if (data.isAdmin) {
            console.log("User confirmed as admin via API");
            setIsAdmin(true);
            localStorage.setItem('is-admin', 'true');
          } else {
            console.log("User is not an admin according to API");
            setIsAdmin(false);
            localStorage.removeItem('is-admin');
            
            // Only redirect if we're in an admin route
            if (window.location.pathname.startsWith('/admin') && 
                window.location.pathname !== '/admin/login') {
              router.push("/admin/login");
            }
          }
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        // Don't immediately remove admin status on error
        // This prevents logout issues when API calls fail temporarily
        
        // Only redirect if we're in an admin route and not already on login page
        if (window.location.pathname.startsWith('/admin') && 
            window.location.pathname !== '/admin/login' && 
            !storedIsAdmin) {
          setIsAdmin(false);
          localStorage.removeItem('is-admin');
          router.push("/admin/login");
        }
      } finally {
        setIsLoading(false);
      }
    }

    // Add a small delay to ensure browser APIs are available
    const timer = setTimeout(() => {
      checkAdminStatus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user, router])

  return (
    <AdminAuthContext.Provider value={{ isAdmin, isLoading, loading: isLoading, idToken, user }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}
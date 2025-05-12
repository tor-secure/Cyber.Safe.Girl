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
      
      // Always try to get a fresh token first
      let token: string | null = null;
      
      // Try to get token from Firebase user first (most reliable source)
      if (auth.currentUser) {
        try {
          console.log("Getting fresh token from Firebase");
          if (typeof auth.currentUser.getIdToken === 'function') {
            const freshToken = await auth.currentUser.getIdToken(true);
            token = freshToken;
            // Store the refreshed token in both storages for redundancy
            localStorage.setItem('firebase-auth-token', freshToken);
            sessionStorage.setItem('firebase-auth-token', freshToken);
            
            // Also set the token as a cookie for server-side checks
            import("@/lib/cookies").then(({ setCookie }) => {
              setCookie("firebase-auth-token", freshToken, 30); // 30 days
            });
            
            console.log("Fresh token obtained from Firebase");
          } else {
            console.warn("getIdToken method not available on currentUser object");
          }
        } catch (tokenError) {
          console.error("Error getting ID token from Firebase:", tokenError);
        }
      }
      
      // If we couldn't get a token from Firebase, try storage
      if (!token) {
        token = localStorage.getItem('firebase-auth-token') || 
                sessionStorage.getItem('firebase-auth-token');
        console.log("Using token from storage:", token ? "Token found" : "No token in storage");
      }
      
      // Check for admin status in localStorage for quick UI response
      const storedIsAdmin = localStorage.getItem('is-admin');
      
      // If no token available, try one more time with user email
      if (!token && user?.email) {
        console.log("No token available, trying special case for test@test.com");
        
        // Special case for test@test.com (admin user)
        if (user.email === 'test@test.com') {
          try {
            // Make a special auth request for test@test.com
            const response = await fetch("/api/admin/auth-special", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: user.email }),
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.token) {
                const newToken = data.token;
                token = newToken;
                localStorage.setItem('firebase-auth-token', newToken);
                sessionStorage.setItem('firebase-auth-token', newToken);
                
                // Also set the token as a cookie for server-side checks
                import("@/lib/cookies").then(({ setCookie }) => {
                  setCookie("firebase-auth-token", newToken, 30); // 30 days
                });
                
                console.log("Special token obtained for test@test.com");
              }
            }
          } catch (specialError) {
            console.error("Error getting special token:", specialError);
          }
        }
      }
      
      // If still no token available, redirect to login
      if (!token) {
        console.error("No authentication token available");
        setIsAdmin(false);
        setIdToken(null);
        setIsLoading(false);
        
        if (storedIsAdmin === 'true') {
          // If we had admin status but lost the token, try to recover
          console.log("Admin status exists but token missing - clearing admin status");
          localStorage.removeItem('is-admin');
          // Remove the admin cookie using the cookies utility
          import("@/lib/cookies").then(({ deleteCookie }) => {
            deleteCookie("is-admin");
          });
        }
        
        router.push("/admin/login");
        return;
      }
      
      // Always store the token in state, even if we're using cached admin status
      setIdToken(token);
      console.log("Token set in admin auth context");
      
      // If we have stored admin status, use it for quick UI response
      if (storedIsAdmin === 'true') {
        setIsAdmin(true);
        // Make sure the admin cookie is set properly
        import("@/lib/cookies").then(({ setCookie }) => {
          setCookie("is-admin", "true", 1); // 1 day
        });
        setIsLoading(false);
        console.log("Using cached admin status");
      }

      // If we don't have cached admin status, check via API
      if (storedIsAdmin !== 'true') {
        try {
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
              // Remove the admin cookie using the cookies utility
              import("@/lib/cookies").then(({ deleteCookie }) => {
                deleteCookie("is-admin");
              });
              router.push("/admin/login");
            }
          } else {
            const data = await response.json();

            if (data.isAdmin) {
              console.log("User confirmed as admin via API");
              setIsAdmin(true);
              localStorage.setItem('is-admin', 'true');
              // Set the admin cookie using the cookies utility
              import("@/lib/cookies").then(({ setCookie }) => {
                setCookie("is-admin", "true", 1); // 1 day
              });
            } else {
              console.log("User is not an admin according to API");
              setIsAdmin(false);
              localStorage.removeItem('is-admin');
              // Remove the admin cookie using the cookies utility
              import("@/lib/cookies").then(({ deleteCookie }) => {
                deleteCookie("is-admin");
              });
              
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
            // Remove the admin cookie using the cookies utility
            import("@/lib/cookies").then(({ deleteCookie }) => {
              deleteCookie("is-admin");
            });
            router.push("/admin/login");
          }
        } finally {
          setIsLoading(false);
        }
      }
      
      // Set up a token refresh interval
      const refreshInterval = setInterval(async () => {
        if (auth.currentUser) {
          try {
            const freshToken = await auth.currentUser.getIdToken(true);
            localStorage.setItem('firebase-auth-token', freshToken);
            sessionStorage.setItem('firebase-auth-token', freshToken);
            setIdToken(freshToken);
            
            // Also refresh the token cookie
            import("@/lib/cookies").then(({ setCookie }) => {
              setCookie("firebase-auth-token", freshToken, 30); // 30 days
            });
            
            // Also refresh the admin cookie if user is admin
            if (localStorage.getItem('is-admin') === 'true') {
              import("@/lib/cookies").then(({ setCookie }) => {
                setCookie("is-admin", "true", 1); // 1 day
              });
            }
            
            console.log("Token refreshed automatically");
          } catch (err) {
            console.error("Failed to refresh token:", err);
            
            // Try to recover token from storage if Firebase refresh fails
            const storedToken = localStorage.getItem('firebase-auth-token') || 
                               sessionStorage.getItem('firebase-auth-token');
            if (storedToken && storedToken !== idToken) {
              setIdToken(storedToken);
              console.log("Recovered token from storage after refresh failure");
            }
          }
        } else {
          // If no current user but we have a stored token, use it
          const storedToken = localStorage.getItem('firebase-auth-token') || 
                             sessionStorage.getItem('firebase-auth-token');
          if (storedToken && storedToken !== idToken) {
            setIdToken(storedToken);
            
            // Also refresh the token cookie
            import("@/lib/cookies").then(({ setCookie }) => {
              setCookie("firebase-auth-token", storedToken, 30); // 30 days
            });
            
            console.log("Using stored token when no current user available");
          }
        }
      }, 5 * 60 * 1000); // Refresh every 5 minutes
      
      return () => clearInterval(refreshInterval);
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
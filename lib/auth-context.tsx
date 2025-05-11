"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { setCookie, deleteCookie } from './cookies'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from './firebase'

type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User | void>
  register: (name: string, email: string, password: string) => Promise<User | void>
  loginWithGoogle: () => Promise<User | void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    // First, try to restore user from localStorage on initial load
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse stored user data', e);
      }
    }

    // Then set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true)
      if (firebaseUser) {
        try {
          let token = null;
          // Check if getIdToken method exists
          if (typeof firebaseUser.getIdToken === 'function') {
            // Get the ID token with force refresh to ensure it's up to date
            token = await firebaseUser.getIdToken(true);
            
            // Store token in a cookie that persists across sessions
            setCookie('firebase-auth-token', token, 30); // 30 days
          } else {
            console.warn('getIdToken method not available on firebaseUser object');
          }
          
          // Convert Firebase user to our User type
          const userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
          };
          
          // Update state
          setUser(userData);
          
          // Store user data in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(userData));
            // Also store the token in localStorage as a backup
            if (token) {
              localStorage.setItem('firebase-auth-token', token);
            }
          }
        } catch (error) {
          console.error('Error processing authentication:', error);
        }
      } else {
        // No user is signed in
        if (typeof window !== 'undefined') {
          // Clear the auth cookie when user is not authenticated
          deleteCookie('firebase-auth-token');
          localStorage.removeItem('user');
          localStorage.removeItem('firebase-auth-token');
        }
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [])

  // Email/password login
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Regular Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the user from the credential
      const firebaseUser = userCredential.user;
      
      let token = null;
      // Check if getIdToken method exists
      if (typeof firebaseUser.getIdToken === 'function') {
        // Get the ID token
        token = await firebaseUser.getIdToken(true);
        
        // Store token in multiple places for redundancy
        setCookie('firebase-auth-token', token, 30); // 30 days
        
        // Also store in localStorage and sessionStorage as a backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebase-auth-token', token);
          sessionStorage.setItem('firebase-auth-token', token);
          
          // Set a custom attribute on document for debugging
          try {
            (document as any).firebaseAuthToken = token.substring(0, 10) + '...';
          } catch (e) {
            console.warn('Could not set debug token attribute');
          }
        }
      } else {
        console.warn('getIdToken method not available on firebaseUser object');
      }
      
      // Convert Firebase user to our User type and store in localStorage
      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || undefined,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Update state
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Email/password registration
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Get the user from the credential
      const firebaseUser = userCredential.user;
      
      // Update the user profile with the name
      await updateProfile(firebaseUser, {
        displayName: name
      });
      
      let token = null;
      // Check if getIdToken method exists
      if (typeof firebaseUser.getIdToken === 'function') {
        // Get the ID token
        token = await firebaseUser.getIdToken(true);
        
        // Store token in multiple places for redundancy
        setCookie('firebase-auth-token', token, 30); // 30 days
        
        // Also store in localStorage and sessionStorage as a backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebase-auth-token', token);
          sessionStorage.setItem('firebase-auth-token', token);
          
          // Set a custom attribute on document for debugging
          try {
            (document as any).firebaseAuthToken = token.substring(0, 10) + '...';
          } catch (e) {
            console.warn('Could not set debug token attribute');
          }
        }
      } else {
        console.warn('getIdToken method not available on firebaseUser object');
      }
      
      // Convert Firebase user to our User type and store in localStorage
      const userData = {
        id: firebaseUser.uid,
        name: name || 'User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || undefined,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Update state
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Google login
  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider();
      
      // Sign in with Google
      const result = await signInWithPopup(auth, provider);
      
      // Get the user from the credential
      const firebaseUser = result.user;
      
      let token = null;
      // Check if getIdToken method exists
      if (typeof firebaseUser.getIdToken === 'function') {
        // Get the ID token
        token = await firebaseUser.getIdToken(true);
        
        // Store token in multiple places for redundancy
        setCookie('firebase-auth-token', token, 30); // 30 days
        
        // Also store in localStorage and sessionStorage as a backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebase-auth-token', token);
          sessionStorage.setItem('firebase-auth-token', token);
          
          // Set a custom attribute on document for debugging
          try {
            (document as any).firebaseAuthToken = token.substring(0, 10) + '...';
          } catch (e) {
            console.warn('Could not set debug token attribute');
          }
        }
      } else {
        console.warn('getIdToken method not available on firebaseUser object');
      }
      
      // Convert Firebase user to our User type and store in localStorage
      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || undefined,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Update state
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Password reset
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    }
  }

  // Logout
  const logout = async () => {
    try {
      // Clear all auth cookies
      deleteCookie('firebase-auth-token');
      deleteCookie('is-admin'); // Also clear admin cookie if it exists
      
      // Clear all storage mechanisms
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('firebase-auth-token');
        
        // Clear sessionStorage
        sessionStorage.removeItem('firebase-auth-token');
        sessionStorage.removeItem('user');
        
        // Clear any custom attributes
        try {
          delete (document as any).firebaseAuthToken;
        } catch (e) {
          console.warn('Could not delete debug token attribute');
        }
        
        // Force a small delay to ensure all tokens are cleared
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Update state
      setUser(null);
      
      // Force a page reload to clear any in-memory state
      if (typeof window !== 'undefined') {
        window.location.href = '/login?logout=true';
      }
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
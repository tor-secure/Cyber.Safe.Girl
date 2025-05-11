"use client";

import { useEffect } from 'react';
import { useAuth } from './auth-context';
import { getCookie } from './cookies';
import { auth } from './firebase';
import { signInWithCustomToken, Auth } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

export function useAuthPersistence() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined') return;
    
    // Function to attempt session restoration
    const restoreSession = async () => {
      try {
        // Check multiple sources for authentication data
        const authCookie = getCookie('firebase-auth-token');
        const localStorageToken = localStorage.getItem('firebase-auth-token');
        const storedUserJson = localStorage.getItem('user');
        
        // If we have a token but no user in context, try to restore the session
        if (!isLoading && !user && (authCookie || localStorageToken) && storedUserJson) {
          console.log('Attempting to restore authentication session...');
          
          // Parse the stored user data
          const storedUser = JSON.parse(storedUserJson);
          
          // If Firebase auth is already initialized with a user, we don't need to do anything
          if (auth.currentUser) {
            console.log('Firebase auth already has a current user');
            
            // If we're on a public path that should redirect to dashboard when logged in
            const publicAuthPaths = ['/', '/homepage', '/login', '/register'];
            if (publicAuthPaths.includes(pathname)) {
              console.log('Redirecting from public path to dashboard');
              router.push('/dashboard');
            }
            return;
          }
          
          // If we don't have a current user but have a token, try to restore the session
          // without reloading the page
          if (localStorageToken && storedUser.email) {
            try {
              // We can't directly use the token to sign in, but we can trigger the auth state listener
              // by forcing a reload only if absolutely necessary
              console.log('Attempting to restore session without reload');
              
              // Set a flag to prevent infinite reload loops
              const lastReloadAttempt = localStorage.getItem('last-reload-attempt');
              const now = Date.now();
              
              if (!lastReloadAttempt || (now - parseInt(lastReloadAttempt)) > 10000) {
                localStorage.setItem('last-reload-attempt', now.toString());
                window.location.reload();
              } else {
                console.log('Skipping reload to prevent loop');
              }
            } catch (e) {
              console.error('Error during session restoration:', e);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore authentication state:', e);
      }
    };
    
    // Check if we're on a public path that should redirect when logged in
    const checkPathAndRedirect = () => {
      if (user && !isLoading) {
        const publicAuthPaths = ['/', '/homepage', '/login', '/register'];
        if (publicAuthPaths.includes(pathname)) {
          console.log('User is authenticated, redirecting from public path to dashboard');
          router.push('/dashboard');
        }
      }
    };
    
    // Run both checks
    if (!isLoading) {
      if (!user) {
        restoreSession();
      } else {
        checkPathAndRedirect();
      }
    }
  }, [user, isLoading, pathname, router]);
  
  return { user, isLoading };
}
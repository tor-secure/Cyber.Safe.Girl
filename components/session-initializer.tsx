"use client";

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, Auth } from 'firebase/auth';
import { setCookie, getCookie } from '@/lib/cookies';
import { usePathname, useRouter } from 'next/navigation';

export function SessionInitializer() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if we already have a token in localStorage but not in cookies
    const localToken = localStorage.getItem('firebase-auth-token');
    const cookieToken = getCookie('firebase-auth-token');
    const storedUserJson = localStorage.getItem('user');
    
    if (localToken && !cookieToken) {
      // If we have a token in localStorage but not in cookies, set the cookie
      setCookie('firebase-auth-token', localToken, 30);
      
      // If we're on a public path and have a stored user, we should redirect to dashboard
      if (storedUserJson) {
        const publicAuthPaths = ['/', '/homepage', '/login', '/register'];
        if (publicAuthPaths.includes(pathname)) {
          console.log('User has token in localStorage, redirecting from public path to dashboard');
          // Use a small timeout to ensure the cookie is set before redirecting
          setTimeout(() => {
            router.push('/dashboard');
          }, 100);
        }
      }
    }
    
    // Set up a listener for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // User is signed in, check if getIdToken method exists
          if (typeof user.getIdToken === 'function') {
            const token = await user.getIdToken(true);
            
            // Store the token in both cookie and localStorage
            setCookie('firebase-auth-token', token, 30);
            localStorage.setItem('firebase-auth-token', token);
            sessionStorage.setItem('firebase-auth-token', token);
            
            // Set a timestamp for when the token was last refreshed
            localStorage.setItem('token-refresh-time', Date.now().toString());
          } else {
            console.warn('getIdToken method not available on user object');
          }
          
          // Store user data in localStorage
          const userData = {
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            avatar: user.photoURL || undefined,
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          
          // If we're on a public path, redirect to dashboard
          const publicAuthPaths = ['/', '/homepage', '/login', '/register'];
          if (publicAuthPaths.includes(pathname)) {
            console.log('User is authenticated, redirecting from public path to dashboard');
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      } else {
        // If user is not authenticated but we have tokens in storage,
        // this might be a case where Firebase auth state is not synced with our storage
        const localToken = localStorage.getItem('firebase-auth-token');
        const cookieToken = getCookie('firebase-auth-token');
        
        if (localToken || cookieToken) {
          console.log('Firebase reports no user but we have tokens - potential sync issue');
          
          // Check when we last attempted a reload to prevent loops
          const lastReloadAttempt = localStorage.getItem('last-reload-attempt');
          const now = Date.now();
          
          if (!lastReloadAttempt || (now - parseInt(lastReloadAttempt)) > 10000) {
            localStorage.setItem('last-reload-attempt', now.toString());
            // Only reload if we're not on a public path to prevent redirect loops
            const publicAuthPaths = ['/', '/homepage', '/login', '/register'];
            if (!publicAuthPaths.includes(pathname)) {
              console.log('Attempting to restore session with reload');
              window.location.reload();
            }
          }
        }
      }
    });
    
    // Clean up the listener
    return () => unsubscribe();
  }, [pathname, router]);
  
  // This component doesn't render anything
  return null;
}
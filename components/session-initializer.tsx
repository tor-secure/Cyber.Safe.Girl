"use client";

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, Auth } from 'firebase/auth';
import { setCookie, getCookie } from '@/lib/cookies';

export function SessionInitializer() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if we already have a token in localStorage but not in cookies
    const localToken = localStorage.getItem('firebase-auth-token');
    const cookieToken = getCookie('firebase-auth-token');
    
    if (localToken && !cookieToken) {
      // If we have a token in localStorage but not in cookies, set the cookie
      setCookie('firebase-auth-token', localToken, 30);
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
          } else {
            console.warn('getIdToken method not available on user object');
          }
          
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify({
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            avatar: user.photoURL || undefined,
          }));
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
    });
    
    // Clean up the listener
    return () => unsubscribe();
  }, []);
  
  // This component doesn't render anything
  return null;
}
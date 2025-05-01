"use client";

import { useEffect } from 'react';
import { useAuth } from './auth-context';
import { getCookie } from './cookies';
import { auth } from './firebase';
import { signInWithCustomToken } from 'firebase/auth';

export function useAuthPersistence() {
  const { user, isLoading } = useAuth();
  
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
            return;
          }
          
          // If we don't have a current user but have a token, force a reload
          // This will trigger the Firebase auth state listener to re-authenticate
          window.location.reload();
        }
      } catch (e) {
        console.error('Failed to restore authentication state:', e);
      }
    };
    
    // Only attempt to restore session if we're not already loading and don't have a user
    if (!isLoading && !user) {
      restoreSession();
    }
  }, [user, isLoading]);
  
  return { user, isLoading };
}
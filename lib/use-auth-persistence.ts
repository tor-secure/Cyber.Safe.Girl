"use client";

import { useEffect } from 'react';
import { useAuth } from './auth-context';
import { getCookie } from './cookies';

export function useAuthPersistence() {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // Check if we have a token in cookies but no user in context
    const authCookie = getCookie('firebase-auth-token');
    const storedUser = localStorage.getItem('user');
    
    if (!isLoading && !user && authCookie && storedUser) {
      // If we have a token but no user, try to restore from localStorage
      try {
        // This will trigger a page reload to restore the session
        window.location.reload();
      } catch (e) {
        console.error('Failed to restore authentication state', e);
      }
    }
  }, [user, isLoading]);
  
  return { user, isLoading };
}
"use client";

import { useAuthPersistence } from "@/lib/use-auth-persistence";

export function AuthPersistence() {
  // This component doesn't render anything visible
  // It just uses the hook to maintain authentication state
  useAuthPersistence();
  
  return null;
}
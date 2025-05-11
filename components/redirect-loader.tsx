"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface RedirectLoaderProps {
  redirectTo: string
  message?: string
  delay?: number
}

export function RedirectLoader({ 
  redirectTo, 
  message = "Redirecting you to the right place...", 
  delay = 100 
}: RedirectLoaderProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRedirecting(true)
      window.location.href = redirectTo
    }, delay)

    return () => clearTimeout(timer)
  }, [redirectTo, delay])

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card shadow-lg border border-border">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-center">{message}</p>
        <p className="text-sm text-muted-foreground">
          {isRedirecting ? "Redirecting..." : "Preparing..."}
        </p>
      </div>
    </div>
  )
}
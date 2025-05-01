"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChapterContent } from "@/components/chapter-content"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { use } from "react"

export default function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Unwrap the params promise
  const { id } = use(params)

  useEffect(() => {
    setIsClient(true)

    // If authentication check is complete and user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking authentication or until client-side hydration
  if (isLoading || !isClient) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Only render content if authenticated
  if (!isAuthenticated) {
    return null // Will redirect in the useEffect
  }

  return <ChapterContent chapterId={id} />
}

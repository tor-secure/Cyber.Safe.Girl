"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { UserAccountNav } from "@/components/user-account-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield } from "lucide-react"
import Link from "next/link"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!isLoading && !user) {
  //     router.push("/login")
  //   }
  // }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-rose-600 text-white rounded-md p-1">
              <Shield className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl">Cyber Safe Girl</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserAccountNav />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

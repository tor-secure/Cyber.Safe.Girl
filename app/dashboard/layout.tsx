"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { BookOpen, Home, X, Info, FileQuestion, Award, Lock } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAccountNav } from "@/components/user-account-nav"
import { useAuth } from "@/lib/auth-context"
import { useProgress } from "@/lib/progress-context"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // // Redirect to login if not authenticated
    // useEffect(() => {
    //   if (!isAuthenticated && pathname !== "/login") {
    //     router.push("/login")
    //   }
    // }, [isAuthenticated, pathname, router])

  // Use the progress context instead of local state
  const { chapters, finalTestUnlocked, certificateUnlocked, isLoading } = useProgress()

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <Sidebar className="border-r z-30">
          <SidebarHeader className="flex items-center justify-between px-4 py-2 border-b">
            
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link href="/dashboard">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/introduction"}>
                  <Link href="/introduction">
                    <Info className="h-5 w-5" />
                    <span>Introduction</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {chapters.map((chapter) => (
                <SidebarMenuItem key={chapter.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/chapters/${chapter.id}`}
                    className={chapter.locked ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    {chapter.locked ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          <span>Chapter {chapter.id}</span>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/chapters/${chapter.id}`} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          <span>Chapter {chapter.id}</span>
                        </div>
                        {chapter.completed && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
                          >
                            ✓
                          </Badge>
                        )}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/final-test"}
                  className={!finalTestUnlocked ? "opacity-60 cursor-not-allowed" : ""}
                >
                  {!finalTestUnlocked ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5" />
                        <span>Final Test</span>
                      </div>
                      <Lock className="h-4 w-4" />
                    </div>
                  ) : (
                    <Link href="/final-test" className="flex items-center gap-2">
                      <FileQuestion className="h-5 w-5" />
                      <span>Final Test</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/certificate"}
                  className={!certificateUnlocked ? "opacity-60 cursor-not-allowed" : ""}
                >
                  {!certificateUnlocked ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        <span>Certificate</span>
                      </div>
                      <Lock className="h-4 w-4" />
                    </div>
                  ) : (
                    <Link href="/certificate" className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      <span>Certificate</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background sticky top-0 z-20">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                <h1 className="font-semibold text-lg hidden md:block">Cyber Safe Girl</h1>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Info className="h-4 w-4 mr-2" />
                  About
                </Button>
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Guidelines
                </Button>
                <ThemeToggle />
                <UserAccountNav />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}

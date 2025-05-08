"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AdminAuthProvider } from "@/lib/admin-auth"
import { Users, Award, Settings, LayoutDashboard, Tag, LogOut, Menu, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/admin/login")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      current: pathname === "/admin",
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
      current: pathname === "/admin/users",
    },
    {
      name: "Coupon Management",
      href: "/admin/dashboard",
      icon: Tag,
      current: pathname === "/admin/dashboard" || pathname === "/admin/coupons",
    },
    {
      name: "Certificate Management",
      href: "/admin/certificates",
      icon: Award,
      current: pathname === "/admin/certificates",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: pathname === "/admin/settings",
    },
  ]

  // If we're on the login page, don't show the admin layout
  if (pathname === "/admin/login") {
    return <AdminAuthProvider>{children}</AdminAuthProvider>
  }

  return (
    <AdminAuthProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <Link href="/" className="flex items-center">
                  <span className="sr-only">Cyber Safe Girl</span>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    CSG
                  </div>
                  <span className="ml-2 text-xl font-semibold">Admin</span>
                </Link>
              </div>
              <Separator className="my-4" />
              <ScrollArea className="flex-1 px-3">
                <nav className="flex-1 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        item.current
                          ? "bg-primary/10 text-primary"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      )}
                    >
                      <item.icon
                        className={cn(
                          item.current
                            ? "text-primary"
                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
                          "mr-3 h-5 w-5 flex-shrink-0",
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </ScrollArea>
            </div>
            <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center">
                <div>
                  {isClient && user ? (
                    <>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                        {user.email}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-950">
              <div className="flex items-center justify-between px-4 pt-5 pb-2">
                <Link href="/" className="flex items-center" onClick={() => setIsMobileOpen(false)}>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    CSG
                  </div>
                  <span className="ml-2 text-xl font-semibold">Admin</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </div>
              <Separator className="my-2" />
              <ScrollArea className="flex-1 px-3 py-2">
                <nav className="flex-1 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        item.current
                          ? "bg-primary/10 text-primary"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          item.current
                            ? "text-primary"
                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
                          "mr-3 h-5 w-5 flex-shrink-0",
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    </Link>
                  ))}
                </nav>
              </ScrollArea>
              <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center">
                  <div>
                    {isClient && user ? (
                      <>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                          {user.email}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsMobileOpen(false)
                            handleLogout()
                          }}
                          className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 focus:outline-none">
            <div className="py-6">
              <div className="mx-auto px-4 sm:px-6 md:px-8">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </AdminAuthProvider>
  )
}

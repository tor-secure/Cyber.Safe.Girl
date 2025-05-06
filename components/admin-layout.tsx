"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileQuestion, 
  Settings, 
  LogOut,
  Award,
  Menu,
  X
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
        name: "Coupons",
        href: "/admin/dashboard",
        icon: <Users className="h-5 w-5" />,
      },
    // {
    //   name: "Users",
    //   href: "/admin/users",
    //   icon: <Users className="h-5 w-5" />,
    // },
    // {
    //   name: "Chapters",
    //   href: "/admin/chapters",
    //   icon: <BookOpen className="h-5 w-5" />,
    // },
    // {
    //   name: "Quizzes",
    //   href: "/admin/quizzes",
    //   icon: <FileQuestion className="h-5 w-5" />,
    // },
    {
      name: "Certificates",
      href: "/admin/certificates",
      icon: <Award className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <Link href="/admin" className="flex items-center">
          <h1 className="text-xl font-bold">CSG Admin</h1>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background pt-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-3 rounded-md ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
            <Link
              href="/admin/logout"
              className="flex items-center p-3 rounded-md text-destructive hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </Link>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r h-screen sticky top-0">
          <div className="p-6 border-b">
            <Link href="/admin" className="flex items-center">
              <h1 className="text-xl font-bold">CSG Admin</h1>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-3 rounded-md ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Link
              href="/admin/logout"
              className="flex items-center p-3 rounded-md text-destructive hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
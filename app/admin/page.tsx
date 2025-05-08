"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, Award, Settings, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  completedUsers: number
  totalCertificates: number
  validCertificates: number
  revokedCertificates: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedUsers: 0,
    totalCertificates: 0,
    validCertificates: 0,
    revokedCertificates: 0,
  })

  useEffect(() => {
    async function fetchDashboardStats() {
      setLoading(true)
      try {
        // Get the auth token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('firebase-auth-token') : null;
        const headers: HeadersInit = token ? {
          'Authorization': `Bearer ${token}`,
          'x-firebase-auth-token': token
        } : { 'Content-Type': 'application/json' };

        // Fetch certificate stats
        const certificatesResponse = await fetch("/api/admin/certificates", {
          headers
        });

        if (!certificatesResponse.ok) {
          if (certificatesResponse.status === 401) {
            router.push("/admin/login")
            return
          }
          throw new Error(`HTTP error! status: ${certificatesResponse.status}`)
        }

        const certificatesData = await certificatesResponse.json()
        const certificates = certificatesData.certificates || []

        // Calculate certificate stats
        const totalCertificates = certificates.length
        const validCertificates = certificates.filter((cert: any) => cert.isValid).length
        const revokedCertificates = totalCertificates - validCertificates

        // Fetch user stats
        const usersResponse = await fetch("/api/admin/users", {
          headers
        });
        
        if (!usersResponse.ok) {
          console.error(`Error fetching users: ${usersResponse.status}`);
          throw new Error(`HTTP error when fetching users! status: ${usersResponse.status}`)
        }
        
        const usersData = await usersResponse.json()
        const users = usersData.users || []
        
        console.log("Fetched users:", users);
        
        // Calculate user stats
        const totalUsers = users.length
        const activeUsers = users.filter((user: any) => user.status === "active").length
        
        // Fetch user progress to determine completed users
        const progressResponse = await fetch("/api/admin/user-progress", {
          headers
        });
        
        let completedUsers = 0;
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          const progress = progressData.progress || [];
          
          // Count users who have completed at least 10 chapters
          completedUsers = progress.filter((p: any) => 
            p.completedChapters && p.completedChapters.length >= 10
          ).length;
        } else {
          // Fallback: estimate completed users from certificates
          completedUsers = certificates.filter((cert: any) => cert.isValid)
            .map((cert: any) => cert.userId)
            .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i) // unique user IDs
            .length;
        }

        setStats({
          totalUsers,
          activeUsers,
          completedUsers,
          totalCertificates,
          validCertificates,
          revokedCertificates,
        })

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  const adminModules = [
    {
      title: "User Management",
      description: "Manage users, view progress, and handle access",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/admin/users",
      badge: stats.totalUsers > 0 ? `${stats.totalUsers} users` : undefined,
    },
    {
      title: "Coupon Management",
      description: "Manage coupon codes and discounts",
      icon: <Tag className="h-8 w-8 text-primary" />,
      href: "/admin/dashboard",
    },
    {
      title: "Certificate Management",
      description: "Manage and verify user certificates",
      icon: <Award className="h-8 w-8 text-primary" />,
      href: "/admin/certificates",
      badge: stats.totalCertificates > 0 ? `${stats.totalCertificates} certificates` : undefined,
    },
    {
      title: "Settings",
      description: "Configure application settings",
      icon: <Settings className="h-8 w-8 text-primary" />,
      href: "/admin/settings",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to the Cyber Safe Girl admin panel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">View Main Site</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/dashboard">Generate Coupons</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700 dark:text-blue-300">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.totalUsers}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              <Link href="/admin/users">View All Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700 dark:text-green-300">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-800 dark:text-green-200">{stats.activeUsers}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
            >
              <Link href="/admin/users?filter=active">View Active Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-700 dark:text-purple-300">Completed Course</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{stats.completedUsers}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800"
            >
              <Link href="/admin/users?filter=completed">View Completed Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-700 dark:text-amber-300">Total Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-800 dark:text-amber-200">{stats.totalCertificates}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800"
            >
              <Link href="/admin/certificates">View All Certificates</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-6" />

      <div>
        <h2 className="text-2xl font-bold mb-6">Admin Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((module) => (
            <Card key={module.href} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  {module.icon}
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    {module.badge && (
                      <Badge variant="secondary" className="mt-1">
                        {module.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="mt-2">{module.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={module.href}>Access Module</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" asChild>
            <Link href="/admin/dashboard">
              <Tag className="h-6 w-6" />
              <span>Generate Coupon</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" asChild>
            <Link href="/admin/users">
              <Users className="h-6 w-6" />
              <span>View Users</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" asChild>
            <Link href="/admin/certificates">
              <Award className="h-6 w-6" />
              <span>Manage Certificates</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" asChild>
            <Link href="/admin/settings">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
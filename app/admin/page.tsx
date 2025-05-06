"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Users, BookOpen, FileQuestion, Award, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import Link from "next/link"

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
        // Fetch certificate stats
        const certificatesResponse = await fetch("/api/admin/certificates")
        
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
        
        // For user stats, we would fetch from a users API
        // For now, we'll use the certificate data to estimate
        const uniqueUsers = new Set(certificates.map((cert: any) => cert.userId)).size
        
        setStats({
          totalUsers: uniqueUsers * 3, // Estimate total users as 3x certificate holders
          activeUsers: uniqueUsers * 2, // Estimate active users as 2x certificate holders
          completedUsers: uniqueUsers,  // Users with certificates have completed the course
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
    },
        {
      title: "Coupon Management",
      description: "Manage Coupon codes and discounts",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/admin/dashboard",
    },
    // {
    //   title: "Chapter Management",
    //   description: "Manage course chapters and content",
    //   icon: <BookOpen className="h-8 w-8 text-primary" />,
    //   href: "/admin/chapters",
    // },
    // {
    //   title: "Quiz Management",
    //   description: "Manage quizzes, questions, and answers",
    //   icon: <FileQuestion className="h-8 w-8 text-primary" />,
    //   href: "/admin/quizzes",
    // },
    {
      title: "Certificate Management",
      description: "Manage and verify user certificates",
      icon: <Award className="h-8 w-8 text-primary" />,
      href: "/admin/certificates",
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users">View All Users</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.activeUsers}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users?filter=active">View Active Users</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Completed Course</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.completedUsers}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users?filter=completed">View Completed Users</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCertificates}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/certificates">View All Certificates</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Valid Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.validCertificates}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/certificates?filter=valid">View Valid Certificates</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Revoked Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.revokedCertificates}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/certificates?filter=revoked">View Revoked Certificates</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mt-8">Admin Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((module) => (
            <Card key={module.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  {module.icon}
                  <CardTitle>{module.title}</CardTitle>
                </div>
                <CardDescription>{module.description}</CardDescription>
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
    </AdminLayout>
  )
}
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
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false)

  // Redirect to login if not authenticated
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
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
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
                {/* <Button variant="outline" size="sm" className="hidden md:flex">
                  <Info className="h-4 w-4 mr-2" />
                  About
                </Button> */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:flex"
                  onClick={() => setIsGuidelinesOpen(true)}
                >
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Guidelines
                </Button>
                <ThemeToggle />
                <UserAccountNav />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>

          {/* Guidelines Modal */}
          {isGuidelinesOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-3xl w-full relative overflow-y-auto max-h-[90vh] scrollbar-hide border border-white">
                <button
                  onClick={() => setIsGuidelinesOpen(false)}
                  className="absolute top-2 right-3 text-xl font-bold text-gray-500 hover:text-red-500"
                >
                  &times;
                </button>
                <h2 className="text-xl font-semibold mb-4">Guidelines</h2>
                <ul className="list-decimal pl-5 space-y-2 text-sm md:text-base text-gray-800 dark:text-gray-200">
                  <li>Visit the official website: <a href="https://www.cybersafegirl.com" target="_blank" className="text-blue-600 hover:text-blue-800 underline">www.cybersafegirl.com</a>.</li>
                  <li>You will be presented with two primary options: <strong>Download eBook</strong> and <strong>Get Certified</strong>.</li>
                  <li>Begin by selecting <strong>Download eBook</strong>. You can access the latest edition of <strong>#CyberSafeGirl</strong> in English, Kannada, or Gujarati.</li>
                  <li>Thoroughly review the eBook, which includes engaging infotoons, comprehensive chapters, insightful bonus tips, a glossary of key terms, and more.</li>
                  <li>Next, click on <strong>Get Certification</strong> and sign in using your Gmail account.</li>
                  <li>You will be prompted to create a new user account. The Gmail credentials used during registration will serve as your permanent login information for future access.</li>
                  <li>Ensure the pop-up window remains open throughout the authentication process to avoid disruption.</li>
                  <li>Upon successful login, you will be directed to the eLearning program dashboard.</li>
                  <li>The course consists of <strong>70 structured modules</strong>.</li>
                  <li>Each module features an introductory overview, a lecture video by Dr. Ananth Prabhu G., animated infotoons, supplementary video content, downloadable PowerPoint presentations, and a module-specific assessment.</li>
                  <li>Progression to subsequent modules is contingent upon successfully passing the test associated with the current module.</li>
                  <li>After completing all 70 modules, you will be eligible to attempt the <strong>Grand Certification Test</strong>.</li>
                  <li>If you possess a pre-paid voucher, you may input the voucher code to access the test. Otherwise, a certification fee of ₹999/- is applicable. If you have a coupon code, apply it to avail the corresponding discount.</li>
                  <li>The Grand Test consists of questions derived from all 70 modules and serves as a comprehensive evaluation.</li>
                  <li>You are permitted <strong>two attempts</strong> to clear the test. Should both attempts be unsuccessful, you must re-register to proceed.</li>
                  <li>Upon successful completion, you will be awarded the <strong>"I Am Cyber Safe"</strong> certificate, which will feature your name and achieved grade. Please note: name alterations are not permitted after certification issuance.</li>
                  <li>The certification examination comprises <strong>50 objective questions</strong>. A minimum of <strong>18 correct responses</strong> is required to pass. There is <strong>no negative marking</strong>.<br />
                    <div className="mt-2 ml-4">
                      <ul className="space-y-1">
                        {[
                          ["30-40", "Grade E"],
                          ["41-45", "Grade D"],
                          ["46-50", "Grade C"],
                          ["51-55", "Grade B"],
                          ["56-60", "Grade A"],
                        ].map(([range, grade]) => (
                          <li key={range} className="flex justify-start gap-6 font-mono">
                            <span className="w-20">{range}</span>
                            <span>{grade}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                  {/* <li>Certificates are blockchain-verified, ensuring authenticity and immunity to forgery or unauthorized alterations.</li> */}
                  <li>To validate your certification, visit <a href="https://www.cybersafegirl.com" target="_blank" className="text-blue-600 hover:text-blue-800 underline">www.cybersafegirl.com</a>, navigate to the <strong>Verify Certificate</strong> section, and enter your certificate number.</li>
                  <li>This initiative aims to empower internet users with critical cybersecurity knowledge, foster responsible digital behavior, and raise awareness about the threats present in the digital ecosystem.</li>
                  <li>For any queries or support-related assistance, please contact: <a href="mailto:support@cybersafegirl.com" className="text-blue-600 hover:text-blue-800 underline">support@cybersafegirl.com</a></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-scrollbar: none;
          
          /* Hide scrollbar for IE, Edge and Firefox */
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, BookOpen, CheckCircle, Clock, Lock, Loader2, Trophy, BarChart3, PieChart, GraduationCap } from 'lucide-react'
import Link from "next/link"
import { ChapterGrid } from "@/components/chapter-grid"
import { ProgressChart } from "@/components/progress-chart"
import { PerformanceChart } from "@/components/performance-chart"
import { useAuth } from "@/lib/auth-context"
import { Separator } from "@/components/ui/separator"

interface QuizAnalytics {
  id: string
  chapterId: string
  score: number
  totalQuestionsAttempted: number
  submittedAt: string
}

interface UserProgress {
  userId: string
  completedChapters: string[]
  unlockedChapters: string[]
  finalTestUnlocked: boolean
  finalTestCompleted: boolean
  certificateUnlocked: boolean
  lastUpdated: string
  finalTestScore?: number
  finalTestTotalQuestions?: number
  chapterQuizScores?: Record<string, { score: number; totalQuestions: number }>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [totalChapters] = useState(70)
  const [finalTestScore, setFinalTestScore] = useState(0)
  const [totalTestQuestions, setTotalTestQuestions] = useState(0)
  const [passingScore, setPassingScore] = useState(0) // Will be calculated as 30% of total questions
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalQuizScore, setTotalQuizScore] = useState(0)
  const [totalQuizQuestions, setTotalQuizQuestions] = useState(0)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [completedChaptersCount, setCompletedChaptersCount] = useState(0)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch user progress
  useEffect(() => {
    async function fetchUserProgress() {
      if (!user) return

      try {
        const response = await fetch(`/api/user-progress?userId=${user.id}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setUserProgress(data.progress)
        setCompletedChaptersCount(data.progress.completedChapters.length)

        // Set final test score and total questions if available
        if (data.progress.finalTestScore !== undefined && data.progress.finalTestTotalQuestions !== undefined) {
          setFinalTestScore(data.progress.finalTestScore)
          setTotalTestQuestions(data.progress.finalTestTotalQuestions)

          // Calculate passing score (30% of total questions)
          const calculatedPassingScore = Math.ceil(data.progress.finalTestTotalQuestions * 0.3)
          setPassingScore(calculatedPassingScore)

          console.log("Final test score from progress:", data.progress.finalTestScore)
          console.log("Total questions from progress:", data.progress.finalTestTotalQuestions)
          console.log("Calculated passing score:", calculatedPassingScore)
        } else if (data.progress.finalTestCompleted) {
          // If final test is completed but no score is available, try to fetch from analytics
          try {
            const analyticsResponse = await fetch(`/api/final-test-analytics?userId=${user.id}`)
            if (analyticsResponse.ok) {
              const analyticsData = await analyticsResponse.json()
              if (analyticsData.finalTestAnalytics && analyticsData.finalTestAnalytics.length > 0) {
                const latestResult = analyticsData.finalTestAnalytics[0]
                setFinalTestScore(latestResult.score)
                setTotalTestQuestions(latestResult.totalQuestionsAttempted)

                // Calculate passing score (30% of total questions)
                const calculatedPassingScore = Math.ceil(latestResult.totalQuestionsAttempted * 0.3)
                setPassingScore(calculatedPassingScore)

                console.log("Final test score from analytics:", latestResult.score)
                console.log("Total questions from analytics:", latestResult.totalQuestionsAttempted)
              } else {
                // Default values if no analytics found
                setFinalTestScore(data.progress.certificateUnlocked ? 20 : 6)
                setTotalTestQuestions(30)
                setPassingScore(9) // 30% of 30
              }
            }
          } catch (analyticsErr) {
            console.error("Failed to fetch final test analytics:", analyticsErr)
            // Use default values
            setFinalTestScore(data.progress.certificateUnlocked ? 20 : 6)
            setTotalTestQuestions(30)
            setPassingScore(9) // 30% of 30
          }
        } else {
          // Default values if final test not completed
          setTotalTestQuestions(30)
          setPassingScore(9) // 30% of 30
        }
      } catch (err: any) {
        console.error("Failed to fetch user progress:", err)
        // Don't set error here as we'll still try to fetch quiz analytics
      }
    }

    fetchUserProgress()
  }, [user])

  // Fetch quiz analytics for the user
  useEffect(() => {
    async function fetchQuizAnalytics() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/quiz-analytics?userId=${user.id}`)

        if (!response.ok) {
          // Handle non-JSON responses (like HTML error pages)
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
          } else {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
        }

        const data = await response.json()

        if (!data.quizAnalytics || data.quizAnalytics.length === 0) {
          // No quiz data yet
          setQuizAnalytics([])
          setTotalQuizScore(0)
          setTotalQuizQuestions(0)
        } else {
          // Process the analytics data
          // Group by chapter and take the latest attempt for each chapter
          const chapterMap = new Map<string, QuizAnalytics>()

          data.quizAnalytics.forEach((analytics: QuizAnalytics) => {
            const existingAnalytics = chapterMap.get(analytics.chapterId)

            if (!existingAnalytics || new Date(analytics.submittedAt) > new Date(existingAnalytics.submittedAt)) {
              chapterMap.set(analytics.chapterId, analytics)
            }
          })

          // Calculate total score and questions
          let totalScore = 0
          let totalQuestions = 0

          chapterMap.forEach((analytics) => {
            totalScore += analytics.score
            totalQuestions += analytics.totalQuestionsAttempted
          })

          setQuizAnalytics(Array.from(chapterMap.values()))
          setTotalQuizScore(totalScore)
          setTotalQuizQuestions(totalQuestions)
        }
      } catch (err: any) {
        console.error("Failed to fetch quiz analytics:", err)
        setError(err.message || "Failed to load quiz analytics")
      } finally {
        setLoading(false)
      }
    }

    fetchQuizAnalytics()
  }, [user])

  const progressPercentage = Math.round((completedChaptersCount / totalChapters) * 100)
  const isPassing = finalTestScore >= passingScore
  const allChaptersCompleted = userProgress?.finalTestUnlocked || false
  const quizScorePercentage = totalQuizQuestions > 0 ? Math.round((totalQuizScore / totalQuizQuestions) * 100) : 0

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Track your progress in the Cyber Safe Girl course
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* First row - Course Progress and Final Test */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center">
                <div className="relative w-28 sm:w-32 h-28 sm:h-32 flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-2xl sm:text-3xl font-bold">{progressPercentage}%</span>
                      <p className="text-xs text-muted-foreground mt-1">Complete</p>
                    </div>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-primary stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${progressPercentage * 2.51} 251`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium">
                        {completedChaptersCount} of {totalChapters} chapters completed
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 sm:p-2 rounded-full">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium">Completed</p>
                          <p className="text-xl sm:text-2xl font-bold">{completedChaptersCount}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 sm:p-2 rounded-full">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium">Pending</p>
                          <p className="text-xl sm:text-2xl font-bold">{totalChapters - completedChaptersCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Final Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userProgress?.finalTestCompleted ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative w-20 sm:w-24 h-20 sm:h-24">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-xl sm:text-2xl font-bold">{finalTestScore}</span>
                          <p className="text-xs text-muted-foreground">/{totalTestQuestions}</p>
                        </div>
                      </div>
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          className="text-muted stroke-current"
                          strokeWidth="10"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          className="text-primary stroke-current"
                          strokeWidth="10"
                          strokeLinecap="round"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                          strokeDasharray={`${(finalTestScore / totalTestQuestions) * 251} 251`}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                    </div>
                  </div>

                  {!isPassing && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Not Passed</AlertTitle>
                      <AlertDescription className="text-xs sm:text-sm">
                        Your score is below the passing threshold of {passingScore} points.
                      </AlertDescription>
                    </Alert>
                  )}

                  {userProgress.certificateUnlocked ? (
                    <Button asChild className="w-full text-xs sm:text-sm">
                      <Link href="/certificate" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        View Certificate
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full text-xs sm:text-sm">
                      <Link href="/final-test">Retake Final Test</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center py-3 sm:py-4">
                    <div className="bg-muted/50 rounded-full p-4 sm:p-6">
                      <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="text-center space-y-1 sm:space-y-2">
                    <p className="font-medium text-sm sm:text-base">Final Test Not Taken</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Complete all chapters to unlock the final test
                    </p>
                  </div>
                  {!allChaptersCompleted ? (
                    <Button disabled className="w-full flex items-center gap-2 text-xs sm:text-sm">
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                      Complete All Chapters First
                    </Button>
                  ) : (
                    <Button asChild className="w-full text-xs sm:text-sm">
                      <Link href="/final-test">Take Final Test</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second row - Quiz Performance and Course Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Quiz Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary mr-2" />
                  <p className="text-sm sm:text-base">Loading quiz data...</p>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                </Alert>
              ) : quizAnalytics.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="bg-muted/50 rounded-full p-3 sm:p-4">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm">No quiz data available yet. Complete some chapter quizzes to see your performance.</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Overall Score</p>
                      <p className="text-2xl sm:text-3xl font-bold">{quizScorePercentage}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalQuizScore}/{totalQuizQuestions} points
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Chapters Attempted</p>
                      <p className="text-2xl sm:text-3xl font-bold">{quizAnalytics.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        of {totalChapters} total
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Average Score</p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {quizAnalytics.length > 0
                          ? (totalQuizScore / quizAnalytics.length).toFixed(1)
                          : 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        points per chapter
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-medium mb-2">Performance by Chapter</h3>
                    <div className="h-[180px] sm:h-[200px]">
                      <PerformanceChart />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Course Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] sm:h-[200px]">
                <ProgressChart completed={completedChaptersCount} total={totalChapters} />
              </div>
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                  <span className="text-xs sm:text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                  <span className="text-xs sm:text-sm">Pending</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chapters Section */}
        <div className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Course Chapters</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Complete all {totalChapters} chapters to unlock the final test</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 sm:pt-6">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0">
                  <ChapterGrid filter="all" />
                </TabsContent>
                <TabsContent value="completed" className="mt-0">
                  <ChapterGrid filter="completed" />
                </TabsContent>
                <TabsContent value="pending" className="mt-0">
                  <ChapterGrid filter="pending" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

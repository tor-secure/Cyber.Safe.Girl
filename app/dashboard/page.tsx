"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Clock, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { ChapterGrid } from "@/components/chapter-grid"
import { ProgressChart } from "@/components/progress-chart"
import { PerformanceChart } from "@/components/performance-chart"
import { useAuth } from "@/lib/auth-context"

interface QuizAnalytics {
  id: string;
  chapterId: string;
  score: number;
  totalQuestionsAttempted: number;
  submittedAt: string;
}

export default function Dashboard() {
  const { user } = useAuth()
  const [progress] = useState(5)
  const [totalChapters] = useState(60)
  const [finalTestScore] = useState(6)
  const [totalTestQuestions] = useState(30)
  const [passingScore] = useState(12)
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalQuizScore, setTotalQuizScore] = useState(0)
  const [totalQuizQuestions, setTotalQuizQuestions] = useState(0)

  // Fetch quiz analytics for the user
  useEffect(() => {
    async function fetchQuizAnalytics() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/quiz-analytics?userId=${user.id}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
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

  const progressPercentage = Math.round((progress / totalChapters) * 100)
  const isPassing = finalTestScore >= passingScore
  const allChaptersCompleted = progress === totalChapters

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Course Progress</CardTitle>
              <CardDescription>Track your progress through the Cyber Safe Girl course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {progress} of {totalChapters} chapters completed
                  </span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Completed: {progress}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Pending: {totalChapters - progress}</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quiz Performance</CardTitle>
              <CardDescription>Your overall performance in chapter quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : quizAnalytics.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No quiz data available yet. Complete some chapter quizzes to see your performance.
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800">
                    <span className="text-2xl font-bold">
                      {totalQuizScore}/{totalQuizQuestions}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Score Percentage:</span>
                        <span className="font-medium">
                          {totalQuizQuestions > 0 
                            ? Math.round((totalQuizScore / totalQuizQuestions) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Chapters Attempted:</span>
                        <span className="font-medium">{quizAnalytics.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average Score:</span>
                        <span className="font-medium">
                          {quizAnalytics.length > 0 
                            ? (totalQuizScore / quizAnalytics.length).toFixed(1) 
                            : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Final Test Score</CardTitle>
              <CardDescription>Your performance on the final assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className="text-2xl font-bold">
                    {finalTestScore}/{totalTestQuestions}
                  </span>
                </div>
                <div className="flex-1">
                  {!isPassing && (
                    <Alert variant="destructive" className="mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        Your score is below the passing threshold of {passingScore} points.
                      </AlertDescription>
                    </Alert>
                  )}
                  {!allChaptersCompleted ? (
                    <Button disabled className="w-full flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Complete All Chapters First
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/final-test">Take Final Test</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Visual representation of your course progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Course Status</h3>
                <ProgressChart completed={progress} total={totalChapters} />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Chapter Performance</h3>
                <PerformanceChart />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Chapters</CardTitle>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>Complete all {totalChapters} chapters to receive your certificate</CardDescription>
        </CardHeader>
        <CardContent>
          <ChapterGrid />
        </CardContent>
      </Card>
    </div>
  )
}

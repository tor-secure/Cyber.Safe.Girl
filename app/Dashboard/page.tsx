"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Clock, Lock } from "lucide-react"
import Link from "next/link"
import { ChapterGrid } from "@/components/chapter-grid"
import { ProgressChart } from "@/components/progress-chart"
import { PerformanceChart } from "@/components/performance-chart"

export default function Dashboard() {
  const [progress] = useState(5)
  const [totalChapters] = useState(60)
  const [finalTestScore] = useState(6)
  const [totalTestQuestions] = useState(30)
  const [passingScore] = useState(12)

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

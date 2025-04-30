"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuizAnalytics {
  id: string;
  chapterId: string;
  score: number;
  totalQuestionsAttempted: number;
  submittedAt: string;
}

export function PerformanceChart() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizData, setQuizData] = useState<{ chapter: string; score: number }[]>([])

  useEffect(() => {
    async function fetchQuizAnalytics() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/quiz-analytics?userId=${user.id}`)
        
        if (!response.ok) {
          // Handle non-JSON responses (like HTML error pages)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        
        const data = await response.json()
        
        if (!data.quizAnalytics || data.quizAnalytics.length === 0) {
          // No quiz data yet
          setQuizData([])
        } else {
          // Process the analytics data for the chart
          // Group by chapter and take the latest attempt for each chapter
          const chapterMap = new Map<string, QuizAnalytics>()
          
          data.quizAnalytics.forEach((analytics: QuizAnalytics) => {
            const existingAnalytics = chapterMap.get(analytics.chapterId)
            
            if (!existingAnalytics || new Date(analytics.submittedAt) > new Date(existingAnalytics.submittedAt)) {
              chapterMap.set(analytics.chapterId, analytics)
            }
          })
          
          // Convert to chart data format
          const chartData = Array.from(chapterMap.entries()).map(([chapterId, analytics]) => ({
            chapter: `Ch ${chapterId.replace('CH-', '')}`,
            score: analytics.score,
            total: analytics.totalQuestionsAttempted
          }))
          
          // Sort by chapter number
          chartData.sort((a, b) => {
            const aNum = parseInt(a.chapter.replace('Ch ', ''))
            const bNum = parseInt(b.chapter.replace('Ch ', ''))
            return aNum - bNum
          })
          
          setQuizData(chartData)
        }
      } catch (err: any) {
        console.error("Failed to fetch quiz analytics:", err)
        setError(err.message || "Failed to load quiz analytics")
        setQuizData([])
      } finally {
        setLoading(false)
      }
    }

    fetchQuizAnalytics()
  }, [user])

  if (loading) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[200px]">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (quizData.length === 0) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground">
        No quiz data available yet. Complete some chapter quizzes to see your performance.
      </div>
    )
  }

  // Find the maximum score to set the domain for YAxis
  const maxScore = Math.max(...quizData.map(item => item.total || 10))

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={quizData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="chapter" />
          <YAxis domain={[0, maxScore]} />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'score') {
                const item = quizData.find(d => d.score === value)
                return [`${value}/${item?.total || 10}`, 'Score']
              }
              return [value, name]
            }}
          />
          <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { useProgress } from "@/lib/progress-context"
import type { QuizQuestion } from "@/lib/quiz-service"
import { FullscreenQuizContainer } from "./fullscreen-quiz-container"

// Define the structure of the analytics object received from the backend
interface QuizAnalytics {
  chapterId: string
  userId: string
  score: number
  totalQuestionsAttempted: number
  submittedAt: string
}

interface QuizContentProps {
  chapterId: string
}

export function QuizContent({ chapterId }: QuizContentProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { refreshProgress, progress } = useProgress()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [showStartPrompt, setShowStartPrompt] = useState(true)
  const [previousScore, setPreviousScore] = useState<{ score: number, totalQuestions: number } | null>(null)

  // Format chapter ID for API endpoint (e.g., "1" -> "CH-001")
  const chapter = `CH-${chapterId.padStart(3, "0")}`

  // Check for previous quiz scores
  useEffect(() => {
    if (progress && progress.chapterQuizScores && progress.chapterQuizScores[chapter]) {
      setPreviousScore(progress.chapterQuizScores[chapter]);
    }
  }, [progress, chapter]);

  // Fetch quiz questions from the backend API
  useEffect(() => {
    if (!quizStarted) return

    async function loadQuizData() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/quiz/${chapter}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        if (!data.questions || data.questions.length === 0) {
          setError("No questions found for this chapter.")
          setQuestions([])
        } else {
          setQuestions(data.questions)
          // Initialize selectedAnswers based on fetched questions
          const initialAnswers: Record<string, string> = {}
          data.questions.forEach((q: QuizQuestion) => {
            initialAnswers[q.id] = ""
          })
          setSelectedAnswers(initialAnswers)
        }
      } catch (err: any) {
        console.error("Failed to load quiz data:", err)
        setError(err.message || "Failed to load quiz. Please try again later.")
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }

    loadQuizData()
  }, [chapter, quizStarted])

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Handle submitting answers to the backend API
  const handleSubmit = async () => {
    if (!user) {
      setError("You must be logged in to submit the quiz.")
      return
    }
    if (Object.values(selectedAnswers).some((answer) => !answer)) {
      setError("Please answer all questions before submitting.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/quiz/${chapter}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAnswers: selectedAnswers,
          userId: user.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      // Store the analytics received from the backend
      setQuizAnalytics(result.analytics)
      setIsSubmitted(true)

      // Refresh the progress context to update the sidebar
      refreshProgress()
      console.log("Progress refreshed after quiz submission")
    } catch (err: any) {
      console.error("Failed to submit quiz:", err)
      setError(err.message || "Failed to submit quiz. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
    setShowStartPrompt(false)
  }

  const handleExitFullscreen = () => {
    // Only allow exiting if the quiz is submitted
    if (isSubmitted) {
      router.back()
    }
  }

  // --- Render States ---

  // Loading authentication state
  if (authLoading) {
    return (
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Checking authentication...</p>
        </CardContent>
      </Card>
    )
  }

  // Show start prompt
  if (showStartPrompt) {
    return (
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Take a Quiz</CardTitle>
          <CardDescription>Chapter {chapterId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {previousScore && (
            <div className="bg-muted p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-2">Previous Attempt</h3>
              <p>Your previous score: <span className="font-bold">{previousScore.score}/{previousScore.totalQuestions}</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                {previousScore.score >= previousScore.totalQuestions * 0.3 
                  ? "You passed this quiz. You can retake it to improve your score." 
                  : "You didn't pass this quiz. You need to score at least 30% to pass."}
              </p>
            </div>
          )}
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                You are about to start the quiz for Chapter {chapterId}. Please note the following:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The quiz will be in fullscreen mode to ensure academic integrity</li>
                <li>Once started, you must complete the quiz</li>
                <li>Exiting fullscreen or refreshing the page will be recorded</li>
                <li>Make sure you have a stable internet connection</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={handleStartQuiz}>Start Quiz</Button>
        </CardFooter>
      </Card>
    )
  }

  // Loading questions state
  if (loading) {
    return (
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading quiz questions...</p>
        </CardContent>
      </Card>
    )
  }

  // Error state (fetch or submit)
  if (error && !submitting) {
    return (
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-6" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Submitted state - Display results from backend analytics
  if (isSubmitted && quizAnalytics) {
    const { score, totalQuestionsAttempted } = quizAnalytics
    const totalQuestionsInQuiz = questions.length

    return (
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>Chapter {chapterId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-muted rounded-lg">
            <h2 className="text-3xl font-bold mb-2">Your Score</h2>
            <div className="text-5xl font-bold mb-4">
              {score}/{totalQuestionsInQuiz}
            </div>
            <p className="text-muted-foreground">
              {score >= totalQuestionsInQuiz * 0.3
                ? "Great job! You've passed this chapter's quiz."
                : "You need to score at least 30% to pass. Consider reviewing the chapter and trying again."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Attempted: {totalQuestionsAttempted} questions</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/chapters/${chapterId}`)}>
            Back to Chapter
          </Button>
          <Button
            onClick={() => {
              // Reset state for retake
              setIsSubmitted(false)
              setQuizAnalytics(null)
              setCurrentQuestionIndex(0)
              const resetAnswers: Record<string, string> = {}
              questions.forEach((q) => {
                resetAnswers[q.id] = ""
              })
              setSelectedAnswers(resetAnswers)
              setError(null)
            }}
          >
            Retake Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // If no questions loaded (and not loading/error)
  if (!loading && questions.length === 0 && !error) {
    return (
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground">
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No questions available for this chapter.</AlertDescription>
          </Alert>
          <Button className="mt-6" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  // --- Quiz Taking UI ---
  const currentQuestionData = questions[currentQuestionIndex]
  if (!currentQuestionData) return null

  return (
    <FullscreenQuizContainer isActive={quizStarted && !isSubmitted} onExit={handleExitFullscreen}>
      <Card className="max-w-3xl w-full mx-auto bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Take a Quiz</CardTitle>
              <CardDescription>Chapter {chapterId}</CardDescription>
            </div>
            <div className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="select-none">
            {error && submitting && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select an answer to proceed. You must remain in fullscreen mode until you submit all answers.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground quiz-question">
                  {currentQuestionIndex + 1}. {currentQuestionData.question}
                </h3>

                <RadioGroup
                  value={selectedAnswers[currentQuestionData.id] || ""}
                  onValueChange={(value) => {
                    setSelectedAnswers((prev) => ({
                      ...prev,
                      [currentQuestionData.id]: value,
                    }))
                  }}
                  className="space-y-3"
                >
                  {Object.entries(currentQuestionData.options)
                    .sort()
                    .map(([optionKey, optionText]) => (
                      <div
                        key={optionKey}
                        className={`flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors quiz-option ${
                          selectedAnswers[currentQuestionData.id] === optionKey
                            ? "selected bg-primary/10 border-primary text-foreground"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                        onClick={() => {
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [currentQuestionData.id]: optionKey,
                          }))
                        }}
                      >
                        <RadioGroupItem value={optionKey} id={`option-${optionKey}`} />
                        <Label htmlFor={`option-${optionKey}`} className="flex-1 cursor-pointer text-base font-medium">
                          {optionKey}: {optionText}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button variant="outline" onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting || Object.values(selectedAnswers).some((answer) => !answer)}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </CardFooter>
      </Card>
    </FullscreenQuizContainer>
  )
}
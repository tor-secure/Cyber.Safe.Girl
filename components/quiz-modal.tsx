"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { QuizQuestion } from "@/lib/quiz-service"
import { useAuth } from "@/lib/auth-context" // Import useAuth hook
import { useProgress } from "@/lib/progress-context" // Import useProgress hook
import { FullscreenQuizContainer } from "./fullscreen-quiz-container"

// Define the structure of the analytics object received from the backend
interface QuizAnalytics {
  chapterId: string
  userId: string
  score: number
  totalQuestionsAttempted: number
  submittedAt: string
  // evaluationDetails?: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean }>; // Optional
}

interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: string
  onComplete: (score: number, totalQuestions: number, passed: boolean) => void
}

export function QuizModal({ open, onOpenChange, chapterId, onComplete }: QuizModalProps) {
  const { user, isLoading: authLoading } = useAuth() // Get user and auth loading state
  const { refreshProgress } = useProgress() // Get refreshProgress function from progress context
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false) // Loading state for submitting answers
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState(0) // Add missing score state
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics | null>(null) // Store analytics from backend
  const [evaluationDetails, setEvaluationDetails] = useState<
    Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean }>
  >({})

  // State for storing fetched data
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // Use the chapter ID as provided (should already be formatted correctly from chapter-content.tsx)
  const chapter = chapterId

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentQuestion(0)
      setSelectedAnswers({})
      setIsSubmitted(false)
      setIsStarted(false)
      setScore(0)
      setError(null)
    }
  }, [open])

  // Fetch quiz data from backend API when quiz starts
  useEffect(() => {
    if (isStarted && open) {
      async function loadQuizData() {
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/quiz/${chapter}`) // Fetch from GET endpoint
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
          setQuestions([]) // Clear questions on error
        } finally {
          setLoading(false)
        }
      }

      loadQuizData()
    }
  }, [isStarted, open, chapter])

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    console.log("Submitting answers:", selectedAnswers)

    if (!user) {
      setError("You must be logged in to submit the quiz.")
      return // Or redirect to login
    }
    if (Object.values(selectedAnswers).some((answer) => !answer)) {
      setError("Please answer all questions before submitting.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Step 1: Submit quiz answers for evaluation
      const quizResponse = await fetch(`/api/quiz/${chapter}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAnswers: selectedAnswers,
          userId: user.id, // Send the user ID from auth context
        }),
      })

      const quizResult = await quizResponse.json()

      if (!quizResponse.ok) {
        throw new Error(quizResult.error || `HTTP error! status: ${quizResponse.status}`)
      }

      // Store the analytics and evaluation details received from the backend
      setQuizAnalytics(quizResult.analytics)
      setEvaluationDetails(quizResult.evaluationDetails || {})
      setIsSubmitted(true)

      // Calculate if the user passed the quiz (30% passing threshold)
      const passingScore = Math.ceil(quizResult.analytics.totalQuestionsAttempted * 0.3)
      const passed = quizResult.analytics.score >= passingScore

      // Call the onComplete callback with the score and passed status
      onComplete(quizResult.analytics.score, quizResult.analytics.totalQuestionsAttempted, passed)

      // Step 2: Update user progress to potentially unlock next chapter
      try {
        const progressResponse = await fetch("/api/user-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            chapterId: chapter,
            score: quizResult.analytics.score,
            totalQuestions: quizResult.analytics.totalQuestionsAttempted,
          }),
        })

        const progressResult = await progressResponse.json()

        // Refresh the progress context to update the sidebar
        refreshProgress()
        console.log("Progress refreshed after quiz submission in modal")

        if (progressResult.unlockedNextChapter) {
          console.log(`Unlocked next chapter: ${progressResult.nextChapterId}`)
          // You could show a notification here that a new chapter was unlocked
        }
      } catch (progressErr) {
        console.error("Failed to update user progress:", progressErr)
        // Don't show this error to the user, as the quiz was still submitted successfully
      }
    } catch (err: any) {
      console.error("Failed to submit quiz:", err)
      setError(err.message || "Failed to submit quiz. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartQuiz = () => {
    setIsStarted(true)
  }

  // Prevent closing the modal once the quiz has started
  const handleOpenChange = (open: boolean) => {
    if (isStarted && !isSubmitted) {
      // Don't allow closing if quiz is in progress
      return
    }
    onOpenChange(open)
  }

  const handleExitFullscreen = () => {
    // Only allow exiting if the quiz is submitted or not started
    if (isSubmitted || !isStarted) {
      onOpenChange(false)
    }
  }

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto bg-background text-foreground p-0"
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside if quiz is in progress
          if (isStarted && !isSubmitted) {
            e.preventDefault()
          }
        }}
      >
        {!isStarted ? (
          // Quiz start screen
          <>
            <DialogHeader className="p-6">
              <DialogTitle>Are you sure you want to take a test?</DialogTitle>
              <DialogDescription>
                Once you start a test, you cannot exit unless you submit your answers. The test will be in fullscreen
                mode to ensure academic integrity.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6 py-2">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Notes:
                </h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>We recommend you to read entire chapter before taking up the test</li>
                  <li>To reveal the next chapter, one must need to give the current chapter test</li>
                  <li>Test is not time bounded</li>
                  <li>The test will be in fullscreen mode and must be completed once started</li>
                  <li>Exiting fullscreen or refreshing the page will be recorded</li>
                </ul>
              </div>
              <div className="text-sm">
                <span className="font-medium">Current Score:</span>{" "}
                {Number.parseInt(chapterId) <= 1 ? "8" : "No Test Taken"}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 p-6">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto w-full">
                Cancel
              </Button>
              <Button onClick={handleStartQuiz} className="sm:w-auto w-full">
                Start Test
              </Button>
            </DialogFooter>
          </>
        ) : (
          <FullscreenQuizContainer isActive={isStarted && !isSubmitted} onExit={handleExitFullscreen}>
            {loading ? (
              // Loading state
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Loading quiz questions...</p>
              </div>
            ) : error ? (
              // Error state
              <div className="py-8 px-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <DialogFooter className="mt-6">
                  <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
              </div>
            ) : isSubmitted && quizAnalytics ? (
              // Quiz results screen with server-side evaluation
              <>
                <DialogHeader className="p-6">
                  <DialogTitle>Quiz Results</DialogTitle>
                  <DialogDescription>Chapter {chapterId}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 px-6">
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <h2 className="text-3xl font-bold mb-2">Your Score</h2>
                    <div className="text-5xl font-bold mb-4">
                      {quizAnalytics.score}/{questions.length}
                    </div>
                    <p className="text-muted-foreground">
                      {quizAnalytics.score >= questions.length * 0.3
                        ? "Great job! You've passed this chapter's quiz."
                        : "You need to score at least 30% to pass. Consider reviewing the chapter and trying again."}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Attempted: {quizAnalytics.totalQuestionsAttempted} questions
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Question Summary</h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {questions.map((question, index) => {
                        const evaluation = evaluationDetails[question.id]
                        const isCorrect = evaluation ? evaluation.isCorrect : false

                        return (
                          <div
                            key={index}
                            className={`w-10 h-10 flex items-center justify-center rounded-full font-medium ${
                              isCorrect
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex justify-between p-6">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsSubmitted(false)
                      setCurrentQuestion(0)
                      const resetAnswers: Record<string, string> = {}
                      questions.forEach((q) => {
                        resetAnswers[q.id] = ""
                      })
                      setSelectedAnswers(resetAnswers)
                    }}
                  >
                    Retake Quiz
                  </Button>
                </DialogFooter>
              </>
            ) : questions.length === 0 ? (
              // No questions available
              <div className="py-8 px-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No questions available for this chapter.</AlertDescription>
                </Alert>
                <DialogFooter className="mt-6">
                  <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
              </div>
            ) : (
              // Quiz questions screen
              <>
                <DialogHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <DialogTitle>Take a Quiz</DialogTitle>
                    <div className="text-sm font-medium">
                      Question {currentQuestion + 1} of {questions.length}
                    </div>
                  </div>
                  <DialogDescription>Chapter {chapterId}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-6">
                  <Progress value={progress} className="h-2" />

                  <div className="select-none">
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Select an answer to proceed. You must remain in fullscreen mode until you submit all answers.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          {currentQuestion + 1}. {questions[currentQuestion]?.question}
                        </h3>

                        <RadioGroup
                          value={selectedAnswers[questions[currentQuestion]?.id] || ""}
                          onValueChange={(value) => {
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [questions[currentQuestion].id]: value,
                            }))
                          }}
                          className="space-y-3"
                        >
                          {Object.entries(questions[currentQuestion]?.options || {})
                            .sort()
                            .map(([optionKey, optionText]) => (
                              <div
                                key={optionKey}
                                className={`flex items-center space-x-2 rounded-lg border p-4 transition-colors ${
                                  selectedAnswers[questions[currentQuestion]?.id] === optionKey ? "bg-muted" : ""
                                }`}
                                onClick={() => {
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [questions[currentQuestion].id]: optionKey,
                                  }))
                                }}
                              >
                                <RadioGroupItem value={optionKey} id={`option-${optionKey}`} />
                                <Label htmlFor={`option-${optionKey}`} className="flex-1 cursor-pointer text-base">
                                  {optionKey}: {optionText}
                                </Label>
                              </div>
                            ))}
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 mt-4 p-6">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={currentQuestion === questions.length - 1}
                      className="flex-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || Object.values(selectedAnswers).some((answer) => !answer)}
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </FullscreenQuizContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}

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
import { fetchQuizQuestions, fetchAnswerKey, type QuizQuestion, type AnswerKey } from "@/lib/quiz-service"

interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: string
  onComplete: (score: number, totalQuestions: number) => void
}

export function QuizModal({ open, onOpenChange, chapterId, onComplete }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for storing fetched data
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answerKey, setAnswerKey] = useState<AnswerKey>({})

  // Format chapter ID for Firestore (e.g., "1" -> "CH-001")
  const chapter = `CH-${chapterId.padStart(3, "0")}`

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

  // Fetch quiz data from Firestore when quiz starts
  useEffect(() => {
    if (isStarted && open) {
      async function loadQuizData() {
        setLoading(true)
        setError(null)

        try {
          const [fetchedQuestions, fetchedAnswerKey] = await Promise.all([
            fetchQuizQuestions(chapter),
            fetchAnswerKey(chapter),
          ])

          if (fetchedQuestions.length === 0) {
            setError("No questions found for this chapter.")
          } else {
            setQuestions(fetchedQuestions)
            setAnswerKey(fetchedAnswerKey)
            // Initialize selectedAnswers with empty values
            const initialAnswers: Record<string, string> = {}
            fetchedQuestions.forEach((q) => {
              initialAnswers[q.id] = ""
            })
            setSelectedAnswers(initialAnswers)
          }
        } catch (err) {
          console.error("Failed to load quiz data:", err)
          setError("Failed to load quiz. Please try again later.")
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

  const handleSubmit = () => {
    // Calculate score by comparing selected answers with answer key
    let correctAnswers = 0

    Object.entries(selectedAnswers).forEach(([questionId, selectedOption]) => {
      if (answerKey[questionId] === selectedOption) {
        correctAnswers++
      }
    })

    setScore(correctAnswers)
    setIsSubmitted(true)
    onComplete(correctAnswers, questions.length)
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

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto bg-background text-foreground"
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
            <DialogHeader>
              <DialogTitle>Are you sure you want to take a test?</DialogTitle>
              <DialogDescription>
                Once you start a test, you cannot exit unless you submit your answers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Notes:
                </h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>We recommend you to read entire chapter before taking up the test</li>
                  <li>To reveal the next chapter, one must need to give the current chapter test</li>
                  <li>Test is not time bounded</li>
                </ul>
              </div>
              <div className="text-sm">
                <span className="font-medium">Current Score:</span>{" "}
                {Number.parseInt(chapterId) <= 1 ? "8" : "No Test Taken"}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto w-full">
                Cancel
              </Button>
              <Button onClick={handleStartQuiz} className="sm:w-auto w-full">
                Start Test
              </Button>
            </DialogFooter>
          </>
        ) : loading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading quiz questions...</p>
          </div>
        ) : error ? (
          // Error state
          <div className="py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <DialogFooter className="mt-6">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : isSubmitted ? (
          // Quiz results screen
          <>
            <DialogHeader>
              <DialogTitle>Quiz Results</DialogTitle>
              <DialogDescription>Chapter {chapterId}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center p-6 bg-muted rounded-lg">
                <h2 className="text-3xl font-bold mb-2">Your Score</h2>
                <div className="text-5xl font-bold mb-4">
                  {score}/{questions.length}
                </div>
                <p className="text-muted-foreground">
                  {score >= questions.length * 0.7
                    ? "Great job! You've passed this chapter's quiz."
                    : "You need to score at least 70% to pass. Consider reviewing the chapter and trying again."}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Question Summary</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {questions.map((question, index) => {
                    const isCorrect = answerKey[question.id] === selectedAnswers[question.id]

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
            <DialogFooter className="flex justify-between">
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
          <div className="py-8">
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
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Take a Quiz</DialogTitle>
                <div className="text-sm font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
              </div>
              <DialogDescription>Chapter {chapterId}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />

              <div className="select-none">
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Select an answer to proceed. You cannot exit the quiz until you submit all answers.
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
            <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0} className="flex-1">
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
                disabled={Object.values(selectedAnswers).some((answer) => !answer)}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                Submit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

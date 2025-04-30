"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchQuizQuestions, fetchAnswerKey, type QuizQuestion, type AnswerKey } from "@/lib/quiz-service"

interface QuizContentProps {
  chapterId: string
}

export function QuizContent({ chapterId }: QuizContentProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for storing fetched data
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answerKey, setAnswerKey] = useState<AnswerKey>({})

  // Format chapter ID for Firestore (e.g., "1" -> "CH-001")
  const chapter = `CH-${chapterId.padStart(3, "0")}`

  // Fetch quiz data from Firestore
  useEffect(() => {
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
  }, [chapter])

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
  }

  // Loading state
  if (loading) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading quiz questions...</p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-6" onClick={() => router.push(`/chapters/${chapterId}`)}>
            Back to Chapter
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isSubmitted) {
    const totalQuestions = questions.length

    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>Chapter {chapterId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-muted rounded-lg">
            <h2 className="text-3xl font-bold mb-2">Your Score</h2>
            <div className="text-5xl font-bold mb-4">
              {score}/{totalQuestions}
            </div>
            <p className="text-muted-foreground">
              {score >= totalQuestions * 0.7
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/chapters/${chapterId}`)}>
            Back to Chapter
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
        </CardFooter>
      </Card>
    )
  }

  // If no questions loaded
  if (questions.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No questions available for this chapter.</AlertDescription>
          </Alert>
          <Button className="mt-6" onClick={() => router.push(`/chapters/${chapterId}`)}>
            Back to Chapter
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentQuestionData = questions[currentQuestion]

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Take a Quiz</CardTitle>
            <CardDescription>Chapter {chapterId}</CardDescription>
          </div>
          <div className="text-sm font-medium">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="select-none">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select an answer to proceed. You can navigate between questions before submitting.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">
                {currentQuestion + 1}. {currentQuestionData.question}
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
                      className={`flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                        selectedAnswers[currentQuestionData.id] === optionKey ? "bg-muted" : ""
                      }`}
                      onClick={() => {
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentQuestionData.id]: optionKey,
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
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button variant="outline" onClick={handleNext} disabled={currentQuestion === questions.length - 1}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <Button onClick={handleSubmit} disabled={Object.values(selectedAnswers).some((answer) => !answer)}>
          Submit
        </Button>
      </CardFooter>
    </Card>
  )
}

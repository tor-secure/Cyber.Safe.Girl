"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Trophy, CreditCard, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchQuizQuestions, type QuizQuestion } from "@/lib/quiz-service"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { FullscreenQuizContainer } from "./fullscreen-quiz-container"

export function FinalTest() {
  const { user } = useAuth()
  const router = useRouter()
  const [score, setScore] = useState<number | null>(null)
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null)
  const [passingScore, setPassingScore] = useState(15) // 30% of 30 questions
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [testLoading, setTestLoading] = useState(false)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [finalTestCompleted, setFinalTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)

  // Check if user is allowed to take the final test
  useEffect(() => {
    async function checkUserProgress() {
      if (!user) {
        router.push("/login")
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch user progress to check if final test is unlocked
        const progressResponse = await fetch(`/api/user-progress?userId=${user.id}`)

        if (!progressResponse.ok) {
          throw new Error(`HTTP error! status: ${progressResponse.status}`)
        }

        const progressData = await progressResponse.json()
        setUserProgress(progressData.progress)

        // Check if user has already completed the final test
        if (progressData.progress.finalTestCompleted) {
          setFinalTestCompleted(true)
          setCertificateUnlocked(progressData.progress.certificateUnlocked)

          // Fetch the actual final test score from the database
          try {
            const analyticsResponse = await fetch(`/api/final-test-analytics?userId=${user.id}`)
            
            if (analyticsResponse.ok) {
              const analyticsData = await analyticsResponse.json()
              
              if (analyticsData.finalTestAnalytics && analyticsData.finalTestAnalytics.length > 0) {
                // Get the most recent test result (already sorted by submittedAt in descending order)
                const latestResult = analyticsData.finalTestAnalytics[0]
                setScore(latestResult.score)
                setTotalQuestions(latestResult.totalQuestionsAttempted)
                console.log("Fetched actual final test score:", latestResult.score, "out of", latestResult.totalQuestionsAttempted)
              } else {
                // Fallback if no test results found in analytics
                if (progressData.progress.finalTestScore !== undefined && progressData.progress.finalTestTotalQuestions !== undefined) {
                  setScore(progressData.progress.finalTestScore)
                  setTotalQuestions(progressData.progress.finalTestTotalQuestions)
                } else {
                  // Fallback to default values if not available anywhere
                  setScore(progressData.progress.certificateUnlocked ? 20 : 6)
                  setTotalQuestions(50)
                }
              }
            } else {
              // Fallback if API call fails
              console.error("Failed to fetch final test analytics")
              if (progressData.progress.finalTestScore !== undefined && progressData.progress.finalTestTotalQuestions !== undefined) {
                setScore(progressData.progress.finalTestScore)
                setTotalQuestions(progressData.progress.finalTestTotalQuestions)
              } else {
                setScore(progressData.progress.certificateUnlocked ? 20 : 6)
                setTotalQuestions(50)
              }
            }
          } catch (analyticsErr) {
            console.error("Error fetching final test analytics:", analyticsErr)
            if (progressData.progress.finalTestScore !== undefined && progressData.progress.finalTestTotalQuestions !== undefined) {
              setScore(progressData.progress.finalTestScore)
              setTotalQuestions(progressData.progress.finalTestTotalQuestions)
            } else {
              setScore(progressData.progress.certificateUnlocked ? 20 : 6)
              setTotalQuestions(50)
            }
          }
        } else {
          // Check if user has paid for the final test
          if (!progressData.progress.paymentCompleted) {
            setError("You need to complete payment before taking the final test.")
            router.push("/payment")
            return
          }

          // Check if user is allowed to take the final test
          if (!progressData.progress.finalTestUnlocked) {
            setError("You need to complete all chapters before taking the final test.")
          }

          // Set default values
          setScore(0)
          setTotalQuestions(50)
        }
      } catch (err: any) {
        console.error("Failed to check user progress:", err)
        setError(err.message || "Failed to check if you're eligible for the final test.")
        setScore(0)
        setTotalQuestions(0)
      } finally {
        setLoading(false)
      }
    }

    checkUserProgress()
  }, [user, router])

  const handleStartTest = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setShowTestDialog(true)
    setTestLoading(true)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setIsSubmitted(false)
    setTestStarted(false)

    try {
      // Fetch final test questions
      const fetchedQuestions = await fetchQuizQuestions("final-test")

      if (fetchedQuestions.length === 0) {
        setError("No questions found for the final test.")
      } else {
        setQuestions(fetchedQuestions)

        // Initialize selectedAnswers with empty values
        const initialAnswers: Record<string, string> = {}
        fetchedQuestions.forEach((q) => {
          initialAnswers[q.id] = ""
        })
        setSelectedAnswers(initialAnswers)
      }
    } catch (err) {
      console.error("Failed to load final test data:", err)
      setError("Failed to load final test. Please try again later.")
    } finally {
      setTestLoading(false)
    }
  }

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

  const handleSubmitTest = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      // Submit answers to the backend for validation
      const response = await fetch(`/api/quiz/final-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAnswers: selectedAnswers,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Set the score from the server response
      setScore(result.analytics.score)
      setTotalQuestions(result.analytics.totalQuestionsAttempted)
      
      // The backend already updates the user progress in the final-test API
      // including storing the score and updating certificate status
      setFinalTestCompleted(true)
      setCertificateUnlocked(result.certificateUnlocked)

      setIsSubmitted(true)
      setShowTestDialog(false)
      setTestStarted(false)
    } catch (err: any) {
      console.error("Failed to submit final test:", err)
      setError(err.message || "Failed to submit final test. Please try again.")
    }
  }

  const handleBeginTest = () => {
    setTestStarted(true)
  }

  const handleExitFullscreen = () => {
    // Only allow exiting if the test is submitted
    if (isSubmitted || !testStarted) {
      setShowTestDialog(false)
    }
  }

  const isPassing = score !== null && totalQuestions !== null ? score >= passingScore : false

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading final test data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Final Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Final Assessment</CardTitle>
          <CardDescription>Test your knowledge of all cybersecurity concepts covered in the course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex items-center justify-center w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="text-center">
                <div className="text-3xl font-bold">{score}</div>
                <div className="text-sm text-muted-foreground">out of {totalQuestions}</div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {!isPassing ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Your score is below the passing threshold of {passingScore} points. You need to score at least{" "}
                    {passingScore} points to pass the final test and receive your certificate.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                  <Trophy className="h-4 w-4" />
                  <AlertTitle>Congratulations!</AlertTitle>
                  <AlertDescription>
                    You have passed the final test. You can now download your certificate.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Score</span>
                  <span>{totalQuestions ? Math.round((score! / totalQuestions) * 100) : 0}%</span>
                </div>
                <Progress value={totalQuestions ? (score! / totalQuestions) * 100 : 0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span
                    className={`${isPassing ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    Passing: {totalQuestions ? Math.round((passingScore / totalQuestions) * 100) : 0}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={handleStartTest}>
            Take Test
          </Button>
          {isPassing && (
            <Button variant="outline" asChild className="flex-1">
              <Link href="/certificate">View Certificate</Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
          <CardDescription>Breakdown of your performance in the final test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalQuestions !== null ? totalQuestions - score! : 0}</div>
                    <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {totalQuestions ? Math.round((score! / totalQuestions) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Areas for Improvement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Identity Theft Prevention (40% accuracy)</li>
                <li>Online Banking Security (50% accuracy)</li>
                <li>Social Media Privacy (60% accuracy)</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Review All Questions
          </Button>
        </CardFooter>
      </Card>

      {/* Test Dialog */}
      <Dialog
        open={showTestDialog}
        onOpenChange={(open) => {
          // Only allow closing if not in the middle of a test
          if (!open || isSubmitted || !testStarted) {
            setShowTestDialog(open)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto bg-background text-foreground p-0"
          onInteractOutside={(e) => {
            // Prevent closing by clicking outside if test is in progress
            if (testStarted && !isSubmitted) {
              e.preventDefault()
            }
          }}
        >
          {!testStarted ? (
            // Test start screen
            <>
              <DialogHeader className="p-6">
                <DialogTitle>Final Assessment</DialogTitle>
                <DialogDescription>
                  You are about to start the final assessment. This test will be in fullscreen mode and must be
                  completed once started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-6 py-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Information</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>The test will be in fullscreen mode to ensure academic integrity</li>
                      <li>Once started, you must complete the test</li>
                      <li>Exiting fullscreen or refreshing the page will be recorded</li>
                      <li>Make sure you have a stable internet connection</li>
                      <li>You need to score at least {passingScore} points to pass</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter className="p-6">
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBeginTest}>Begin Final Test</Button>
              </DialogFooter>
            </>
          ) : (
            <FullscreenQuizContainer isActive={testStarted && !isSubmitted} onExit={handleExitFullscreen}>
              {testLoading ? (
                // Loading state
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Loading final test questions...</p>
                </div>
              ) : error ? (
                // Error state
                <div className="py-8 px-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <DialogFooter className="mt-6">
                    <Button onClick={() => setShowTestDialog(false)}>Close</Button>
                  </DialogFooter>
                </div>
              ) : questions.length === 0 ? (
                // No questions available
                <div className="py-8 px-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No questions available for the final test.</AlertDescription>
                  </Alert>
                  <DialogFooter className="mt-6">
                    <Button onClick={() => setShowTestDialog(false)}>Close</Button>
                  </DialogFooter>
                </div>
              ) : (
                // Test questions screen
                <>
                  <DialogHeader className="p-6">
                    <div className="flex items-center justify-between">
                      <DialogTitle>Final Assessment</DialogTitle>
                      <div className="text-sm font-medium">
                        Question {currentQuestion + 1} of {questions.length}
                      </div>
                    </div>
                    <DialogDescription>
                      Test your knowledge of all cybersecurity concepts covered in the course
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 px-6">
                    <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />

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
                            {questions[currentQuestion]?.chapter && (
                              <span className="text-sm text-muted-foreground ml-2">
                                (From Chapter {questions[currentQuestion].chapter.replace("CH-", "")})
                              </span>
                            )}
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
                      onClick={handleSubmitTest}
                      disabled={Object.values(selectedAnswers).some((answer) => !answer)}
                      className="w-full sm:w-auto mt-2 sm:mt-0"
                    >
                      Submit
                    </Button>
                  </DialogFooter>
                </>
              )}
            </FullscreenQuizContainer>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
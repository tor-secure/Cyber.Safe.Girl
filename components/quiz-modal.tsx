"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: string
  onComplete: (score: number, totalQuestions: number) => void
}

export function QuizModal({ open, onOpenChange, chapterId, onComplete }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(Array(5).fill(""))
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isStarted, setIsStarted] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentQuestion(0)
      setSelectedAnswers(Array(5).fill(""))
      setIsSubmitted(false)
      setIsStarted(false)
      setScore(0)
    }
  }, [open])

  // This would come from an API in a real application
  const quizData = {
    title:
      chapterId === "1" ? "Mobile Recharge Shop" : chapterId === "2" ? "Debit Card Cloning" : `Chapter ${chapterId}`,
    questions: [
      {
        id: 1,
        text:
          chapterId === "2"
            ? "What are the ways to figure that a skimming device has been attached? I.Look out for protruding or extra layer of fittings over the card reader II.Check the slot for moving parts"
            : "What is the potential risk of giving your mobile number to a local recharge shop?",
        options:
          chapterId === "2"
            ? ["I only", "II only", "I and II", "None of the above"]
            : [
                "No risk at all",
                "They might send spam messages",
                "They could create a fake identity using your information",
                "They might charge extra for the recharge",
              ],
        correctAnswer: chapterId === "2" ? "I and II" : "They could create a fake identity using your information",
      },
      {
        id: 2,
        text:
          chapterId === "2"
            ? "Does having ATM guard minimize the possibility of a skimming attack?"
            : "What should you do to minimize the risk when recharging your mobile?",
        options:
          chapterId === "2"
            ? [
                "Yes, if the guard observes people's activity in the ATM",
                "Yes, if the guard observes people's activity in the ATM and can identify if a skimming device has been attached",
                "No, this would not make any difference",
                "I don't know",
              ]
            : [
                "Use online recharge methods",
                "Go to the official customer care center",
                "Use a trusted vendor you know personally",
                "All of the above",
              ],
        correctAnswer:
          chapterId === "2"
            ? "Yes, if the guard observes people's activity in the ATM and can identify if a skimming device has been attached"
            : "All of the above",
      },
      {
        id: 3,
        text: "Which section of the IT Act deals with identity theft?",
        options: ["Section 65", "Section 66C", "Section 67", "Section 70"],
        correctAnswer: "Section 66C",
      },
      {
        id: 4,
        text: "What should you do if you suspect your information has been compromised?",
        options: [
          "Ignore it as nothing will happen",
          "Wait and see if there's any suspicious activity",
          "Report to the authorities immediately",
          "Change all your passwords but don't report",
        ],
        correctAnswer: "Report to the authorities immediately",
      },
      {
        id: 5,
        text: "Which of the following is NOT a good cybersecurity practice?",
        options: [
          "Using different passwords for different accounts",
          "Sharing your OTP with trusted friends",
          "Enabling two-factor authentication",
          "Regularly updating your devices",
        ],
        correctAnswer: "Sharing your OTP with trusted friends",
      },
    ],
  }

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    const calculatedScore = quizData.questions.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.correctAnswer ? 1 : 0)
    }, 0)

    setScore(calculatedScore)
    setIsSubmitted(true)
    onComplete(calculatedScore, quizData.questions.length)
  }

  const handleStartQuiz = () => {
    setIsStarted(true)
  }

  const currentQuestionData = quizData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100

  // Prevent closing the modal once the quiz has started
  const handleOpenChange = (open: boolean) => {
    if (isStarted && !isSubmitted) {
      // Don't allow closing if quiz is in progress
      return
    }
    onOpenChange(open)
  }

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
        ) : isSubmitted ? (
          // Quiz results screen
          <>
            <DialogHeader>
              <DialogTitle>Quiz Results</DialogTitle>
              <DialogDescription>
                Chapter {chapterId}: {quizData.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center p-6 bg-muted rounded-lg">
                <h2 className="text-3xl font-bold mb-2">Your Score</h2>
                <div className="text-5xl font-bold mb-4">
                  {score}/{quizData.questions.length}
                </div>
                <p className="text-muted-foreground">
                  {score >= quizData.questions.length * 0.7
                    ? "Great job! You've passed this chapter's quiz."
                    : "You need to score at least 70% to pass. Consider reviewing the chapter and trying again."}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Question Summary</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {quizData.questions.map((question, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 flex items-center justify-center rounded-full font-medium ${
                        selectedAnswers[index] === question.correctAnswer
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                  ))}
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
                  setSelectedAnswers(Array(5).fill(""))
                  setIsStarted(true)
                }}
              >
                Retake Quiz
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Quiz questions screen
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Take a Quiz</DialogTitle>
                <div className="text-sm font-medium">
                  Question {currentQuestion + 1} of {quizData.questions.length}
                </div>
              </div>
              <DialogDescription>
                Chapter {chapterId}: {quizData.title}
              </DialogDescription>
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
                      {currentQuestion + 1}. {currentQuestionData.text}
                    </h3>

                    <RadioGroup
                      value={selectedAnswers[currentQuestion]}
                      onValueChange={(value) => {
                        const newAnswers = [...selectedAnswers]
                        newAnswers[currentQuestion] = value
                        setSelectedAnswers(newAnswers)
                      }}
                      className="space-y-3"
                    >
                      {currentQuestionData.options.map((option, index) => (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 rounded-lg border p-4 transition-colors ${
                            selectedAnswers[currentQuestion] === option ? "bg-muted" : ""
                          }`}
                          onClick={() => {
                            const newAnswers = [...selectedAnswers]
                            newAnswers[currentQuestion] = option
                            setSelectedAnswers(newAnswers)
                          }}
                        >
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                            {option}
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
                  disabled={currentQuestion === quizData.questions.length - 1}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={selectedAnswers.some((answer) => !answer)}
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

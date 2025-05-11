"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { useFullscreen } from "@/hooks/use-fullscreen"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Maximize } from "lucide-react"

interface FullscreenQuizContainerProps {
  children: ReactNode
  isActive: boolean
  onExit?: () => void
}

export function FullscreenQuizContainer({ children, isActive, onExit }: FullscreenQuizContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, fullscreenSupported, fullscreenError, requestFullscreen, exitFullscreen } = useFullscreen()

  const [showPrompt, setShowPrompt] = useState(isActive && !isFullscreen)
  const [exitAttempted, setExitAttempted] = useState(false)

  // Handle fullscreen changes
  useEffect(() => {
    if (isActive && !isFullscreen) {
      setShowPrompt(true)
    } else {
      setShowPrompt(false)
    }
  }, [isActive, isFullscreen])

  // Prevent navigation away during quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && isFullscreen) {
        e.preventDefault()
        e.returnValue = "You are in the middle of a quiz. Are you sure you want to leave?"
        return e.returnValue
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isActive, isFullscreen])

  // Detect fullscreen exit
  useEffect(() => {
    const handleFullscreenExit = () => {
      if (isActive && !isFullscreen && !showPrompt) {
        setExitAttempted(true)
        setShowPrompt(true)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenExit)
    document.addEventListener("webkitfullscreenchange", handleFullscreenExit)
    document.addEventListener("mozfullscreenchange", handleFullscreenExit)
    document.addEventListener("MSFullscreenChange", handleFullscreenExit)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenExit)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenExit)
      document.removeEventListener("mozfullscreenchange", handleFullscreenExit)
      document.removeEventListener("MSFullscreenChange", handleFullscreenExit)
    }
  }, [isActive, isFullscreen, showPrompt])

  // Handle keyboard shortcuts to prevent exiting fullscreen or copying/pasting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isActive && isFullscreen) {
        // Block F11, Escape
        if (e.key === "F11" || e.key === "Escape") {
          e.preventDefault()
          setExitAttempted(true)
          setShowPrompt(true)
        }
        // Block Ctrl+R, Ctrl+C, Ctrl+V
        if (e.ctrlKey) {
          const blocked = ["r", "c", "v"]
          if (blocked.includes(e.key.toLowerCase())) {
            e.preventDefault()
            console.log(`Blocked Ctrl+${e.key.toUpperCase()}`)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActive, isFullscreen])

  const handleEnterFullscreen = async () => {
    if (containerRef.current) {
      const success = await requestFullscreen(containerRef.current)
      if (success) {
        setShowPrompt(false)
        setExitAttempted(false)
      }
    }
  }

  const handleExitQuiz = () => {
    exitFullscreen()
    if (onExit) {
      onExit()
    }
  }

  if (!fullscreenSupported) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fullscreen Not Supported</AlertTitle>
          <AlertDescription>
            Your browser does not support fullscreen mode, which is required for taking quizzes. Please try using a
            modern browser like Chrome, Firefox, or Edge.
          </AlertDescription>
        </Alert>
        <div className="mt-4">{children}</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {showPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
          <div className="max-w-md w-full space-y-4 bg-card p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-center">
              {exitAttempted ? "Fullscreen Mode Required" : "Enter Fullscreen Mode"}
            </h2>

            {fullscreenError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{fullscreenError}</AlertDescription>
              </Alert>
            )}

            <p className="text-center">
              {exitAttempted
                ? "You must stay in fullscreen mode until you complete the quiz. Please click the button below to re-enter fullscreen mode."
                : "To ensure academic integrity, this quiz must be taken in fullscreen mode. No other applications or browser tabs should be open during the quiz."}
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={handleEnterFullscreen} className="w-full" size="lg">
                <Maximize className="mr-2 h-4 w-4" />
                {exitAttempted ? "Return to Fullscreen" : "Enter Fullscreen Mode"}
              </Button>

              {exitAttempted && (
                <Button variant="outline" onClick={handleExitQuiz} className="w-full">
                  Exit Quiz
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Note: Once you start the quiz, you must complete it. Exiting fullscreen mode or refreshing the page will
              be recorded.
            </p>
          </div>
        </div>
      ) : null}

      <div className={`${isFullscreen ? "p-4 min-h-screen flex flex-col justify-center items-center bg-background text-foreground" : ""}`}>{children}</div>
    </div>
  )
}
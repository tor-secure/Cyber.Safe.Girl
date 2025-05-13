"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, Clock, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

interface Chapter {
  id: number
  chapterId: string
  title: string
  description: string
  completed: boolean
  locked: boolean
}

interface UserProgress {
  userId: string
  completedChapters: string[]
  unlockedChapters: string[]
  finalTestUnlocked: boolean
  finalTestCompleted: boolean
  certificateUnlocked: boolean
  lastUpdated: string
}

export function ChapterGrid({ filter = "all" }: { filter?: "all" | "completed" | "pending" }) {
  const { user } = useAuth()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const router = useRouter()

  // Add a function to handle chapter completion and redirect to payment if needed
  const handleChapterCompletion = (chapterId: string) => {
    // Convert chapterId to a number for comparison
    const chapter = chapters.find((c) => c.id === Number(chapterId))
    const chapterIdString = chapter?.chapterId

    // If this is the last chapter (CH-070) and it's completed, redirect to payment
    if (chapterIdString === "CH-070" && userProgress?.completedChapters?.includes(chapterIdString)) {
      router.push("/payment")
    } else {
      // Otherwise, navigate to the chapter
      router.push(`/chapters/${chapterId}`)
    }
  }

  // Fetch user progress when component mounts
  useEffect(() => {
    async function fetchUserProgress() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/user-progress?userId=${user.id}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setUserProgress(data.progress)

        // Generate chapters based on user progress
        generateChapters(data.progress)
      } catch (err: any) {
        console.error("Failed to fetch user progress:", err)
        setError(err.message || "Failed to load chapter data")

        // Generate default chapters with only first chapter unlocked
        const defaultProgress = {
          userId: user.id,
          completedChapters: [],
          unlockedChapters: ["CH-001"],
          finalTestUnlocked: false,
          finalTestCompleted: false,
          certificateUnlocked: false,
          lastUpdated: new Date().toISOString(),
        }
        generateChapters(defaultProgress)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProgress()
  }, [user])

  // Generate chapters based on user progress
  const generateChapters = (progress: UserProgress) => {
    if (!progress) return

    const chapterList = Array.from({ length: 70 }, (_, i) => {
      const chapterNumber = i + 1
      const chapterId = `CH-${chapterNumber.toString().padStart(3, "0")}`

      return {
        id: chapterNumber,
        chapterId,
        title: `Chapter ${chapterNumber}`,
        description: `Learn about important cybersecurity concepts in Chapter ${chapterNumber}`,
        completed: progress.completedChapters.includes(chapterId),
        locked: !progress.unlockedChapters.includes(chapterId),
      }
    })

    setChapters(chapterList)
  }

  // Filter chapters based on the selected filter
  const filteredChapters = chapters.filter((chapter) => {
    if (filter === "all") return true
    if (filter === "completed") return chapter.completed
    if (filter === "pending") return !chapter.completed && !chapter.locked
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading chapters...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (filteredChapters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No {filter} chapters found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {filteredChapters.map((chapter) => (
        <Card
          key={chapter.id}
          className={`overflow-hidden transition-all duration-200 hover:shadow-md ${chapter.locked ? "opacity-80" : ""}`}
        >
          <CardContent className="p-0">
            <div className="p-3 sm:p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                {chapter.locked ? (
                  <Badge
                    variant="outline"
                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 dark:bg-gray-800"
                  >
                    <span className="flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-[10px] sm:text-xs">Locked</span>
                    </span>
                  </Badge>
                ) : chapter.completed ? (
                  <Badge
                    variant="default"
                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-[10px] sm:text-xs">Completed</span>
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-[10px] sm:text-xs">Pending</span>
                    </span>
                  </Badge>
                )}
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">#{chapter.id}</span>
              </div>
              <h3 className="font-semibold text-sm sm:text-lg">{chapter.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">{chapter.description}</p>
            </div>
          </CardContent>
          <CardFooter className="p-3 sm:p-4 pt-2 flex gap-2">
            {chapter.locked ? (
              <>
                <Button variant="outline" disabled className="flex-1 text-xs sm:text-sm h-8 sm:h-10">
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Locked
                </Button>
                <Button disabled className="flex-1 text-xs sm:text-sm h-8 sm:h-10">
                  Take Quiz
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="flex-1 text-xs sm:text-sm h-8 sm:h-10">
                  <Link href={`/chapters/${chapter.id}`}>
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Read
                  </Link>
                </Button>
                <Button
                  asChild
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-10"
                  onClick={() => handleChapterCompletion(chapter.id.toString())}
                >
                  <Link href={`/chapters/${chapter.id}`}>Take Quiz</Link>
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

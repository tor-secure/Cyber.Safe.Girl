"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

// Define types for chapter data
export interface Chapter {
  id: number
  title: string
  completed: boolean
  locked: boolean
}

// Define user progress interface
export interface UserProgress {
  userId: string
  email?: string
  name?: string
  completedChapters: string[]
  unlockedChapters: string[]
  finalTestUnlocked: boolean
  finalTestCompleted: boolean
  certificateUnlocked: boolean
  paymentCompleted: boolean
  finalTestScore?: number
  finalTestTotalQuestions?: number
  chapterQuizScores?: Record<string, { score: number, totalQuestions: number }>
  lastUpdated: string
}

// Define the context type
interface ProgressContextType {
  chapters: Chapter[]
  finalTestUnlocked: boolean
  certificateUnlocked: boolean
  isLoading: boolean
  refreshProgress: () => void
  progress?: UserProgress
}

// Create the context
const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

// Provider component
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [finalTestUnlocked, setFinalTestUnlocked] = useState(false)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState<UserProgress | undefined>(undefined)
  const { user } = useAuth()

  // Function to fetch user progress
  const fetchUserProgress = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      console.log("Fetching user progress for user:", user.name, "(", user.email, ")", "ID:", user.id)
      const response = await fetch(`/api/user-progress?userId=${user.id}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`)
      const data = await response.json()
      
      console.log("User progress data received:", data)
      if (data.progress) {
        // Store the full progress data
        setProgress(data.progress);
        
        const { completedChapters, unlockedChapters, finalTestUnlocked, certificateUnlocked } = data.progress
        
        console.log("Completed chapters:", completedChapters)
        console.log("Unlocked chapters:", unlockedChapters)
        
        // Format chapter IDs to match the expected format (number)
        const completedChapterIds = completedChapters.map((id: string) => parseInt(id.replace('CH-', ''), 10))
        const unlockedChapterIds = unlockedChapters.map((id: string) => parseInt(id.replace('CH-', ''), 10))
        
        console.log("Completed chapter IDs:", completedChapterIds)
        console.log("Unlocked chapter IDs:", unlockedChapterIds)
        
        // Create chapters array with correct locked/completed status
        const chaptersData = Array.from({ length: 70 }, (_, i) => {
          const chapterId = i + 1
          return {
            id: chapterId,
            title: `Chapter ${chapterId}`,
            completed: completedChapterIds.includes(chapterId),
            locked: !unlockedChapterIds.includes(chapterId),
          }
        })
        
        console.log("Setting chapters data:", chaptersData.slice(0, 5)) // Log first 5 chapters for debugging
        setChapters(chaptersData)
        setFinalTestUnlocked(finalTestUnlocked)
        setCertificateUnlocked(certificateUnlocked)
      }
    } catch (error) {
      console.error("Error fetching user progress:", error)
      // Fallback to default state if fetch fails
      const defaultChapters = Array.from({ length: 70 }, (_, i) => ({
        id: i + 1,
        title: `Chapter ${i + 1}`,
        completed: false,
        locked: i > 0, // Only first chapter unlocked by default
      }))
      setChapters(defaultChapters)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch user progress when user changes
  useEffect(() => {
    fetchUserProgress()
  }, [user?.id])

  // Provide the context value
  const value = {
    chapters,
    finalTestUnlocked,
    certificateUnlocked,
    isLoading,
    refreshProgress: fetchUserProgress,
    progress
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

// Hook to use the progress context
export function useProgress() {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider")
  }
  return context
}
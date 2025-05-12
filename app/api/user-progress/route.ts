import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// Define the structure for user progress
interface UserProgress {
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

// GET: Fetch user progress
export async function GET(request: NextRequest) {
  try {
    // Get userId from the query parameters
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const email = url.searchParams.get("email")
    const name = url.searchParams.get("name")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("User Progress API - User ID:", userId)
    if (email) console.log("User Progress API - Email:", email)
    if (name) console.log("User Progress API - Name:", name)

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Check if user progress document exists
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    const userProgressSnap = await userProgressRef.get()

    if (!userProgressSnap.exists) {
      // If no progress document exists, create a new one with only the first chapter unlocked
      const initialProgress: UserProgress = {
        userId,
        email: email || undefined,
        name: name || undefined,
        completedChapters: [],
        unlockedChapters: ["CH-001"],
        finalTestUnlocked: false,
        finalTestCompleted: false,
        certificateUnlocked: false,
        paymentCompleted: false,
        lastUpdated: new Date().toISOString(),
      }

      await userProgressRef.set(initialProgress)
      return NextResponse.json({ progress: initialProgress })
    }

    // Return existing progress
    const progress = userProgressSnap.data() as UserProgress

    // Update email and name if provided and not already in the document
    let updated = false
    if (email && !progress.email) {
      progress.email = email
      updated = true
    }
    if (name && !progress.name) {
      progress.name = name
      updated = true
    }

    // If we added email or name, update the document
    if (updated) {
      progress.lastUpdated = new Date().toISOString()
      await userProgressRef.set(progress)
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error("Error fetching user progress:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user progress"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST: Update user progress after completing a quiz
export async function POST(request: NextRequest) {
  try {
    const { userId, chapterId, score, totalQuestions, email, name } = await request.json()

    if (!userId || !chapterId) {
      return NextResponse.json({ error: "User ID and Chapter ID are required" }, { status: 400 })
    }

    console.log("User Progress API POST - User ID:", userId)
    console.log("User Progress API POST - Chapter ID:", chapterId)
    console.log("User Progress API POST - Score:", score, "out of", totalQuestions)

    // Calculate passing score (30% or higher)
    const passingScore = Math.ceil(totalQuestions * 0.3) // 30% to pass
    const passed = score >= passingScore

    console.log("User Progress API POST - Passing score:", passingScore, "Passed:", passed)

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Get current user progress
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    const userProgressSnap = await userProgressRef.get()

    let progress: UserProgress

    if (!userProgressSnap.exists) {
      // Initialize progress if it doesn't exist
      progress = {
        userId,
        email: email || undefined,
        name: name || undefined,
        completedChapters: [],
        unlockedChapters: ["CH-001"],
        finalTestUnlocked: false,
        finalTestCompleted: false,
        certificateUnlocked: false,
        paymentCompleted: false,
        lastUpdated: new Date().toISOString(),
      }
    } else {
      progress = userProgressSnap.data() as UserProgress

      // Update email and name if provided and not already in the document
      if (email && !progress.email) {
        progress.email = email
      }
      if (name && !progress.name) {
        progress.name = name
      }
    }

    // Store the chapter quiz score
    if (!progress.chapterQuizScores) {
      progress.chapterQuizScores = {};
    }
    
    // Store the score for this chapter
    progress.chapterQuizScores[chapterId] = {
      score: score,
      totalQuestions: totalQuestions
    };

    // If user passed the quiz
    if (passed) {
      // Add chapter to completed chapters if not already there
      if (!progress.completedChapters.includes(chapterId)) {
        progress.completedChapters.push(chapterId)
      }

      // Unlock next chapter if this isn't the final chapter
      const currentChapterNumber = Number.parseInt(chapterId.replace("CH-", ""))
      const nextChapterNumber = currentChapterNumber + 1

      // Format next chapter ID (e.g., "2" -> "CH-002")
      const nextChapterId = `CH-${nextChapterNumber.toString().padStart(3, "0")}`

      // Check if we need to unlock the next chapter
      let unlockedNextChapter = false

      if (nextChapterNumber <= 70 && !progress.unlockedChapters.includes(nextChapterId)) {
        progress.unlockedChapters.push(nextChapterId)
        unlockedNextChapter = true
      }

      // Check if all chapters are completed to unlock final test
      if (progress.completedChapters.length >= 70 && !progress.finalTestUnlocked) {
        progress.finalTestUnlocked = true
      }

      // Update progress in Firestore
      progress.lastUpdated = new Date().toISOString()
      await userProgressRef.set(progress)

      return NextResponse.json({
        success: true,
        passed: true,
        message: "Chapter completed successfully",
        unlockedNextChapter,
        nextChapterId: unlockedNextChapter ? nextChapterId : null,
        progress,
      })
    } else {
      // User didn't pass the quiz
      return NextResponse.json({
        success: true,
        passed: false,
        message: "Chapter not completed. Score below 30%",
        unlockedNextChapter: false,
        progress,
      })
    }
  } catch (error) {
    console.error("Error updating user progress:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update user progress"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PATCH: Update final test completion and unlock certificate
export async function PATCH(request: NextRequest) {
  try {
    const { userId, finalTestScore, totalQuestions } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Calculate passing score (30% or higher)
    const passingScore = Math.ceil(totalQuestions * 0.3)
    const passed = finalTestScore >= passingScore

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Get current user progress
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    const userProgressSnap = await userProgressRef.get()

    if (!userProgressSnap.exists) {
      return NextResponse.json({ error: "User progress not found" }, { status: 404 })
    }

    const progress = userProgressSnap.data() as UserProgress

    // Update final test completion
    progress.finalTestCompleted = true
    
    // Store the final test score and total questions
    progress.finalTestScore = finalTestScore
    progress.finalTestTotalQuestions = totalQuestions

    // Unlock certificate if passed
    if (passed) {
      progress.certificateUnlocked = true
    }

    // Update progress in Firestore
    progress.lastUpdated = new Date().toISOString()
    await userProgressRef.set(progress)

    return NextResponse.json({
      success: true,
      passed,
      certificateUnlocked: passed,
      message: passed
        ? "Final test completed successfully. Certificate unlocked!"
        : "Final test not passed. Score below 30%",
      progress,
    })
  } catch (error) {
    console.error("Error updating final test completion:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update final test completion"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
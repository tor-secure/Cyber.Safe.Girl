import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminSession } from "@/lib/server-admin-auth"

// Define the UserProgress interface
interface UserProgress {
  userId: string
  email?: string
  name?: string
  completedChapters?: string[]
  unlockedChapters?: string[]
  finalTestUnlocked?: boolean
  finalTestCompleted?: boolean
  certificateUnlocked?: boolean
  paymentCompleted?: boolean
  lastUpdated?: string
  [key: string]: any
}

// GET: Fetch all user progress (admin only)
export async function GET(request: NextRequest) {
  try {
    console.log("Admin user progress API called")

    // Verify admin session
    console.log("Verifying admin session...")
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      console.log("Admin verification failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("Admin verification successful")

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    try {
      // Fetch user progress from Firestore
      console.log("Fetching user progress from database...")

      // Try both collection names since we saw "userProgress" in the existing API
      const progressRef1 = adminDb.collection("user_progress")
      const progressRef2 = adminDb.collection("userProgress")

      const progressSnapshot1 = await progressRef1.get()
      const progressSnapshot2 = await progressRef2.get()

      let progress: UserProgress[] = []

      // Combine results from both collections
      if (!progressSnapshot1.empty) {
        progress = progress.concat(
          progressSnapshot1.docs.map((doc) => ({
            userId: doc.id,
            ...doc.data(),
          })),
        )
      }

      if (!progressSnapshot2.empty) {
        progress = progress.concat(
          progressSnapshot2.docs.map((doc) => ({
            userId: doc.id,
            ...doc.data(),
          })),
        )
      }

      // If we have user data in a different collection, try to fetch that too
      const userProgressRef = adminDb.collection("users")
      const userProgressSnapshot = await userProgressRef.get()

      if (!userProgressSnapshot.empty) {
        const userProgress = userProgressSnapshot.docs.map((doc) => {
          const data = doc.data()

          // Extract progress-related fields from user documents
          const progressData: UserProgress = {
            userId: doc.id,
            email: data.email,
            name: data.name,
            completedChapters: data.completedChapters || [],
            unlockedChapters: data.unlockedChapters || [],
            finalTestCompleted: data.finalTestCompleted || false,
            certificateUnlocked: data.certificateUnlocked || false,
            lastUpdated: data.updatedAt || data.lastUpdated,
          }

          return progressData
        })

        // Add user progress data if it's not already in the progress array
        userProgress.forEach((up) => {
          if (!progress.some((p) => p.userId === up.userId)) {
            progress.push(up)
          }
        })
      }

      console.log(`Found ${progress.length} user progress records`)
      return NextResponse.json({ progress })
    } catch (dbError) {
      console.error("Database error when fetching user progress:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when fetching user progress"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error fetching user progress:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user progress"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// GET specific user's progress
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    try {
      // Try to fetch from user_progress collection
      let userProgressDoc = await adminDb.collection("user_progress").doc(userId).get()

      // If not found, try userProgress collection
      if (!userProgressDoc.exists) {
        userProgressDoc = await adminDb.collection("userProgress").doc(userId).get()
      }

      // If still not found, try users collection
      if (!userProgressDoc.exists) {
        userProgressDoc = await adminDb.collection("users").doc(userId).get()
      }

      if (!userProgressDoc.exists) {
        return NextResponse.json({ error: "User progress not found" }, { status: 404 })
      }

      const progressData = userProgressDoc.data()

      return NextResponse.json({
        progress: {
          userId,
          ...progressData,
          completedChapters: progressData?.completedChapters || [],
          unlockedChapters: progressData?.unlockedChapters || [],
          finalTestCompleted: progressData?.finalTestCompleted || false,
          certificateUnlocked: progressData?.certificateUnlocked || false,
        },
      })
    } catch (dbError) {
      console.error("Database error when fetching user progress:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when fetching user progress"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error fetching user progress:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user progress"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

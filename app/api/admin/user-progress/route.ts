import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminSession } from "@/lib/server-admin-auth"

// Define the UserProgress interface
interface UserProgress {
  userId: string;
  email?: string;
  name?: string;
  completedChapters?: any[];
  unlockedChapters?: any[];
  finalTestUnlocked?: boolean;
  finalTestCompleted?: boolean;
  certificateUnlocked?: boolean;
  paymentCompleted?: boolean;
  lastUpdated?: string;
  [key: string]: any;
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
      
      let progress: UserProgress[] = [];
      
      // Combine results from both collections
      if (!progressSnapshot1.empty) {
        progress = progress.concat(progressSnapshot1.docs.map(doc => ({
          userId: doc.id,
          ...doc.data()
        })));
      }
      
      if (!progressSnapshot2.empty) {
        progress = progress.concat(progressSnapshot2.docs.map(doc => ({
          userId: doc.id,
          ...doc.data()
        })));
      }
      
      console.log(`Found ${progress.length} user progress records`);
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
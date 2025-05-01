import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin" // Ensure firebase-admin is initialized

export async function GET(request: NextRequest) {
  try {
    // Get userId from the query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log("Quiz Analytics API - User ID:", userId);

    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Query the userQuizAnalytics collection for the user's quiz results
    interface QuizAnalytic {
      id: string;
      userId: string;
      email?: string;
      name?: string;
      chapterId: string;
      score: number;
      totalQuestionsAttempted: number;
      submittedAt: string;
    }
    
    let quizAnalytics: QuizAnalytic[] = [];
    
    try {
      // Try the compound query first (requires composite index)
      const analyticsSnapshot = await adminDb
        .collection('userQuizAnalytics')
        .where('userId', '==', userId)
        .orderBy('submittedAt', 'desc')
        .get();
      
      console.log("Quiz Analytics API - Query executed, empty:", analyticsSnapshot.empty);
      
      if (!analyticsSnapshot.empty) {
        // Convert the snapshot to an array of analytics objects
        quizAnalytics = analyticsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            email: data.email,
            name: data.name,
            chapterId: data.chapterId,
            score: data.score,
            totalQuestionsAttempted: data.totalQuestionsAttempted,
            submittedAt: data.submittedAt,
          };
        });
      }
    } catch (error) {
      console.log("Quiz Analytics API - Compound query failed, falling back to simple query:", error);
      
      // Fallback to a simple query without ordering (doesn't require composite index)
      const analyticsSnapshot = await adminDb
        .collection('userQuizAnalytics')
        .where('userId', '==', userId)
        .get();
      
      console.log("Quiz Analytics API - Simple query executed, empty:", analyticsSnapshot.empty);
      
      if (!analyticsSnapshot.empty) {
        // Convert the snapshot to an array of analytics objects and sort manually
        quizAnalytics = analyticsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            email: data.email,
            name: data.name,
            chapterId: data.chapterId,
            score: data.score,
            totalQuestionsAttempted: data.totalQuestionsAttempted,
            submittedAt: data.submittedAt,
          };
        });
        
        // Sort manually by submittedAt in descending order
        quizAnalytics.sort((a, b) => {
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        });
      }
    }
    
    console.log("Quiz Analytics API - Processed data:", quizAnalytics.length, "records");
    
    // Return empty array if no analytics found
    if (quizAnalytics.length === 0) {
      return NextResponse.json({ quizAnalytics: [] });
    }

    console.log("Quiz Analytics API - Returning data:", quizAnalytics.length, "records");
    return NextResponse.json({ quizAnalytics });

  } catch (error) {
    console.error("Error fetching quiz analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch quiz analytics";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
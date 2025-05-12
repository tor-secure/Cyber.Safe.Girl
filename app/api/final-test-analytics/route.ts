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

    console.log("Final Test Analytics API - User ID:", userId);

    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Query the userFinalTestResults collection for the user's final test results
    interface FinalTestAnalytic {
      id: string;
      userId: string;
      testId: string;
      score: number;
      totalQuestionsAttempted: number;
      submittedAt: string;
    }
    
    let finalTestAnalytics: FinalTestAnalytic[] = [];
    
    try {
      // Try the compound query first (requires composite index)
      const analyticsSnapshot = await adminDb
        .collection('userFinalTestResults')
        .where('userId', '==', userId)
        .orderBy('submittedAt', 'desc')
        .get();
      
      console.log("Final Test Analytics API - Query executed, empty:", analyticsSnapshot.empty);
      
      if (!analyticsSnapshot.empty) {
        // Convert the snapshot to an array of analytics objects
        finalTestAnalytics = analyticsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            testId: data.testId,
            score: data.score,
            totalQuestionsAttempted: data.totalQuestionsAttempted,
            submittedAt: data.submittedAt,
          };
        });
      }
    } catch (error) {
      console.log("Final Test Analytics API - Compound query failed, falling back to simple query:", error);
      
      // Fallback to a simple query without ordering (doesn't require composite index)
      const analyticsSnapshot = await adminDb
        .collection('userFinalTestResults')
        .where('userId', '==', userId)
        .get();
      
      console.log("Final Test Analytics API - Simple query executed, empty:", analyticsSnapshot.empty);
      
      if (!analyticsSnapshot.empty) {
        // Convert the snapshot to an array of analytics objects and sort manually
        finalTestAnalytics = analyticsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            testId: data.testId,
            score: data.score,
            totalQuestionsAttempted: data.totalQuestionsAttempted,
            submittedAt: data.submittedAt,
          };
        });
        
        // Sort manually by submittedAt in descending order
        finalTestAnalytics.sort((a, b) => {
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        });
      }
    }
    
    console.log("Final Test Analytics API - Processed data:", finalTestAnalytics.length, "records");
    
    // Return empty array if no analytics found
    if (finalTestAnalytics.length === 0) {
      return NextResponse.json({ finalTestAnalytics: [] });
    }

    console.log("Final Test Analytics API - Returning data:", finalTestAnalytics.length, "records");
    return NextResponse.json({ finalTestAnalytics });

  } catch (error) {
    console.error("Error fetching final test analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch final test analytics";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
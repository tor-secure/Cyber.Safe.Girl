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
    const analyticsSnapshot = await adminDb
      .collection('userQuizAnalytics')
      .where('userId', '==', userId)
      .orderBy('submittedAt', 'desc')
      .get();

    console.log("Quiz Analytics API - Query executed, empty:", analyticsSnapshot.empty);

    if (analyticsSnapshot.empty) {
      return NextResponse.json({ quizAnalytics: [] });
    }

    // Convert the snapshot to an array of analytics objects
    const quizAnalytics = analyticsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        chapterId: data.chapterId,
        score: data.score,
        totalQuestionsAttempted: data.totalQuestionsAttempted,
        submittedAt: data.submittedAt,
      };
    });

    console.log("Quiz Analytics API - Returning data:", quizAnalytics.length, "records");
    return NextResponse.json({ quizAnalytics });

  } catch (error) {
    console.error("Error fetching quiz analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch quiz analytics";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
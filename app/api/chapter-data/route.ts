import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin" // Ensure firebase-admin is initialized

export async function GET(request: NextRequest) {
  try {
    // Extract chapterId from the query parameters
    const chapterId = request.nextUrl.searchParams.get('chapterId');
    
    console.log("Chapter Data API GET - Chapter ID:", chapterId);

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
    }

    // Check if Firebase admin is not initialized
    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Reference to the document containing the chapter data
    const chapterDataRef = adminDb.doc(`Chapter Data/${chapterId}`);
    const chapterDataSnap = await chapterDataRef.get();

    // If chapter data doesn't exist for this chapter, return an error
    if (!chapterDataSnap.exists) {
      console.log("Chapter Data API GET - Data not found for chapter:", chapterId);
      
      return NextResponse.json({
        error: `No data found for chapter ${chapterId}. Please check back later.`
      }, { status: 404 });
    }

    const chapterData = chapterDataSnap.data();
    
    // Return the chapter data
    return NextResponse.json({
      data: chapterData?.Data || "",
      name: chapterData?.Name || "",
      yt_link: chapterData?.YT_Link || "",
      tips_precautions: chapterData?.Tips_Precautions || ""
    });

  } catch (error) {
    console.error("Error fetching chapter data:", error);
    return NextResponse.json({ error: "Failed to fetch chapter data" }, { status: 500 });
  }
}
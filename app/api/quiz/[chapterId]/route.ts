import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin" // Ensure firebase-admin is initialized

// Helper function to get random items from an array
function getRandomItems(array: any[], count: number) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// --- GET Method: Fetch and send only quiz questions ---
export async function GET(request: NextRequest, { params }: { params: { chapterId: string } }) {
  try {
    // Explicitly await params before destructuring
    const resolvedParams = await params;
    const { chapterId } = resolvedParams;

    // Reference to the document containing the questions for the chapter
    const questionsRef = adminDb?.doc(`Quiz-DB/${chapterId}/question-set/questions`)

    if (!questionsRef) {
      return NextResponse.json({ error: "Firebase admin not initialized" }, { status: 500 })
    }

    const questionsSnap = await questionsRef.get()

    if (!questionsSnap.exists) {
      return NextResponse.json({ error: "Questions not found for this chapter" }, { status: 404 })
    }

    const questionsData = questionsSnap.data() || {}

    // Convert questions object to an array
    const questionsArray = Object.keys(questionsData).map((qId) => ({
      id: qId,
      ...questionsData[qId],
    }))

    // Select 10 random questions
    const randomQuestions = getRandomItems(questionsArray, 10)

    // Send only the questions to the frontend
    return NextResponse.json({
      questions: randomQuestions,
    })

  } catch (error) {
    console.error("Error fetching quiz questions:", error)
    return NextResponse.json({ error: "Failed to fetch quiz questions" }, { status: 500 })
  }
}


// --- POST Method: Receive answers, evaluate, store analytics, and respond ---
export async function POST(request: NextRequest, { params }: { params: { chapterId: string } }) {
  try {
    const resolvedParams = await params;
    const { chapterId } = resolvedParams;

    // Get user answers from the request body
    // Expecting format: { userAnswers: { "questionId1": "userAnswer1", "questionId2": "userAnswer2", ... } }
    const { userAnswers, userId } = await request.json() // Assuming userId is sent from frontend

    if (!userAnswers || typeof userAnswers !== 'object') {
        return NextResponse.json({ error: "Invalid user answers format" }, { status: 400 });
    }
     if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }


    // Reference to the document containing the correct answers for the chapter
    const answersRef = adminDb?.doc(`Quiz-DB/${chapterId}/answer-key/answers`)

    if (!answersRef) {
      return NextResponse.json({ error: "Firebase admin not initialized" }, { status: 500 })
    }

    const answersSnap = await answersRef.get()

    if (!answersSnap.exists) {
      return NextResponse.json({ error: "Answer key not found for this chapter" }, { status: 404 })
    }

    const correctAnswersData = answersSnap.data() || {}

    // --- Evaluate User Answers ---
    let score = 0
    const totalQuestionsAttempted = Object.keys(userAnswers).length
    const evaluationDetails: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean }> = {}

    for (const questionId in userAnswers) {
      const userAnswer = userAnswers[questionId]
      const correctAnswer = correctAnswersData[questionId]
      const isCorrect = userAnswer === correctAnswer

      if (isCorrect) {
        score++
      }
console.log(`Question ID: ${questionId}, User Answer: ${userAnswer}, Correct Answer: ${correctAnswer}, Is Correct: ${isCorrect}`)
;

      evaluationDetails[questionId] = {
        userAnswer: userAnswer,
        correctAnswer: correctAnswer || "N/A", // Handle cases where correct answer might be missing
        isCorrect: isCorrect,
      }
    }

    // // --- Prepare User Analytics ---
    // const userAnalytics = {
    //   chapterId: chapterId,
    //   userId: userId, // Include the user ID
    //   score: score,
    //   totalQuestionsAttempted: totalQuestionsAttempted,
    //   // You can add more details like timestamp, evaluation details, etc.
    //   // evaluationDetails: evaluationDetails, // Optional: include detailed evaluation
    //   submittedAt: new Date().toISOString(),
    // }

    // --- Store User Analytics in Firestore ---
    // Example: Storing analytics in a 'userQuizAnalytics' collection
    // You might want a different structure, e.g., nested under the user document
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase admin not initialized" }, { status: 500 });
    }
    // const analyticsRef = adminDb.collection('userQuizAnalytics').doc(`${userId}_${chapterId}_${Date.now()}`); // Unique doc ID
    // await analyticsRef.set(userAnalytics);

    // --- Send User Analytics back to Frontend ---
    return NextResponse.json({
      message: "Quiz evaluated successfully",
      score: score,
      totalQuestionsAttempted: totalQuestionsAttempted,
      evaluationDetails: evaluationDetails,
      // analytics: userAnalytics, // Send the calculated analytics back
    })

  } catch (error) {
    console.error("Error evaluating quiz:", error)
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Failed to evaluate quiz";
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


// i want to make get method where question is sent to front and after , and after the user is done with quiz the user given answer is sent to sent back to backend via post method and these answer should be evaluated against actual answer and the marks should be sent to firestore db , prompt: provide me get and post method for this
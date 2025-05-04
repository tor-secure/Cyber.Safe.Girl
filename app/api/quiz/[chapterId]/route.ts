import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin" // Ensure firebase-admin is initialized

// Helper function to get random items from an array
function getRandomItems(array: any[], count: number) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// --- GET Method: Fetch and send only quiz questions ---
export async function GET(request: NextRequest) {
  try {
    // Extract chapterId from the URL
    const chapterId = request.nextUrl.pathname.split('/').pop();
    
    console.log("Quiz API GET - Chapter ID:", chapterId);

    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Reference to the document containing the questions for the chapter
    const questionsRef = adminDb.doc(`Quiz-DB/${chapterId}/question-set/questions`)

    const questionsSnap = await questionsRef.get()

    // If questions don't exist for this chapter, create a default set
    if (!questionsSnap.exists) {
      console.log("Quiz API GET - Questions not found for chapter:", chapterId);
      
      // Define the question type
      interface QuizQuestion {
        question: string;
        options: {
          A: string;
          B: string;
          C: string;
          D: string;
        };
      }
      
      // Create default questions for this chapter
      const defaultQuestions: Record<string, QuizQuestion> = {
        "Q1": {
          question: "What is the most common type of cyber attack?",
          options: {
            A: "Phishing",
            B: "Malware",
            C: "DDoS",
            D: "SQL Injection"
          }
        },
        "Q2": {
          question: "Which of these is a strong password?",
          options: {
            A: "password123",
            B: "P@ssw0rd!2023",
            C: "qwerty",
            D: "12345678"
          }
        },
        "Q3": {
          question: "What is two-factor authentication?",
          options: {
            A: "Using two different passwords",
            B: "Logging in from two different devices",
            C: "Using something you know and something you have for authentication",
            D: "Changing your password twice a month"
          }
        }
      };
      
      // Create default answer key
      const defaultAnswerKey = {
        "Q1": "A",
        "Q2": "B",
        "Q3": "C"
      };
      
      // Save default questions to Firestore
      await questionsRef.set(defaultQuestions);
      
      // Save default answer key
      const answerKeyRef = adminDb.doc(`Quiz-DB/${chapterId}/answer-key/answers`);
      await answerKeyRef.set(defaultAnswerKey);
      
      // Convert questions object to an array for response
      const questionsArray = Object.keys(defaultQuestions).map((qId) => ({
        id: qId,
        ...defaultQuestions[qId],
      }));
      
      return NextResponse.json({
        questions: questionsArray,
      });
    }

    // Define the question type if not already defined
    interface QuizQuestion {
      question: string;
      options: {
        A: string;
        B: string;
        C: string;
        D: string;
      };
    }
    
    const questionsData = questionsSnap.data() as Record<string, QuizQuestion> || {}

    // Convert questions object to an array
    const questionsArray = Object.keys(questionsData).map((qId) => ({
      id: qId,
      ...questionsData[qId],
    }))

    // Select 10 random questions or all if less than 10
    const count = Math.min(questionsArray.length, 10);
    const randomQuestions = getRandomItems(questionsArray, count)
    
    console.log("Quiz API GET - Returning", randomQuestions.length, "questions");

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
export async function POST(request: NextRequest) {
  try {
    // Extract chapterId from the URL
    const chapterId = request.nextUrl.pathname.split('/').pop();
    
    console.log("Quiz API POST - Chapter ID:", chapterId);

    // Get user answers from the request body
    // Expecting format: { userAnswers: { "questionId1": "userAnswer1", "questionId2": "userAnswer2", ... } }
    const { userAnswers, userId } = await request.json() // Assuming userId is sent from frontend

    console.log("Quiz API POST - User ID:", userId);
    console.log("Quiz API POST - User Answers:", JSON.stringify(userAnswers));

    if (!userAnswers || typeof userAnswers !== 'object') {
        return NextResponse.json({ error: "Invalid user answers format" }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }



    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Reference to the document containing the correct answers for the chapter
    const answersRef = adminDb.doc(`Quiz-DB/${chapterId}/answer-key/answers`)

    const answersSnap = await answersRef.get()

    if (!answersSnap.exists) {
      console.log("Quiz API POST - Answer key not found for chapter:", chapterId);
      return NextResponse.json({ error: "Answer key not found for this chapter" }, { status: 404 })
    }

    const correctAnswersData = answersSnap.data() || {}

    // --- Evaluate User Answers ---
    let score = 0
    const totalQuestionsAttempted = Object.keys(userAnswers).length
    const evaluationDetails: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean }> = {}

    console.log("User Answers:", JSON.stringify(userAnswers));
    console.log("Correct Answers:", JSON.stringify(correctAnswersData));

    for (const questionId in userAnswers) {
      const userAnswer = userAnswers[questionId]
      const correctAnswer = correctAnswersData[questionId]
      const isCorrect = userAnswer === correctAnswer

      if (isCorrect) {
        score++
      }
      
      console.log(`Question ID: ${questionId}, User Answer: ${userAnswer}, Correct Answer: ${correctAnswer}, Is Correct: ${isCorrect}`);

      evaluationDetails[questionId] = {
        userAnswer: userAnswer,
        correctAnswer: correctAnswer || "N/A", // Handle cases where correct answer might be missing
        isCorrect: isCorrect,
      }
    }
    
    console.log(`Final Score: ${score}/${totalQuestionsAttempted}`);
    console.log("Evaluation Details:", JSON.stringify(evaluationDetails));

    // --- Prepare User Analytics ---
    const userAnalytics = {
      chapterId: chapterId,
      userId: userId, // Include the user ID
      score: score,
      totalQuestionsAttempted: totalQuestionsAttempted,
      // You can add more details like timestamp, evaluation details, etc.
      // evaluationDetails: evaluationDetails, // Optional: include detailed evaluation
      submittedAt: new Date().toISOString(),
    }

    // --- Store User Analytics in Firestore ---
    // Example: Storing analytics in a 'userQuizAnalytics' collection
    // You might want a different structure, e.g., nested under the user document
    const analyticsRef = adminDb.collection('userQuizAnalytics').doc(`${userId}_${chapterId}_${Date.now()}`); // Unique doc ID
    await analyticsRef.set(userAnalytics);
    
    console.log("Quiz API POST - Analytics stored in Firestore");

    // --- Send User Analytics back to Frontend ---
    return NextResponse.json({
      message: "Quiz evaluated successfully",
      score: score,
      totalQuestionsAttempted: totalQuestionsAttempted,
      evaluationDetails: evaluationDetails,
      analytics: userAnalytics, // Send the calculated analytics back
    }, { status: 200 })

  } catch (error) {
    console.error("Error evaluating quiz:", error)
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Failed to evaluate quiz";
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


// i want to make get method where question is sent to front and after , and after the user is done with quiz the user given answer is sent to sent back to backend via post method and these answer should be evaluated against actual answer and the marks should be sent to firestore db , prompt: provide me get and post method for this

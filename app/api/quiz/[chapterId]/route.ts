import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin" // Ensure firebase-admin is initialized

// Helper function to get random items from an array
function getRandomItems(array: any[], count: number) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Mock data for development/testing when Firebase admin is not initialized
const mockQuestions = [
  {
    id: "Q1",
    question: "What is the most common type of cyber attack?",
    options: {
      A: "Phishing",
      B: "Malware",
      C: "DDoS",
      D: "SQL Injection"
    }
  },
  {
    id: "Q2",
    question: "Which of these is a strong password?",
    options: {
      A: "password123",
      B: "P@ssw0rd!2023",
      C: "qwerty",
      D: "12345678"
    }
  },
  {
    id: "Q3",
    question: "What is two-factor authentication?",
    options: {
      A: "Using two different passwords",
      B: "Logging in from two different devices",
      C: "Using something you know and something you have for authentication",
      D: "Changing your password twice a month"
    }
  },
  {
    id: "Q4",
    question: "What should you do if you receive a suspicious email?",
    options: {
      A: "Open any attachments to check them",
      B: "Click on links to verify them",
      C: "Reply to the sender asking for verification",
      D: "Delete it or report it as spam"
    }
  },
  {
    id: "Q5",
    question: "What is a VPN used for?",
    options: {
      A: "Speeding up your internet connection",
      B: "Encrypting your internet traffic",
      C: "Blocking all websites",
      D: "Sharing your location with websites"
    }
  },
  {
    id: "Q6",
    question: "Which of these is NOT a sign of a phishing email?",
    options: {
      A: "Poor grammar and spelling",
      B: "Urgent requests for personal information",
      C: "Mismatched or suspicious URLs",
      D: "Email comes from a known colleague with their correct email address"
    }
  },
  {
    id: "Q7",
    question: "What is malware?",
    options: {
      A: "A hardware component",
      B: "A type of computer memory",
      C: "Malicious software designed to harm or exploit devices",
      D: "A secure messaging app"
    }
  },
  {
    id: "Q8",
    question: "What is the purpose of a firewall?",
    options: {
      A: "To cool down your computer",
      B: "To monitor and filter network traffic",
      C: "To speed up your internet connection",
      D: "To store your passwords"
    }
  },
  {
    id: "Q9",
    question: "What is social engineering in cybersecurity?",
    options: {
      A: "Building social networks securely",
      B: "Manipulating people into divulging confidential information",
      C: "Creating social media accounts",
      D: "Designing social websites"
    }
  },
  {
    id: "Q10",
    question: "Which of these is a best practice for online security?",
    options: {
      A: "Using the same password for all accounts",
      B: "Sharing your OTP with trusted friends",
      C: "Regularly updating your software and devices",
      D: "Connecting to any available public Wi-Fi"
    }
  }
];

// Mock answer key for development/testing
const mockAnswerKey = {
  "Q1": "A",
  "Q2": "B",
  "Q3": "C",
  "Q4": "D",
  "Q5": "B",
  "Q6": "D",
  "Q7": "C",
  "Q8": "B",
  "Q9": "B",
  "Q10": "C"
};

// --- GET Method: Fetch and send only quiz questions ---
export async function GET(request: NextRequest, { params }: { params: { chapterId: string } }) {
  try {
    // Explicitly await params before destructuring
    const resolvedParams = await params;
    const { chapterId } = resolvedParams;
    
    console.log("Quiz API GET - Chapter ID:", chapterId);
    console.log("Quiz API GET - Firebase Admin DB initialized:", !!adminDb);

    // If Firebase admin is not initialized, return mock data for development/testing
    if (!adminDb) {
      console.log("Quiz API GET - Using mock data due to Firebase admin not being initialized");
      return NextResponse.json({
        questions: mockQuestions.map(q => ({...q, chapter: chapterId})),
      });
    }

    // Reference to the document containing the questions for the chapter
    const questionsRef = adminDb.doc(`Quiz-DB/${chapterId}/question-set/questions`)

    const questionsSnap = await questionsRef.get()

    if (!questionsSnap.exists) {
      console.log("Quiz API GET - Questions not found for chapter:", chapterId);
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
export async function POST(request: NextRequest, { params }: { params: { chapterId: string } }) {
  try {
    const resolvedParams = await params;
    const { chapterId } = resolvedParams;
    
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

    console.log("Quiz API POST - Firebase Admin DB initialized:", !!adminDb);

    // If Firebase admin is not initialized, use mock data for development/testing
    if (!adminDb) {
      console.log("Quiz API POST - Using mock data due to Firebase admin not being initialized");
      
      // --- Evaluate User Answers with mock data ---
      let score = 0
      const totalQuestionsAttempted = Object.keys(userAnswers).length
      const evaluationDetails: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean }> = {}

      for (const questionId in userAnswers) {
        const userAnswer = userAnswers[questionId]
        const correctAnswer = mockAnswerKey[questionId] || "A" // Default to "A" if not found
        const isCorrect = userAnswer === correctAnswer

        if (isCorrect) {
          score++
        }
        
        console.log(`Question ID: ${questionId}, User Answer: ${userAnswer}, Correct Answer: ${correctAnswer}, Is Correct: ${isCorrect}`);

        evaluationDetails[questionId] = {
          userAnswer: userAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect,
        }
      }
      
      console.log(`Final Score: ${score}/${totalQuestionsAttempted}`);

      // --- Prepare User Analytics ---
      const userAnalytics = {
        chapterId: chapterId,
        userId: userId,
        score: score,
        totalQuestionsAttempted: totalQuestionsAttempted,
        submittedAt: new Date().toISOString(),
      }

      return NextResponse.json({
        message: "Quiz evaluated successfully (mock data)",
        score: score,
        totalQuestionsAttempted: totalQuestionsAttempted,
        evaluationDetails: evaluationDetails,
        analytics: userAnalytics,
      }, { status: 200 })
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
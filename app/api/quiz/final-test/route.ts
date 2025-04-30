import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// Mock data for development/testing when Firebase admin is not initialized
const mockQuestions = [
  {
    id: "FT1",
    question: "What is the most effective way to protect your online accounts?",
    options: {
      A: "Using the same password for all accounts",
      B: "Using two-factor authentication",
      C: "Sharing your password with trusted friends",
      D: "Never changing your password"
    }
  },
  {
    id: "FT2",
    question: "Which of the following is a sign of a phishing email?",
    options: {
      A: "Comes from a known sender with their correct email address",
      B: "Has proper grammar and spelling",
      C: "Contains urgent requests for personal information",
      D: "Has a professional company logo"
    }
  },
  {
    id: "FT3",
    question: "What should you do if you suspect your personal information has been compromised?",
    options: {
      A: "Ignore it as nothing will happen",
      B: "Share it on social media to warn others",
      C: "Change all your passwords immediately",
      D: "Wait and see if there's any suspicious activity"
    }
  },
  {
    id: "FT4",
    question: "Which of the following is NOT a good practice for secure online shopping?",
    options: {
      A: "Using a credit card instead of a debit card",
      B: "Checking that the website URL starts with 'https'",
      C: "Saving your payment information on all websites for convenience",
      D: "Shopping only on reputable websites"
    }
  },
  {
    id: "FT5",
    question: "What is social engineering in cybersecurity?",
    options: {
      A: "Building secure social networks",
      B: "Manipulating people into divulging confidential information",
      C: "Creating social media accounts securely",
      D: "Designing social websites"
    }
  },
  {
    id: "FT6",
    question: "Which section of the IT Act deals with publishing obscene material in electronic form?",
    options: {
      A: "Section 65",
      B: "Section 66",
      C: "Section 67",
      D: "Section 68"
    }
  },
  {
    id: "FT7",
    question: "What is the best way to protect your mobile device?",
    options: {
      A: "Never installing any apps",
      B: "Using a strong PIN/password and keeping software updated",
      C: "Disabling all security features for convenience",
      D: "Sharing your PIN with family members"
    }
  },
  {
    id: "FT8",
    question: "What is ransomware?",
    options: {
      A: "Software that speeds up your computer",
      B: "Malware that blocks access to your data until you pay a ransom",
      C: "A type of antivirus program",
      D: "A secure way to transfer money online"
    }
  },
  {
    id: "FT9",
    question: "Which of the following is the best practice for creating secure passwords?",
    options: {
      A: "Using your name followed by your birth year",
      B: "Using the same password for all accounts",
      C: "Using a long passphrase with a mix of characters",
      D: "Writing down all your passwords in a notebook"
    }
  },
  {
    id: "FT10",
    question: "What is the purpose of privacy settings on social media?",
    options: {
      A: "To make your profile more attractive",
      B: "To control who can see your personal information",
      C: "To increase your number of followers",
      D: "To improve the loading speed of your profile"
    }
  }
];

// Mock answer key for development/testing
const mockAnswerKey = {
  "FT1": "B",
  "FT2": "C",
  "FT3": "C",
  "FT4": "C",
  "FT5": "B",
  "FT6": "C",
  "FT7": "B",
  "FT8": "B",
  "FT9": "C",
  "FT10": "B"
};

// GET: Fetch final test questions
export async function GET(request: NextRequest) {
  try {
    console.log("Final Test API GET - Firebase Admin DB initialized:", !!adminDb);

    // If Firebase admin is not initialized, return mock data for development/testing
    if (!adminDb) {
      console.log("Final Test API GET - Using mock data due to Firebase admin not being initialized");
      return NextResponse.json({
        questions: mockQuestions,
      });
    }

    // Reference to the document containing the questions for the final test
    const questionsRef = adminDb.doc('Quiz-DB/final-test/question-set/questions');
    const questionsSnap = await questionsRef.get();

    if (!questionsSnap.exists) {
      console.log("Final Test API GET - Questions not found for final test");
      return NextResponse.json({ error: "Questions not found for the final test" }, { status: 404 });
    }

    const questionsData = questionsSnap.data() || {};

    // Convert questions object to an array
    const questionsArray = Object.keys(questionsData).map((qId) => ({
      id: qId,
      ...questionsData[qId],
    }));

    console.log("Final Test API GET - Returning", questionsArray.length, "questions");

    // Send only the questions to the frontend
    return NextResponse.json({
      questions: questionsArray,
    });

  } catch (error) {
    console.error("Error fetching final test questions:", error);
    return NextResponse.json({ error: "Failed to fetch final test questions" }, { status: 500 });
  }
}

// POST: Receive answers, evaluate, store analytics, and respond
export async function POST(request: NextRequest) {
  try {
    console.log("Final Test API POST - Firebase Admin DB initialized:", !!adminDb);

    // Get user answers from the request body
    const { userAnswers, userId } = await request.json();

    console.log("Final Test API POST - User ID:", userId);
    console.log("Final Test API POST - User Answers:", JSON.stringify(userAnswers));

    if (!userAnswers || typeof userAnswers !== 'object') {
      return NextResponse.json({ error: "Invalid user answers format" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // If Firebase admin is not initialized, use mock data for development/testing
    if (!adminDb) {
      console.log("Final Test API POST - Using mock data due to Firebase admin not being initialized");
      
      // --- Evaluate User Answers with mock data ---
      let score = 0;
      const totalQuestionsAttempted = Object.keys(userAnswers).length;
      const evaluationDetails: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean }> = {};

      for (const questionId in userAnswers) {
        const userAnswer = userAnswers[questionId];
        const correctAnswer = mockAnswerKey[questionId] || "A"; // Default to "A" if not found
        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) {
          score++;
        }
        
        console.log(`Question ID: ${questionId}, User Answer: ${userAnswer}, Correct Answer: ${correctAnswer}, Is Correct: ${isCorrect}`);

        evaluationDetails[questionId] = {
          userAnswer: userAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect,
        };
      }
      
      console.log(`Final Score: ${score}/${totalQuestionsAttempted}`);

      // --- Prepare User Analytics ---
      const userAnalytics = {
        testId: "final-test",
        userId: userId,
        score: score,
        totalQuestionsAttempted: totalQuestionsAttempted,
        submittedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        message: "Final test evaluated successfully (mock data)",
        score: score,
        totalQuestionsAttempted: totalQuestionsAttempted,
        evaluationDetails: evaluationDetails,
        analytics: userAnalytics,
      }, { status: 200 });
    }

    // Reference to the document containing the correct answers for the final test
    const answersRef = adminDb.doc('Quiz-DB/final-test/answer-key/answers');
    const answersSnap = await answersRef.get();

    if (!answersSnap.exists) {
      console.log("Final Test API POST - Answer key not found for final test");
      return NextResponse.json({ error: "Answer key not found for the final test" }, { status: 404 });
    }

    const correctAnswersData = answersSnap.data() || {};

    // --- Evaluate User Answers ---
    let score = 0;
    const totalQuestionsAttempted = Object.keys(userAnswers).length;
    const evaluationDetails: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean }> = {};

    console.log("User Answers:", JSON.stringify(userAnswers));
    console.log("Correct Answers:", JSON.stringify(correctAnswersData));

    for (const questionId in userAnswers) {
      const userAnswer = userAnswers[questionId];
      const correctAnswer = correctAnswersData[questionId];
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) {
        score++;
      }
      
      console.log(`Question ID: ${questionId}, User Answer: ${userAnswer}, Correct Answer: ${correctAnswer}, Is Correct: ${isCorrect}`);

      evaluationDetails[questionId] = {
        userAnswer: userAnswer,
        correctAnswer: correctAnswer || "N/A", // Handle cases where correct answer might be missing
        isCorrect: isCorrect,
      };
    }
    
    console.log(`Final Score: ${score}/${totalQuestionsAttempted}`);
    console.log("Evaluation Details:", JSON.stringify(evaluationDetails));

    // --- Prepare User Analytics ---
    const userAnalytics = {
      testId: "final-test",
      userId: userId,
      score: score,
      totalQuestionsAttempted: totalQuestionsAttempted,
      submittedAt: new Date().toISOString(),
    };

    // --- Store User Analytics in Firestore ---
    const analyticsRef = adminDb.collection('userFinalTestResults').doc(`${userId}_${Date.now()}`); // Unique doc ID
    await analyticsRef.set(userAnalytics);
    
    console.log("Final Test API POST - Analytics stored in Firestore");

    // --- Send User Analytics back to Frontend ---
    return NextResponse.json({
      message: "Final test evaluated successfully",
      score: score,
      totalQuestionsAttempted: totalQuestionsAttempted,
      evaluationDetails: evaluationDetails,
      analytics: userAnalytics,
    }, { status: 200 });

  } catch (error) {
    console.error("Error evaluating final test:", error);
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Failed to evaluate final test";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
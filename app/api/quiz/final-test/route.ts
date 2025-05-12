import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// GET: Fetch final test questions
export async function GET(request: NextRequest) {
  try {
    console.log("Final Test API GET - Fetching questions");

    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Reference to the document containing the questions for the final test
    const questionsRef = adminDb.doc('Quiz-DB/FINAL/question-set/questions');
    const questionsSnap = await questionsRef.get();

    if (!questionsSnap.exists) {
      console.log("Final Test API GET - Questions not found for final test, creating default questions");
      
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
      
      // Create default questions for the final test
      const defaultQuestions: Record<string, QuizQuestion> = {
        "FT1": {
          question: "What is the most effective way to protect your online accounts?",
          options: {
            A: "Using the same password for all accounts",
            B: "Using two-factor authentication",
            C: "Sharing your password with trusted friends",
            D: "Never changing your password"
          }
        },
        "FT2": {
          question: "Which of the following is a sign of a phishing email?",
          options: {
            A: "Comes from a known sender with their correct email address",
            B: "Has proper grammar and spelling",
            C: "Contains urgent requests for personal information",
            D: "Has a professional company logo"
          }
        },
        "FT3": {
          question: "What should you do if you suspect your personal information has been compromised?",
          options: {
            A: "Ignore it as nothing will happen",
            B: "Share it on social media to warn others",
            C: "Change all your passwords immediately",
            D: "Wait and see if there's any suspicious activity"
          }
        }
      };
      
      // Create default answer key
      const defaultAnswerKey = {
        "FT1": "B",
        "FT2": "C",
        "FT3": "C"
      };
      
      // Save default questions to Firestore
      await questionsRef.set(defaultQuestions);
      
      // Save default answer key
      const answerKeyRef = adminDb.doc('Quiz-DB/FINAL/answer-key/answers');
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
    
    const questionsData = questionsSnap.data() as Record<string, QuizQuestion> || {};

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
    console.log("Final Test API POST - Evaluating answers");

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

    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Reference to the document containing the correct answers for the final test
    const answersRef = adminDb.doc('Quiz-DB/FINAL/answer-key/answers');
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
      testId: "FINAL",
      userId: userId,
      score: score,
      totalQuestionsAttempted: totalQuestionsAttempted,
      submittedAt: new Date().toISOString(),
    };

    // --- Store User Analytics in Firestore ---
    const analyticsRef = adminDb.collection('userFinalTestResults').doc(`${userId}_${Date.now()}`); // Unique doc ID
    await analyticsRef.set(userAnalytics);
    
    console.log("Final Test API POST - Analytics stored in Firestore");

    // Calculate passing score (30% or higher)
    const passingScore = Math.ceil(totalQuestionsAttempted * 0.3);
    const passed = score >= passingScore;

    // Get user progress data to retrieve email and name
    const userProgressRef = adminDb.collection("userProgress").doc(userId);
    const userProgressSnap = await userProgressRef.get();
    
    if (userProgressSnap.exists) {
      const progressData = userProgressSnap.data();
      
      // Update progress to mark final test as completed and store score
      const updateData: any = {
        finalTestCompleted: true,
        finalTestScore: score,
        finalTestTotalQuestions: totalQuestionsAttempted,
        lastUpdated: new Date().toISOString()
      };
      
      // If user passed, unlock certificate
      if (passed) {
        updateData.certificateUnlocked = true;
      }
      
      await userProgressRef.update(updateData);
      
      console.log("Final Test API POST - User progress updated with score:", score, "out of", totalQuestionsAttempted);
      if (passed) {
        console.log("Final Test API POST - Certificate unlocked");
      }
    }

    // --- Send User Analytics back to Frontend ---
    return NextResponse.json({
      message: "Final test evaluated successfully",
      score: score,
      totalQuestionsAttempted: totalQuestionsAttempted,
      evaluationDetails: evaluationDetails,
      analytics: userAnalytics,
      passed: passed,
      certificateUnlocked: passed
    }, { status: 200 });

  } catch (error) {
    console.error("Error evaluating final test:", error);
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Failed to evaluate final test";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
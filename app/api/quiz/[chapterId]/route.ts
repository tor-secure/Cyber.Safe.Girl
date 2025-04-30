import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// Helper function to get random items from an array
function getRandomItems(array: any[], count: number) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Remove the entire final-test handling block and keep only regular chapter handling
export async function GET(request: NextRequest, { params }: { params: { chapterId: string } }) {
    try {
      const { chapterId } = params;
  
      const questionsRef = adminDb?.doc(`Quiz-DB/${chapterId}/question-set/questions`);
      const answersRef = adminDb?.doc(`Quiz-DB/${chapterId}/answer-key/answers`);
  
      if (!questionsRef || !answersRef) {
        return NextResponse.json({ error: "Firebase admin not initialized" }, { status: 500 });
      }
  
      const [questionsSnap, answersSnap] = await Promise.all([questionsRef.get(), answersRef.get()]);
  
      const questionsData = questionsSnap.data() || {};
      const answersData = answersSnap.data() || {};
  
      const questionsArray = Object.keys(questionsData).map((qId) => ({
        id: qId,
        ...questionsData[qId],
      }));
  
      const randomQuestions = getRandomItems(questionsArray, 10);
  
      const selectedAnswers: Record<string, string> = {};
      randomQuestions.forEach((q) => {
        if (answersData[q.id]) {
          selectedAnswers[q.id] = answersData[q.id];
        }
      });
  
      return NextResponse.json({
        questions: randomQuestions,
        answerKey: selectedAnswers,
      });
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      return NextResponse.json({ error: "Failed to fetch quiz data" }, { status: 500 });
    }
  }

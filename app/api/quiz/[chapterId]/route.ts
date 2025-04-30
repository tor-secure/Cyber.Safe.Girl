import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// Helper function to get random items from an array
function getRandomItems(array: any[], count: number) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Update the GET function to properly await params
export async function GET(request: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    // Await the params object before destructuring
    const { chapterId } = await params

    // Rest of the function remains the same
    // Handle final test (fetch from multiple chapters)
    if (chapterId === "final-test") {
      // For final test, we need to fetch questions from multiple chapters
      const allQuestions: any[] = []
      const allAnswers: Record<string, string> = {}

      // Fetch from chapters 1-70 (or however many exist)
      // For demo purposes, we'll just fetch from chapters 1-10
      for (let i = 1; i <= 10; i++) {
        const paddedChapter = `CH-${String(i).padStart(3, "0")}`

        try {
          const questionsRef = adminDb?.doc(`Quiz-DB/${paddedChapter}/question-set/questions`)
          const answersRef = adminDb?.doc(`Quiz-DB/${paddedChapter}/answer-key/answers`)

          if (questionsRef && answersRef) {
            const [questionsSnap, answersSnap] = await Promise.all([questionsRef.get(), answersRef.get()])

            const chapterQuestions = questionsSnap.data() || {}
            const chapterAnswers = answersSnap.data() || {}

            // Add chapter identifier to question IDs to avoid conflicts
            Object.keys(chapterQuestions).forEach((qId) => {
              const newId = `${paddedChapter}_${qId}`
              allQuestions.push({
                id: newId,
                ...chapterQuestions[qId],
                originalId: qId,
                chapter: paddedChapter,
              })

              if (chapterAnswers[qId]) {
                allAnswers[newId] = chapterAnswers[qId]
              }
            })
          }
        } catch (error) {
          console.error(`Error fetching from chapter ${paddedChapter}:`, error)
          // Continue with other chapters
        }
      }

      // Get 30 random questions for final test
      const randomQuestions = getRandomItems(allQuestions, 30)

      // Create answer key for selected questions
      const selectedAnswers: Record<string, string> = {}
      randomQuestions.forEach((q) => {
        if (allAnswers[q.id]) {
          selectedAnswers[q.id] = allAnswers[q.id]
        }
      })

      return NextResponse.json({
        questions: randomQuestions,
        answerKey: selectedAnswers,
      })
    }
    // Handle regular chapter quiz
    else {
      const questionsRef = adminDb?.doc(`Quiz-DB/${chapterId}/question-set/questions`)
      const answersRef = adminDb?.doc(`Quiz-DB/${chapterId}/answer-key/answers`)

      if (!questionsRef || !answersRef) {
        return NextResponse.json({ error: "Firebase admin not initialized" }, { status: 500 })
      }

      const [questionsSnap, answersSnap] = await Promise.all([questionsRef.get(), answersRef.get()])

      const questionsData = questionsSnap.data() || {}
      const answersData = answersSnap.data() || {}

      // Convert to array format for easier random selection
      const questionsArray = Object.keys(questionsData).map((qId) => ({
        id: qId,
        ...questionsData[qId],
      }))

      // Get 10 random questions
      const randomQuestions = getRandomItems(questionsArray, 10)

      // Create answer key for selected questions
      const selectedAnswers: Record<string, string> = {}
      randomQuestions.forEach((q) => {
        if (answersData[q.id]) {
          selectedAnswers[q.id] = answersData[q.id]
        }
      })

      return NextResponse.json({
        questions: randomQuestions,
        answerKey: selectedAnswers,
      })
    }
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return NextResponse.json({ error: "Failed to fetch quiz data" }, { status: 500 })
  }
}

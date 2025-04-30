// app/api/quiz/[chapterId]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// helper to pick random questions
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// universal CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://cybersafegirl.vercel.app",               // <-- lock this down in prod
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  // browser preflight
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET(request: NextRequest, { params }: { params: { chapterId: string } }) {
  const { chapterId } = params

  try {
    // fetch questions + answers
    const questionsRef = adminDb?.doc(`Quiz-DB/${chapterId}/question-set/questions`)
    const answersRef   = adminDb?.doc(`Quiz-DB/${chapterId}/answer-key/answers`)

    const [qSnap, aSnap] = await Promise.all([questionsRef.get(), answersRef.get()])
    const questionsData = qSnap.data() ?? {}
    const answersData   = aSnap.data() ?? {}

    const questionsArray = Object.entries(questionsData).map(([id, payload]) => ({
      id,
      ...(payload as object),
    }))

    const randomQuestions = getRandomItems(questionsArray, 10)
    const answerKey: Record<string, string> = {}
    randomQuestions.forEach(q => {
      if (answersData[q.id]) answerKey[q.id] = answersData[q.id]
    })

    const body = JSON.stringify({ questions: randomQuestions, answerKey })
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    })
  } catch (err) {
    console.error("Error fetching quiz data:", err)
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch quiz data" }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

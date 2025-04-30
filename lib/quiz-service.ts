// quiz-service.ts
// Define types for our quiz data
export interface QuizQuestion {
    id: string
    question: string
    options: Record<string, string>
    chapter?: string
    originalId?: string
  }
  
  export type AnswerKey = Record<string, string>
  
  // Function to fetch quiz questions for a specific chapter
  export async function fetchQuizQuestions(chapterId: string): Promise<QuizQuestion[]> {
    const response = await fetch(`/api/quiz/${chapterId}`)
  
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz questions: ${response.statusText}`)
    }
  
    const data = await response.json()
    return data.questions || []
  }
  
  // Function to fetch answer key for a specific chapter
  export async function fetchAnswerKey(chapterId: string): Promise<AnswerKey> {
    const response = await fetch(`/api/quiz/${chapterId}`)
  
    if (!response.ok) {
      throw new Error(`Failed to fetch answer key: ${response.statusText}`)
    }
  
    const data = await response.json()
    return data.answerKey || {}
  }
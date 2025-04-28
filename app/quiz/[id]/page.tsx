import { DashboardLayout } from "@/components/dashboard-layout"
import { QuizContent } from "@/components/quiz-content"

export default function QuizPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <QuizContent chapterId={params.id} />
    </DashboardLayout>
  )
}

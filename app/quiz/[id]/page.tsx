import { DashboardLayout } from "@/components/dashboard-layout"
import { QuizContent } from "@/components/quiz-content"

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  return (
    <DashboardLayout>
      <QuizContent chapterId={id} />
    </DashboardLayout>
  )
}

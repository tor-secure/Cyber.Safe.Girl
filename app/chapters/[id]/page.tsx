// import { DashboardLayout } from "@/components/dashboard-layout"
import { ChapterContent } from "@/components/chapter-content"

export default function ChapterPage({ params }: { params: { id: string } }) {
  return (
   
      <ChapterContent chapterId={params.id} />
    // </DashboardLayout>
  )
}

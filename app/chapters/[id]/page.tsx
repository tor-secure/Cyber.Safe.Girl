import { ChapterContent } from "@/components/chapter-content";

// Define the page component as async
export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <ChapterContent chapterId={id} />
  );
}
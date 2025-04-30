import { ChapterContent } from "@/components/chapter-content";

// Make the function async
export default async function ChapterPage({ params }: { params: { id: string } }) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <ChapterContent chapterId={id} />
  );
}
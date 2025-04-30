import { ChapterContent } from "@/components/chapter-content";

// ✅ Make the function async to fix the "params should be awaited" error
export default async function ChapterPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return <ChapterContent chapterId={id} />;
}

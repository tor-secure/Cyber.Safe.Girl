import { ChapterContent } from "@/components/chapter-content";

export default function ChapterPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <ChapterContent chapterId={id} />
  );
}
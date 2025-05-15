"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Info, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { QuizModal } from "@/components/quiz-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress-context";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProgress {
  userId: string;
  completedChapters: string[];
  unlockedChapters: string[];
  finalTestUnlocked: boolean;
  finalTestCompleted: boolean;
  certificateUnlocked: boolean;
  lastUpdated: string;
  chapterQuizScores?: Record<string, { score: number, totalQuestions: number }>;
}

export function ChapterContent({ chapterId }: { chapterId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshProgress } = useProgress(); // Get refreshProgress function from progress context
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [chapterCompleted, setChapterCompleted] = useState(false);
  const [chapterUnlocked, setChapterUnlocked] = useState(false);
  const [chapterScore, setChapterScore] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [relevantSections, setRelevantSections] = useState<string | null>(null);
  const [loadingRelevantSections, setLoadingRelevantSections] = useState(false);
  const [relevantSectionsError, setRelevantSectionsError] = useState<string | null>(null);
  const { toast } = useToast();

  // Format chapter ID for API calls (e.g., "1" -> "CH-001")
  const formattedChapterId = `CH-${chapterId.padStart(3, '0')}`;

  // Fetch relevant sections from Firebase
  useEffect(() => {
    async function fetchRelevantSections() {
      if (!formattedChapterId) return;
      
      setLoadingRelevantSections(true);
      setRelevantSectionsError(null);
      
      try {
        const response = await fetch(`/api/relevant-sections?chapterId=${formattedChapterId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setRelevantSections(data.content);
      } catch (err: any) {
        console.error("Failed to fetch relevant sections:", err);
        setRelevantSectionsError("Failed to load relevant sections for this chapter.");
      } finally {
        setLoadingRelevantSections(false);
      }
    }
    
    fetchRelevantSections();
  }, [formattedChapterId]);

  // Fetch user progress when component mounts
  useEffect(() => {
    async function fetchUserProgress() {
      if (!user) {
        router.push('/login');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/user-progress?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setUserProgress(data.progress);
        
        // Check if this chapter is completed
        const isCompleted = data.progress.completedChapters.includes(formattedChapterId);
        setChapterCompleted(isCompleted);
        
        // Check if this chapter is unlocked
        const isUnlocked = data.progress.unlockedChapters.includes(formattedChapterId);
        setChapterUnlocked(isUnlocked);
        
        // Check if we have stored scores for this chapter
        if (data.progress.chapterQuizScores && data.progress.chapterQuizScores[formattedChapterId]) {
          const chapterScore = data.progress.chapterQuizScores[formattedChapterId];
          setChapterScore(chapterScore.score);
          setTotalQuestions(chapterScore.totalQuestions);
        }
        
        // If chapter is not unlocked, redirect to dashboard
        if (!isUnlocked) {
          toast({
            title: "Chapter Locked",
            description: "You need to complete previous chapters to unlock this one.",
            variant: "destructive",
          });
          // We'll let the user stay on the page but disable interactions
        }
        
        // Fetch quiz analytics for this chapter if it's been completed
        if (isCompleted) {
          try {
            const analyticsResponse = await fetch(`/api/quiz-analytics?userId=${user.id}&chapterId=${formattedChapterId}`);
            
            if (analyticsResponse.ok) {
              const analyticsData = await analyticsResponse.json();
              
              if (analyticsData.quizAnalytics && analyticsData.quizAnalytics.length > 0) {
                // Filter analytics for the current chapter only
                const chapterAnalytics = analyticsData.quizAnalytics.filter(
                  (analytics: any) => analytics.chapterId === formattedChapterId
                );
                
                if (chapterAnalytics.length > 0) {
                  // Get the most recent attempt for this chapter
                  const latestAttempt = chapterAnalytics.sort(
                    (a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                  )[0];
                  
                  setChapterScore(latestAttempt.score);
                  setTotalQuestions(latestAttempt.totalQuestionsAttempted);
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch quiz analytics:", err);
            // Don't set error here as it's not critical
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch user progress:", err);
        setError(err.message || "Failed to check if you have access to this chapter.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserProgress();
  }, [user, router, formattedChapterId]);

  // This would come from an API in a real application
  const chapterData = {
    id: chapterId,
    title:
      chapterId === "1"
        ? "Mobile Recharge Shop"
        : chapterId === "2"
        ? "Debit Card Cloning"
        : `Chapter ${chapterId}`,
    content:
      chapterId === "1"
        ? `If you want to recharge your mobile phone, which is the place that you would go - a local mobile recharge shop near your house or by the customer care of the mobile service provider? Ideally, most of us would say the former one as it is more convenient. Did you know that this could be a potential source of being a victim of cybercrime?

It is like giving off your personal information like phone number as well as ID proofs to a complete stranger. The stranger can send an SMS to your phone asking you to click on a link or scan a QR code which may result in money being debited from your account or in worse cases even your phone being hacked.`
        : chapterId === "2"
        ? `We swipe our credit and debit cards at various places like restaurants, petrol pumps, shopping malls etc. We need to check the swiping device for any extra attachments. Sometimes the scammers might have tampered with the card reader and attached with an extra skimming device. When you swipe your card, the skimming device captures your card details and the scamster may use it for fraudulent transactions.

The scamster may even install a hidden camera near the ATM to capture your card details and PIN that was entered. So covering the keypad with your hand while you are entering your pin, as well as not sharing your PIN with anyone (including your friends) is a good practice to avoid being a victim of a fraudulent transaction.`
        : `This is the content for Chapter ${chapterId}. In a real application, this would be fetched from a database or API.`,
    sections: [
      {
        title: "Relevant Sections",
        content: relevantSections || 
          (loadingRelevantSections 
            ? "Loading relevant sections..." 
            : relevantSectionsError 
              ? relevantSectionsError 
              : "No relevant sections available for this chapter."),
      },
      {
        title: "Tips / Precautions",
        content:
          chapterId === "1"
            ? `Precautions: While recharging your mobile prepaid card account you have to give your mobile number to the vendor. Though ideally one should go to the Customer Care Centre of the Mobile Service Provider to get the recharge done but as a matter of convenience people approach a local vendor who keeps prepaid vouchers of practically all the mobile service providers and of all denominations. Thereby for recharging they end up giving their cell numbers and hence the scope of misuse. It is advisable to get the recharge done online or through the Customer Care Centre or one should take the voucher and key in the digits by themselves or ask some trusted person to do it for them.`
            : chapterId === "2"
            ? `Be attentive, be careful and save your money from being transferred into the hand of scamsters. Always check the ATM machine for any suspicious devices or cameras before using it. Cover the keypad when entering your PIN. Regularly monitor your bank statements for any unauthorized transactions. If you notice any suspicious activity, report it to your bank immediately.`
            : "This section would contain tips and precautions related to this chapter.",
      },
    ],
    videoUrl: `https://www.youtube.com/embed/example-${chapterId}`,
  };

  const handleQuizComplete = (score: number, totalQuestions: number, passed: boolean) => {
    // Set the score specifically for this chapter
    setChapterScore(score);
    setTotalQuestions(totalQuestions);

    if (passed && !chapterCompleted) {
      setChapterCompleted(true);
      
      // Update local state to reflect changes
      if (userProgress) {
        const updatedProgress = { ...userProgress };
        
        if (!updatedProgress.completedChapters.includes(formattedChapterId)) {
          updatedProgress.completedChapters.push(formattedChapterId);
        }
        
        // Store the chapter score in the progress object if it doesn't exist
        if (!updatedProgress.chapterQuizScores) {
          updatedProgress.chapterQuizScores = {};
        }
        
        // Update the score for this specific chapter
        updatedProgress.chapterQuizScores[formattedChapterId] = {
          score: score,
          totalQuestions: totalQuestions
        };
        
        // Unlock next chapter
        const chapterNumber = parseInt(chapterId);
        const nextChapterId = `CH-${(chapterNumber + 1).toString().padStart(3, '0')}`;
        
        if (!updatedProgress.unlockedChapters.includes(nextChapterId)) {
          updatedProgress.unlockedChapters.push(nextChapterId);
        }
        
        setUserProgress(updatedProgress);
      }
            
      // Refresh the progress context to update the sidebar
      refreshProgress();
      console.log("Progress refreshed after quiz completion");
      
      toast({
        title: "Chapter Completed!",
        description: `You've successfully completed Chapter ${chapterId}. The next chapter is now unlocked.`,
        variant: "default",
      });
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mr-2" />
          <p className="text-lg font-medium">Loading chapter data...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !chapterUnlocked ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Chapter Locked</CardTitle>
            <CardDescription>You need to complete previous chapters to unlock this one.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">This chapter is locked</p>
            <p className="text-center text-muted-foreground mb-6">
              Complete the previous chapters to unlock this content.
            </p>
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {chapterData.title}
                      </CardTitle>
                      <CardDescription>Chapter {chapterId} of 70</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setIsQuizModalOpen(true)}
                      disabled={!chapterUnlocked}
                    >
                      Take a Test
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pblue dark:pblue-invert max-w-none">
                  <p>{chapterData.content}</p>

                  <div className="aspect-video mt-6 rounded-lg overflow-hidden">
                    <iframe
                      src={chapterData.videoUrl}
                      className="w-full h-full"
                      title={`Episode ${chapterId}: ${chapterData.title}`}
                      allowFullScreen
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-full md:w-80 space-y-4 sticky top-20">
              <Card>
                <CardHeader>
                  <CardTitle>Chapter Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" asChild className="justify-start">
                      <Link
                        href={`/chapters/${Number.parseInt(chapterId) - 1}`}
                        className={
                          Number.parseInt(chapterId) <= 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Previous Chapter
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className={`justify-start ${
                        !chapterCompleted || Number.parseInt(chapterId) >= 70 ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <Link href={`/chapters/${Number.parseInt(chapterId) + 1}`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Next Chapter
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="justify-start">
                      <Link href="/dashboard">
                        <Info className="mr-2 h-4 w-4" />
                        Back to Dashboard
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <span className="text-sm font-medium">
                        {chapterCompleted ? "Completed" : "Not Taken"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Score:</span>
                      <span className="text-sm font-medium">
                        {chapterScore !== null && totalQuestions !== null
                          ? `${chapterScore}/${totalQuestions}`
                          : "N/A"}
                      </span>
                    </div>
                    <Button
                      className="w-full mt-2"
                      onClick={() => setIsQuizModalOpen(true)}
                      disabled={!chapterUnlocked}
                    >
                      {chapterCompleted ? "Retake Test" : "Take Test"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="sections">
            <TabsList>
              <TabsTrigger value="sections">Additional Sections</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            <TabsContent value="sections" className="space-y-4">
              {chapterData.sections.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.title === "Relevant Sections" && typeof section.content === 'string' ? (
                      <div className="space-y-2">
                        {section.content.split('\n').map((line, lineIndex) => {
                          // Check if the line is a category header (ends with a colon)
                          if (line.trim().endsWith(':')) {
                            return (
                              <h3 key={lineIndex} className="font-bold text-lg mt-4 text-blue-600">
                                {line}
                              </h3>
                            );
                          } 
                          // Check if it's an empty line
                          else if (line.trim() === '') {
                            return <div key={lineIndex} className="h-2"></div>;
                          }
                          // Regular content line
                          else {
                            return (
                              <p key={lineIndex} className="ml-4">
                                {line}
                              </p>
                            );
                          }
                        })}
                      </div>
                    ) : (
                      <div className="whitespace-pre-line">{section.content}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <Link
                        href="#"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Downloadable PDF Guide
                      </Link>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <Link
                        href="#"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Related Case Studies
                      </Link>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <Link
                        href="#"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Additional Reading Materials
                      </Link>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <QuizModal
            open={isQuizModalOpen}
            onOpenChange={setIsQuizModalOpen}
            chapterId={formattedChapterId}
            onComplete={handleQuizComplete}
          />
        </>
      )}
    </div>
  );
}
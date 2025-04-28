"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileText, Info } from "lucide-react"
import Link from "next/link"
import { QuizModal } from "@/components/quiz-modal"
import { useToast } from "@/hooks/use-toast"

export function ChapterContent({ chapterId }: { chapterId: string }) {
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [chapterCompleted, setChapterCompleted] = useState(Number.parseInt(chapterId) <= 1)
  const [chapterScore, setChapterScore] = useState<number | null>(Number.parseInt(chapterId) <= 1 ? 8 : null)
  const [totalQuestions, setTotalQuestions] = useState<number | null>(Number.parseInt(chapterId) <= 1 ? 10 : null)
  const { toast } = useToast()

  // This would come from an API in a real application
  const chapterData = {
    id: chapterId,
    title:
      chapterId === "1" ? "Mobile Recharge Shop" : chapterId === "2" ? "Debit Card Cloning" : `Chapter ${chapterId}`,
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
        content:
          chapterId === "1"
            ? `IPC Sections (to be applied to the Shop Keeper)
IPC Section 354A - Sexual Harassment and punishment for Sexual Harassment
IPC Section 354C - Voyeurism
IPC Section 383/384 - Extortion (IF ANY DEMAND)
IPC Section 503 - Criminal Intimidation
IPC Section 506 - Punishment for Criminal Intimidation
IPC Section 509 - Word, gesture or act intended to insult modesty of a woman
IT Act:
IT Act Section 66E - Punishment for violation of privacy Mobile Number Sale to Stalkers by Recharge Shop`
            : chapterId === "2"
              ? `IPC Sections:
IPC Section 420 - Cheating and dishonestly inducing delivery of property
IPC Section 467 - Forgery of valuable security, will, etc.
IPC Section 468 - Forgery for purpose of cheating
IT Act:
IT Act Section 66C - Punishment for identity theft
IT Act Section 66D - Punishment for cheating by personation by using computer resource`
              : "This section would contain relevant legal sections for this chapter.",
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
  }

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    setChapterScore(score)
    setTotalQuestions(totalQuestions)

    // Mark chapter as completed if score is at least 70%
    const passingScore = Math.ceil(totalQuestions * 0.7)
    const passed = score >= passingScore

    if (passed && !chapterCompleted) {
      setChapterCompleted(true)
      toast({
        title: "Chapter Completed!",
        description: `You've successfully completed Chapter ${chapterId}. The next chapter is now unlocked.`,
        variant: "success",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{chapterData.title}</CardTitle>
                  <CardDescription>Chapter {chapterId} of 60</CardDescription>
                </div>
                <Button onClick={() => setIsQuizModalOpen(true)}>Take a Test</Button>
              </div>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
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
                    className={Number.parseInt(chapterId) <= 1 ? "pointer-events-none opacity-50" : ""}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Previous Chapter
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className={`justify-start ${!chapterCompleted ? "pointer-events-none opacity-50" : ""}`}
                >
                  <Link href={`/chapters/${Number.parseInt(chapterId) + 1}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Next Chapter
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/">
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
                  <span className="text-sm font-medium">{chapterCompleted ? "Completed" : "Not Taken"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Score:</span>
                  <span className="text-sm font-medium">
                    {chapterScore !== null && totalQuestions !== null ? `${chapterScore}/${totalQuestions}` : "N/A"}
                  </span>
                </div>
                <Button className="w-full mt-2" onClick={() => setIsQuizModalOpen(true)}>
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
                <div className="whitespace-pre-line">{section.content}</div>
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
                  <Link href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                    Downloadable PDF Guide
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Link href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                    Related Case Studies
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Link href="#" className="text-blue-600 hover:underline dark:text-blue-400">
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
        chapterId={chapterId}
        onComplete={handleQuizComplete}
      />
    </div>
  )
}

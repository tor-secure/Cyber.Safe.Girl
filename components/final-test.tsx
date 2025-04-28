"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Trophy, CreditCard } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FinalTest() {
  const [score] = useState(6)
  const [totalQuestions] = useState(30)
  const [passingScore] = useState(12)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showVoucherDialog, setShowVoucherDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const isPassing = score >= passingScore

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Final Assessment</CardTitle>
          <CardDescription>Test your knowledge of all cybersecurity concepts covered in the course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex items-center justify-center w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="text-center">
                <div className="text-3xl font-bold">{score}</div>
                <div className="text-sm text-muted-foreground">out of {totalQuestions}</div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {!isPassing ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Your score is below the passing threshold of {passingScore} points. You need to score at least{" "}
                    {passingScore} points to pass the final test and receive your certificate.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                  <Trophy className="h-4 w-4" />
                  <AlertTitle>Congratulations!</AlertTitle>
                  <AlertDescription>
                    You have passed the final test. You can now download your certificate.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Score</span>
                  <span>{Math.round((score / totalQuestions) * 100)}%</span>
                </div>
                <Progress value={(score / totalQuestions) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span
                    className={`${isPassing ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    Passing: {Math.round((passingScore / totalQuestions) * 100)}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={() => setShowPaymentDialog(true)}>
            Take Retest
          </Button>
          {isPassing && (
            <Button variant="outline" asChild className="flex-1">
              <Link href="/certificate">View Certificate</Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
          <CardDescription>Breakdown of your performance in the final test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalQuestions - score}</div>
                    <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round((score / totalQuestions) * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Areas for Improvement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Identity Theft Prevention (40% accuracy)</li>
                <li>Online Banking Security (50% accuracy)</li>
                <li>Social Media Privacy (60% accuracy)</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Review All Questions
          </Button>
        </CardFooter>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Required</DialogTitle>
            <DialogDescription>A payment of ₹499 is required to take the final test again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Select Payment Method</h4>
              <RadioGroup value={paymentMethod || ""} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    Credit/Debit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="cursor-pointer">
                    UPI
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer">
                  <RadioGroupItem value="netbanking" id="netbanking" />
                  <Label htmlFor="netbanking" className="cursor-pointer">
                    Net Banking
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer">
                  <RadioGroupItem value="voucher" id="voucher" />
                  <Label htmlFor="voucher" className="cursor-pointer">
                    Redeem Voucher
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="sm:w-auto w-full">
              Cancel
            </Button>
            {paymentMethod === "voucher" ? (
              <Button
                onClick={() => {
                  setShowPaymentDialog(false)
                  setShowVoucherDialog(true)
                }}
                className="sm:w-auto w-full"
              >
                Apply Voucher
              </Button>
            ) : (
              <Button disabled={!paymentMethod} className="sm:w-auto w-full">
                Pay ₹499
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voucher Dialog */}
      <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Voucher</DialogTitle>
            <DialogDescription>Enter your voucher code to get access to the final test.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="voucher-code">Voucher Code</Label>
              <div className="flex gap-2">
                <input
                  id="voucher-code"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter voucher code"
                />
                <Button variant="outline">Verify</Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">How to get a voucher?</h4>
              <Tabs defaultValue="purchase">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="purchase">Purchase</TabsTrigger>
                  <TabsTrigger value="earn">Earn Free</TabsTrigger>
                </TabsList>
                <TabsContent value="purchase" className="p-4 border rounded-md mt-2">
                  <p className="text-sm">You can purchase vouchers from our partners or directly from our website.</p>
                  <Button className="mt-4 w-full">Buy Voucher</Button>
                </TabsContent>
                <TabsContent value="earn" className="p-4 border rounded-md mt-2">
                  <p className="text-sm">Complete challenges or refer friends to earn free vouchers.</p>
                  <Button className="mt-4 w-full">View Challenges</Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoucherDialog(false)}>
              Cancel
            </Button>
            <Button>Apply Voucher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

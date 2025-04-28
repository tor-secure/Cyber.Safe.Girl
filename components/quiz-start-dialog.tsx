"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface QuizStartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: string
}

export function QuizStartDialog({ open, onOpenChange, chapterId }: QuizStartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Are you sure you want to take a test?</DialogTitle>
          <DialogDescription>Once you start a test, you cannot exit unless you submit your answers.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Notes:
            </h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>We recommend you to read entire chapter before taking up the test</li>
              <li>To reveal the next chapter, one must need to give the current chapter test</li>
              <li>Test is not time bounded</li>
            </ul>
          </div>
          <div className="text-sm">
            <span className="font-medium">Current Score:</span>{" "}
            {Number.parseInt(chapterId) <= 1 ? "8" : "No Test Taken"}
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto w-full">
            Cancel
          </Button>
          <Button asChild className="sm:w-auto w-full">
            <Link href={`/quiz/${chapterId}`}>Start Test</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

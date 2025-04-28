"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatDialog } from "./chat-dialog"
import { motion, AnimatePresence } from "framer-motion"

export function ChatButton() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show the chat button on the chat page or during tests/quizzes
  if (
    pathname === "/chat" ||
    pathname.includes("/quiz") ||
    pathname.includes("/final-test") ||
    pathname.startsWith("/quiz/")
  ) {
    return null
  }

  return (
    <>
      <AnimatePresence>{isOpen && <ChatDialog open={isOpen} onOpenChange={setIsOpen} />}</AnimatePresence>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={`rounded-full w-14 h-14 shadow-lg ${
            isOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
          aria-label={isOpen ? "Close chat" : "Open chat with Saanvi"}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? "close" : "open"}
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </motion.div>
          </AnimatePresence>
        </Button>
      </motion.div>
    </>
  )
}

"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/api-config"
import { getFallbackResponse, useChatApiStatus } from "@/components/chat/chat-fallback"

interface Message {
  id: string
  text: string
  sender: "user" | "saanvi"
  timestamp: string
  isError?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Add this near the top of the component
  const { isApiAvailable, isChecking } = useChatApiStatus()

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Then update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInputMessage("")
    setIsLoading(true)

    // If API is not available, use fallback responses
    if (isApiAvailable === false) {
      setTimeout(() => {
        const fallbackResponse = getFallbackResponse(inputMessage)

        const newBotMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: fallbackResponse,
          sender: "saanvi",
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, newBotMessage])
        setIsLoading(false)
      }, 1000)
      return
    }

    try {
      // Call the real backend API
      const response = await fetch(API_ENDPOINTS.chat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMessage }),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const data = await response.json()

      const newBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "saanvi",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, newBotMessage])
    } catch (error) {
      console.error("Error sending message:", error)

      // Use fallback response if API call fails
      const fallbackResponse = getFallbackResponse(inputMessage)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: "saanvi",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-4">
          <Button onClick={() => router.back()} variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="bg-blue-50 dark:bg-blue-950 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-blue-200">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Saanvi" />
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Chat with Saanvi</CardTitle>
                <CardDescription>Your Cyber Safety Assistant</CardDescription>
              </div>
              <div className={`ml-auto w-2 h-2 rounded-full ${isLoading ? "bg-amber-500" : "bg-green-500"}`}></div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Chat messages */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                    <Bot className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">Welcome to Cyber Safe Girl</h3>
                  <p className="text-muted-foreground">
                    Hi, I'm Saanvi, your cyber safety assistant. How can I help you today?
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.sender === "saanvi" && (
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-[80%] shadow-sm",
                          message.sender === "user"
                            ? "bg-blue-600 text-white"
                            : message.isError
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-white dark:bg-gray-800",
                        )}
                      >
                        <p className="text-sm">{message.text}</p>
                        <span className="text-[10px] opacity-70 block text-right mt-1">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-blue-100 text-blue-800">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="flex space-x-2">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

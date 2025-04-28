
"use client"

import React, { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, ArrowDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/api-config"
import { getFallbackResponse, useChatApiStatus } from "./chat-fallback"
import '@/styles/chat-animations.css'

interface Message {
  id: string
  text: string
  sender: "user" | "saanvi"
  timestamp: string
  isError?: boolean
}

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isApiAvailable } = useChatApiStatus()

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Handle scroll button visibility
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100
      setShowScrollButton(isNotAtBottom && messages.length > 3)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    // Add user message
    const userMsg: Message = {
      id: String(Date.now()),
      text: inputMessage.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputMessage("")
    setIsLoading(true)

    // Fallback if API offline
    if (isApiAvailable === false) {
      setTimeout(() => {
        const fallback = getFallbackResponse(inputMessage)
        setMessages(prev => [
          ...prev,
          { id: String(Date.now()+1), text: fallback, sender: "saanvi", timestamp: new Date().toISOString() }
        ])
        setIsLoading(false)
      }, 1000)
      return
    }

    try {
      const res = await fetch(API_ENDPOINTS.chat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMessage }),
      })
      if (!res.ok) throw new Error("Network response was not ok")
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { id: String(Date.now()+1), text: data.response, sender: "saanvi", timestamp: new Date().toISOString() }
      ])
    } catch {
      const fallback = getFallbackResponse(inputMessage)
      setMessages(prev => [
        ...prev,
        { id: String(Date.now()+1), text: fallback, sender: "saanvi", timestamp: new Date().toISOString(), isError: true }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[450px] md:max-w-[550px] h-[85vh] sm:h-[75vh] p-0 flex flex-col rounded-xl shadow-2xl overflow-hidden border-0 gap-0">
        {/* Header */}
        <div className="flex items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white border-b border-blue-700">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 border-2 border-white/20 shadow-md">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Saanvi" />
              <AvatarFallback className="bg-blue-800 text-white">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h2 className="text-xl font-bold tracking-tight">Saanvi</h2>
              <div className="flex items-center">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full mr-2",
                    isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                  )}
                />
                <p className="text-sm font-medium text-blue-100">
                  {isLoading ? "Thinking..." : "Online"}
                </p>
              </div>
            </div>
          </div>
          <div className="ml-auto text-sm font-medium text-blue-100">
            Cyber Safety Assistant
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 shadow-md">
                <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Welcome to Cyber Safe Girl
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-xs">
                Hi, I'm Saanvi. Ask me anything about staying safe online, 
                protecting your privacy, or dealing with cyberbullying.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                {[ "What is phishing?",  "Is this website safe?"].map((suggestion) => (
                  <Button 
                    key={suggestion}
                    variant="outline"
                    className="text-sm justify-start text-left h-auto py-2 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => {
                      setInputMessage(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "flex mb-4",
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.sender === "saanvi" && (
                    <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0 shadow-sm">
                      <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-[80%] shadow-sm",
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : msg.isError
                        ? "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30 rounded-tl-none"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none"
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                    <span className="block text-[10px] mt-1 opacity-70 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex mb-3"
            >
              <Avatar className="h-8 w-8 mr-2 mt-1 shadow-sm">
                <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-gray-800 rounded-2xl py-3 px-4 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-none">
                <div className="flex space-x-2 h-5 items-center">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-4 z-10 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.button>
        )}

        {/* Input */}
        <form 
          onSubmit={handleSubmit} 
          className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 h-12 shadow-sm focus-visible:ring-blue-500 focus-visible:ring-offset-0 bg-gray-50 dark:bg-gray-900"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !inputMessage.trim()} 
            className="rounded-full w-12 h-12 flex-shrink-0 shadow-md bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Send className="h-5 w-5 text-white" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

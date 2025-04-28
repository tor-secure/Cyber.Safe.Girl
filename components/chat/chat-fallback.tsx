"use client"

import { useState, useEffect } from "react"
import { API_ENDPOINTS } from "@/lib/api-config"

export function useChatApiStatus() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`${API_ENDPOINTS.chat}/status`, {
          method: "GET",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setIsApiAvailable(response.ok)
      } catch (error) {
        console.error("API check failed:", error)
        setIsApiAvailable(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkApiStatus()
  }, [])

  return { isApiAvailable, isChecking }
}

// Fallback responses when API is not available
export const getFallbackResponse = (message: string): string => {
  const lowercaseMessage = message.toLowerCase()

  // Common cybersecurity questions and responses
  if (lowercaseMessage.includes("password") || lowercaseMessage.includes("secure password")) {
    return "Strong passwords should be at least 12 characters long and include a mix of uppercase letters, lowercase letters, numbers, and special characters. Avoid using personal information or common words."
  }

  if (lowercaseMessage.includes("phishing") || lowercaseMessage.includes("suspicious email")) {
    return "To identify phishing emails, look for spelling errors, suspicious sender addresses, urgent requests, and unexpected attachments. Never click on suspicious links or download attachments from unknown sources."
  }

  if (lowercaseMessage.includes("social media") || lowercaseMessage.includes("privacy settings")) {
    return "To protect your privacy on social media, regularly review your privacy settings, be selective about what you share, avoid accepting friend requests from strangers, and be cautious about the information you include in your profile."
  }

  if (lowercaseMessage.includes("cyberbullying")) {
    return "If you're experiencing cyberbullying, don't respond to the bully, save evidence of the bullying, block the person, report the behavior to the platform, and talk to a trusted adult or counselor about what you're experiencing."
  }

  // Default responses
  const defaultResponses = [
    "That's a great question about online safety. Remember to always protect your personal information online.",
    "Staying safe online is important. Make sure to use strong passwords and be careful about what you share.",
    "Cyber safety is about being aware of potential risks and taking steps to protect yourself.",
    "I'm here to help with your cyber safety questions. Is there something specific you'd like to know?",
    "Remember that once information is online, it can be difficult to completely remove it.",
    "It's important to think before you post or share anything online.",
  ]

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

"use client"

import { useState, useEffect, useCallback } from "react"

// Extended types for browser-specific fullscreen APIs
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>
  mozRequestFullScreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

interface FullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>
  mozCancelFullScreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
  webkitFullscreenElement?: Element
  mozFullScreenElement?: Element
  msFullscreenElement?: Element
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)

  const fullscreenSupported =
    typeof document !== "undefined" &&
    (
      document.documentElement.requestFullscreen ||
      (document.documentElement as FullscreenElement).webkitRequestFullscreen ||
      (document.documentElement as FullscreenElement).mozRequestFullScreen ||
      (document.documentElement as FullscreenElement).msRequestFullscreen
    )

  const requestFullscreen = useCallback(async (element: HTMLElement = document.documentElement) => {
    try {
      setFullscreenError(null)
      const el = element as FullscreenElement

      if (el.requestFullscreen) {
        await el.requestFullscreen()
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen()
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen()
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen()
      } else {
        throw new Error("Fullscreen API not supported")
      }

      setIsFullscreen(true)
      return true
    } catch (error) {
      console.error("Failed to enter fullscreen mode:", error)
      setFullscreenError(error instanceof Error ? error.message : "Failed to enter fullscreen mode")
      setIsFullscreen(false)
      return false
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      const doc = document as FullscreenDocument

      if (doc.exitFullscreen) {
        await doc.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen()
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen()
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen()
      }

      setIsFullscreen(false)
      return true
    } catch (error) {
      console.error("Failed to exit fullscreen mode:", error)
      return false
    }
  }, [])

  const toggleFullscreen = useCallback(
    async (element: HTMLElement = document.documentElement) => {
      if (isFullscreen) {
        return exitFullscreen()
      } else {
        return requestFullscreen(element)
      }
    },
    [isFullscreen, requestFullscreen, exitFullscreen],
  )

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument
      const isCurrentlyFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  return {
    isFullscreen,
    fullscreenSupported,
    fullscreenError,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}

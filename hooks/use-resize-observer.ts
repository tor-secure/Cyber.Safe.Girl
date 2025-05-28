"use client"

import type React from "react"

import { useEffect, useRef } from "react"

export function useResizeObserver(
  ref: React.RefObject<HTMLDivElement>,
  callback: (entry: ResizeObserverEntry) => void,
) {
  const observer = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    if (ref.current) {
      observer.current = new ResizeObserver((entries) => {
        if (entries[0]) {
          callback(entries[0])
        }
      })

      observer.current.observe(ref.current)
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [ref, callback])
}

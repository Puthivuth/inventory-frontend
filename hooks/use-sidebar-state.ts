"use client"

import { useState, useEffect } from "react"

const SIDEBAR_STORAGE_KEY = "sidebar-open"

export function useSidebarState() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setIsSidebarOpen(stored === "true")
    }
    setIsInitialized(true)
  }, [])

  // Update localStorage when state changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen))
    }
  }, [isSidebarOpen, isInitialized])

  return [isSidebarOpen, setIsSidebarOpen] as const
}

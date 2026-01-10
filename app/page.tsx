"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/api"

export default function HomePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser()

      if (user) {
        router.push("/inventory")
        return
      }

      setIsLoggedIn(false)
      setIsLoading(false)
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="font-bold text-base sm:text-lg md:text-xl">InvoiceBI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/login">
              <Button size="sm" className="text-xs sm:text-sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Inventory & Invoice Management
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Complete business solution for inventory tracking, invoice generation, and intelligent analytics
          </p>
        </div>

        <div className="bg-blue-600 text-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to streamline your business?</h2>
          <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
            Start managing your inventory, creating invoices, and analyzing your business performance all in one place.
          </p>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50 text-sm sm:text-base"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

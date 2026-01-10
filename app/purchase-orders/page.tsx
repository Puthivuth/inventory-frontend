"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Menu, AlertCircle } from "lucide-react"
import { getCurrentUser } from "@/lib/api"
import { Sidebar } from "@/components/navigation/sidebar"
import { PurchaseOrderTable } from "@/components/purchase-orders/purchase-order-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSidebarState } from "@/hooks/use-sidebar-state"

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsLoggedIn(true)
      setIsLoading(false)
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            {!isSidebarOpen && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="bg-white hover:bg-gray-50 text-gray-700 shadow-sm border flex-shrink-0"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-orange-600 text-white flex-shrink-0">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Purchase Orders</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">
                Create and manage customer purchase orders (invoices)
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <PurchaseOrderTable />
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, Menu, AlertCircle } from "lucide-react"
import { getSuppliers, getCurrentUser } from "@/lib/api"
import { Sidebar } from "@/components/navigation/sidebar"
import { SupplierTable } from "@/components/suppliers/supplier-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Supplier } from "@/types"
import { useSidebarState } from "@/hooks/use-sidebar-state"

export default function SuppliersPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState()
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsLoggedIn(true)
      setIsLoading(false)
      loadSuppliers()
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run only once on mount

  const loadSuppliers = async () => {
    try {
      const loadedSuppliers = await getSuppliers()
      setSuppliers(loadedSuppliers)
      setDbError(null)
    } catch (error: any) {
      console.error("Error loading suppliers:", error)
      if (error.message?.includes("Could not find the table") || error.code === "PGRST204") {
        setDbError("database_not_setup")
      } else {
        setDbError("unknown_error")
      }
    }
  }

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
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-600 text-white flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Supplier Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                Manage supplier information and track relationships
              </p>
            </div>
          </div>
        </div>

        {dbError === "database_not_setup" && (
          <div className="max-w-2xl mx-auto mt-12">
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">Database Setup Required</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>The suppliers table hasn't been created yet. Please follow these steps:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open the sidebar (click the menu icon if closed)</li>
                  <li>Look for the "Scripts" or "SQL" section</li>
                  <li>
                    Run this script:{" "}
                    <code className="bg-muted px-2 py-1 rounded font-mono">scripts/004_create_suppliers_table.sql</code>
                  </li>
                </ol>
                <Button onClick={loadSuppliers} variant="outline" size="sm" className="mt-4 bg-transparent">
                  Retry After Running Script
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {dbError === "unknown_error" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Suppliers</AlertTitle>
            <AlertDescription>
              There was an error loading your suppliers. Please check your database connection and try again.
              <Button onClick={loadSuppliers} variant="outline" size="sm" className="mt-3 bg-transparent">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!dbError && <SupplierTable suppliers={suppliers} onUpdate={loadSuppliers} />}
      </main>
    </div>
  )
}

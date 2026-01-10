"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, Menu, AlertCircle, History } from "lucide-react"
import { getInventoryItems, getCurrentUser, getNewStockRecords } from "@/lib/api"
import { Sidebar } from "@/components/navigation/sidebar"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InventoryItem } from "@/types"
import type { NewStockRecord } from "@/lib/api"
import { useSidebarState } from "@/hooks/use-sidebar-state"
import { isManagerOrAdmin } from "@/lib/permissions"

export default function InventoryPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stockRecords, setStockRecords] = useState<NewStockRecord[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState()
  const [dbError, setDbError] = useState<string | null>(null)
  const [showStockHistory, setShowStockHistory] = useState(false)
  const [activeTab, setActiveTab] = useState("inventory")

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsLoggedIn(true)
      setShowStockHistory(isManagerOrAdmin())
      setIsLoading(false)
      loadItems()
      if (isManagerOrAdmin()) {
        loadStockRecords()
      }
    }
    checkAuth()
  }, [])

  const loadItems = async () => {
    try {
      const loadedItems = await getInventoryItems()
      setItems(loadedItems)
      setDbError(null)
    } catch (error: any) {
      console.error("Error loading inventory:", error)
      if (error.message?.includes("Authentication credentials") || error.message?.includes("Invalid token")) {
        router.push("/auth/login")
        return
      }
      if (error.message?.includes("Could not find the table") || error.code === "PGRST204") {
        setDbError("database_not_setup")
      } else {
        setDbError(error.message || "unknown_error")
      }
    }
  }

  const loadStockRecords = async () => {
    try {
      const records = await getNewStockRecords()
      // Backend now returns enriched data with product details
      setStockRecords(records)
    } catch (error: any) {
      console.error("Error loading stock records:", error)
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
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-600 text-white flex-shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">
                Manage your stock, prices, and product details
              </p>
            </div>
          </div>
        </div>

        {dbError === "database_not_setup" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Not Set Up</AlertTitle>
            <AlertDescription>
              The inventory database table hasn't been created yet. Please run the SQL scripts from the sidebar to set
              up the database:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">scripts/001_create_inventory_table.sql</code>
                </li>
                <li>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">scripts/002_create_storage_bucket.sql</code>
                </li>
              </ol>
              <Button onClick={loadItems} variant="outline" size="sm" className="mt-3 bg-transparent">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {dbError && dbError !== "database_not_setup" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Inventory</AlertTitle>
            <AlertDescription>
              {dbError === "unknown_error"
                ? "There was an error loading your inventory items. Please check your database connection and try again."
                : `Error: ${dbError}. Please check your backend console for details.`}
              <Button onClick={loadItems} variant="outline" size="sm" className="mt-3 bg-transparent">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {showStockHistory ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="stock-history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Stock History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <InventoryTable items={items} onUpdate={() => { loadItems(); loadStockRecords(); }} />
            </TabsContent>

            <TabsContent value="stock-history">
              <StockHistoryTable records={stockRecords} onRefresh={loadStockRecords} />
            </TabsContent>
          </Tabs>
        ) : (
          <InventoryTable items={items} onUpdate={loadItems} />
        )}
      </main>
    </div>
  )
}

function StockHistoryTable({ records, onRefresh }: { records: NewStockRecord[], onRefresh: () => void }) {
  return (
    <div className="rounded-md border bg-white">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stock Receipt History</h3>
          <p className="text-sm text-muted-foreground">Track all stock additions and purchases</p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No stock records found. Start adding stock to see history here.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.newstockId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(record.receivedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {record.productName || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {record.productSku || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      +{record.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    ${parseFloat(record.purchasePrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    ${(parseFloat(record.purchasePrice) * record.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {record.supplierName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {record.note || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"
import {
  calculateSalesData,
  getLowStockItems,
  calculateRevenueByDate,
  calculateTotalStats,
  calculateSupplierAnalytics,
  calculateRestockPredictions,
} from "@/lib/analytics"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { TopProducts } from "@/components/dashboard/top-products"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { LowStockAlert } from "@/components/dashboard/low-stock-alert"
import { BarChart3, Menu } from "lucide-react"
import { Sidebar } from "@/components/navigation/sidebar"
import { Button } from "@/components/ui/button"
import { useSidebarState } from "@/hooks/use-sidebar-state"
import { SupplierAnalytics } from "@/components/dashboard/supplier-analytics"
import { RestockAlerts } from "@/components/dashboard/restock-alerts"
import { ProfitSummary } from "@/components/dashboard/profit-summary"
import { SalesPerformance } from "@/components/dashboard/sales-performance"
import { InventoryHealthCard } from "@/components/dashboard/inventory-health"
import { CustomerInsights } from "@/components/dashboard/customer-insights"
import { RecentActivityFeed } from "@/components/dashboard/recent-activity"
import { isManagerOrAdmin, isStaff, getUserRole } from "@/lib/permissions"

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("")
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalProducts: 0,
    lowStockCount: 0,
  })
  const [salesData, setSalesData] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [supplierAnalytics, setSupplierAnalytics] = useState<any[]>([])
  const [restockPredictions, setRestockPredictions] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setMounted(true)
      setUserRole(getUserRole() || "")
      loadDashboardData()
    }
    checkAuth()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, sales, lowStock, revenue, suppliers, restock] = await Promise.all([
        calculateTotalStats(),
        calculateSalesData(),
        getLowStockItems(),
        calculateRevenueByDate(),
        calculateSupplierAnalytics(),
        calculateRestockPredictions(),
      ])
      setStats(statsData)
      setSalesData(sales)
      setLowStockItems(lowStock)
      setRevenueData(revenue)
      setSupplierAnalytics(suppliers)
      setRestockPredictions(restock)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
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
                className="bg-white hover:bg-gray-50 text-gray-700 shadow-sm border shrink-0"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Business Intelligence</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">
                {userRole === 'staff' ? 'Sales & Inventory Overview' : 
                 userRole === 'manager' ? 'Management Dashboard & Analytics' : 
                 'Executive Dashboard & Insights'}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats - All Roles */}
            <StatsCards stats={stats} />

            {/* Sales Performance - All Roles */}
            <SalesPerformance />

            {/* Profit Summary - Manager & Admin Only */}
            {isManagerOrAdmin() && <ProfitSummary />}

            {/* Revenue & Top Products - All Roles */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <RevenueChart data={revenueData} />
              <TopProducts salesData={salesData} />
            </div>

            {/* Inventory Health & Customer Insights */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <InventoryHealthCard />
              <CustomerInsights />
            </div>

            {/* Supplier Analytics & Restock Alerts - Manager & Admin Only */}
            {isManagerOrAdmin() && (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <SupplierAnalytics suppliers={supplierAnalytics} />
                <RestockAlerts items={restockPredictions} />
              </div>
            )}

            {/* Recent Activity & Low Stock Alerts */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <RecentActivityFeed />
              <LowStockAlert items={lowStockItems} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"
import { getInvoices } from "@/lib/api"

interface SalesMetrics {
  todaySales: number
  yesterdaySales: number
  weekSales: number
  monthSales: number
  todayOrders: number
  weekOrders: number
  avgOrderValue: number
  growthRate: number
}

export function SalesPerformance() {
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const invoices = await getInvoices()
        const paidInvoices = invoices.filter(inv => inv.status === "paid")

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        const todayInvoices = paidInvoices.filter(inv => new Date(inv.createdAt) >= today)
        const yesterdayInvoices = paidInvoices.filter(inv => {
          const date = new Date(inv.createdAt)
          return date >= yesterday && date < today
        })
        const weekInvoices = paidInvoices.filter(inv => new Date(inv.createdAt) >= weekAgo)
        const monthInvoices = paidInvoices.filter(inv => new Date(inv.createdAt) >= monthAgo)

        const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0)
        const yesterdaySales = yesterdayInvoices.reduce((sum, inv) => sum + inv.total, 0)
        const weekSales = weekInvoices.reduce((sum, inv) => sum + inv.total, 0)
        const monthSales = monthInvoices.reduce((sum, inv) => sum + inv.total, 0)

        const avgOrderValue = todayInvoices.length > 0 ? todaySales / todayInvoices.length : 0
        const growthRate = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

        setMetrics({
          todaySales,
          yesterdaySales,
          weekSales,
          monthSales,
          todayOrders: todayInvoices.length,
          weekOrders: weekInvoices.length,
          avgOrderValue,
          growthRate
        })
      } catch (error) {
        console.error("Error loading sales metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (loading || !metrics) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>Loading sales metrics...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 col-span-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.todaySales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {metrics.growthRate >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+{metrics.growthRate.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-red-600">{metrics.growthRate.toFixed(1)}%</span>
              </>
            )}
            <span className="text-muted-foreground">from yesterday</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.weekSales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.weekOrders} orders this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.monthSales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Last 30 days performance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.avgOrderValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.todayOrders} orders today
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

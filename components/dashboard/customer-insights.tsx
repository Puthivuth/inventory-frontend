"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { getInvoices } from "@/lib/api"

interface CustomerInsight {
  totalCustomers: number
  newThisMonth: number
  repeatCustomers: number
  topCustomers: Array<{
    name: string
    email: string
    totalSpent: number
    orderCount: number
  }>
  avgCustomerValue: number
  repeatRate: number
}

export function CustomerInsights() {
  const [insights, setInsights] = useState<CustomerInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const invoices = await getInvoices()
        const paidInvoices = invoices.filter(inv => inv.status === "paid")

        // Group by customer
        const customerMap = new Map<string, {
          name: string
          email: string
          totalSpent: number
          orderCount: number
          firstOrder: Date
        }>()

        paidInvoices.forEach(inv => {
          const key = inv.customerEmail || inv.customerName
          const existing = customerMap.get(key)
          if (existing) {
            existing.totalSpent += inv.total
            existing.orderCount += 1
            if (new Date(inv.createdAt) < existing.firstOrder) {
              existing.firstOrder = new Date(inv.createdAt)
            }
          } else {
            customerMap.set(key, {
              name: inv.customerName,
              email: inv.customerEmail,
              totalSpent: inv.total,
              orderCount: 1,
              firstOrder: new Date(inv.createdAt)
            })
          }
        })

        const totalCustomers = customerMap.size
        const repeatCustomers = Array.from(customerMap.values()).filter(c => c.orderCount > 1).length

        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const newThisMonth = Array.from(customerMap.values()).filter(c => c.firstOrder >= monthAgo).length

        const topCustomers = Array.from(customerMap.values())
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5)

        const totalSpent = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
        const avgCustomerValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0
        const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0

        setInsights({
          totalCustomers,
          newThisMonth,
          repeatCustomers,
          topCustomers,
          avgCustomerValue,
          repeatRate
        })
      } catch (error) {
        console.error("Error loading customer insights:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInsights()
  }, [])

  if (loading || !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Insights</CardTitle>
          <CardDescription>Loading customer data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Insights
        </CardTitle>
        <CardDescription>Customer behavior and top buyers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
            <div className="text-2xl font-bold">{insights.totalCustomers}</div>
            <div className="text-xs text-muted-foreground">
              +{insights.newThisMonth} this month
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Repeat Rate</div>
            <div className="text-2xl font-bold text-green-600">{insights.repeatRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {insights.repeatCustomers} returning
            </div>
          </div>
        </div>

        {/* Avg Customer Value */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Avg Customer Lifetime Value</div>
            <div className="text-xl font-bold">${insights.avgCustomerValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Top Customers</span>
          </div>
          <div className="space-y-3">
            {insights.topCustomers.map((customer, idx) => (
              <div key={customer.email} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">{customer.orderCount} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">${customer.totalSpent.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">lifetime</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Target } from "lucide-react"
import { useEffect, useState } from "react"
import { calculateProfitAnalytics } from "@/lib/analytics"
import { isManagerOrAdmin } from "@/lib/permissions"
import { getInvoices, getInventoryItems } from "@/lib/api"
import type { InventoryItem } from "@/types"

interface ProfitAnalytics {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  topProfitableProducts: Array<{
    name: string
    revenue: number
    cost: number
    profit: number
    units: number
  }>
}

interface DebugData {
  invoiceNumber: string;
  name: string
  qty: number
  revenue: number
  costPrice: number
  costTotal: number
  profit: number
}

export function ProfitSummary() {
  const [analytics, setAnalytics] = useState<ProfitAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugData, setDebugData] = useState<DebugData[]>([])

  useEffect(() => {
    if (!isManagerOrAdmin()) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const data = await calculateProfitAnalytics()
        setAnalytics(data)

        // Debugging logic to provide a breakdown
        const invoices = await getInvoices()
        const items = await getInventoryItems()
        const paidInvoices = invoices
          .filter(inv => inv.status === 'paid')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
          
        const details: DebugData[] = []
        
        paidInvoices.forEach(invoice => {
          invoice.items.forEach((invoiceItem: any) => {
            const inventoryItem = items.find(item => item.productId === invoiceItem.inventoryItemId)
            const costPrice = inventoryItem?.costPrice || 0
            const revenue = invoiceItem.total
            const quantity = invoiceItem.quantity
            const costTotal = costPrice * quantity
            const profit = revenue - costTotal
            
            details.push({
              invoiceNumber: invoice.invoiceNumber,
              name: invoiceItem.name,
              qty: quantity,
              revenue: revenue,
              costPrice: costPrice,
              costTotal: costTotal,
              profit: profit,
            })
          })
        })
        setDebugData(details)

      } catch (error) {
        console.error("Failed to load profit analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (!isManagerOrAdmin()) {
    return null
  }

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Profit Analytics</CardTitle>
          <CardDescription>Loading profit data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 col-span-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${analytics.totalProfit.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            From ${analytics.totalRevenue.toFixed(2)} revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Average margin on sales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            ${analytics.totalCost.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Cost of goods sold
          </p>
        </CardContent>
      </Card>



      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Profit Calculation Breakdown (for debugging)</CardTitle>
          <CardDescription>
            This table shows how profit is calculated for each item in a "paid" invoice.
            Profit = Revenue - Cost Total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Cost Price</th>
                  <th className="px-4 py-3 text-right">Cost Total</th>
                  <th className="px-4 py-3 text-right font-bold">Item Profit</th>
                </tr>
              </thead>
              <tbody>
                {debugData.length > 0 ? (
                  debugData.map((d, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3 font-medium">{d.invoiceNumber}</td>
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-right">{d.qty}</td>
                      <td className="px-4 py-3 text-right">${d.revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">${d.costPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">${d.costTotal.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${d.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${d.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No items found in "paid" invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

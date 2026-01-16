"use client"

import { useState } from "react"
import type { SalesData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { TrendingUp } from "lucide-react"

interface TopProductsProps {
  salesData: SalesData[]
}

export function TopProducts({ salesData }: TopProductsProps) {
  const [topCount, setTopCount] = useState(5)

  const topProducts = salesData.slice(0, topCount)
  const maxRevenue = topProducts.length > 0 ? topProducts[0].totalRevenue : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Top Profitable Products
            </CardTitle>
            <CardDescription>Your most profitable products.</CardDescription>
          </div>
          <Select value={topCount.toString()} onValueChange={(value) => setTopCount(Number.parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  Top {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        {topProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No sales data available</div>
        ) : (
          <div className="space-y-6">
            {topProducts.map((product) => {
              const revenuePercentage = maxRevenue > 0 ? (product.totalRevenue / maxRevenue) * 100 : 0
              return (
                <div key={product.itemId} className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <div className="font-medium text-sm">{product.itemName}</div>
                    <div className="ml-auto text-sm font-semibold text-green-600">${product.totalRevenue.toFixed(2)}</div>
                  </div>
                  <Progress value={revenuePercentage} className="h-2 progress-green-bar" />
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{product.totalQuantity} units sold</span>
                    <span className="mx-2">•</span>
                    <span>{product.invoiceCount} invoices</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

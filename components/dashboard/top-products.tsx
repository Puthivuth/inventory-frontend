"use client"

import { useState } from "react"
import type { SalesData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"

interface TopProductsProps {
  salesData: SalesData[]
}

export function TopProducts({ salesData }: TopProductsProps) {
  const [topCount, setTopCount] = useState(5)

  const topProducts = salesData.slice(0, topCount)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
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
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.itemId} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{product.itemName}</div>
                  <div className="text-sm text-muted-foreground">
                    {product.totalQuantity} units sold • {product.invoiceCount} invoices
                  </div>
                </div>
                <Badge className="bg-blue-600">${product.totalRevenue.toFixed(2)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

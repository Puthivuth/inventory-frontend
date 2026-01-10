"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingDown, Calendar } from "lucide-react"

interface RestockAlertsProps {
  items: Array<{
    id: string
    name: string
    stock: number
    minStock: number
    avgDailySales: number
    daysUntilStockout: number
    needsRestock: boolean
  }>
}

export function RestockAlerts({ items }: RestockAlertsProps) {
  const urgentItems = items.filter((item) => item.needsRestock).slice(0, 10)

  const getUrgencyColor = (days: number) => {
    if (days < 7) return "bg-red-100 text-red-800 border-red-200"
    if (days < 14) return "bg-orange-100 text-orange-800 border-orange-200"
    if (days < 30) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-blue-100 text-blue-800 border-blue-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-600" />
          <span className="truncate">Restock Predictions</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Items that need restocking based on sales velocity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {urgentItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">All items are well-stocked!</p>
        ) : (
          <div className="space-y-3">
            {urgentItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm truncate">{item.name}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <TrendingDown className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.avgDailySales} sold/day</span>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap truncate">Current: {item.stock} units</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${getUrgencyColor(item.daysUntilStockout)} text-xs whitespace-nowrap flex-shrink-0`}
                >
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {item.daysUntilStockout < 999 ? `${item.daysUntilStockout} days` : "Low stock"}
                  </span>
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Package, CheckCircle } from "lucide-react"

interface SupplierAnalyticsProps {
  suppliers: Array<{
    supplierId: string
    name: string
    totalOrders: number
    totalSpend: number
    receivedOrders: number
    pendingOrders: number
    reliability: number
    lastOrderDate?: string
  }>
}

export function SupplierAnalytics({ suppliers }: SupplierAnalyticsProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 80) return "bg-green-100 text-green-800 border-green-200"
    if (reliability >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Top Suppliers
        </CardTitle>
        <CardDescription>Supplier performance and reliability metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No supplier data available yet.</p>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier, index) => (
              <div
                key={supplier.supplierId}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm sm:text-base flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0 space-y-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="font-semibold text-base sm:text-lg break-words">{supplier.name}</h4>
                    <Badge
                      variant="outline"
                      className={`${getReliabilityColor(supplier.reliability)} text-xs sm:text-sm whitespace-nowrap flex-shrink-0`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {supplier.reliability}% Reliable
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground overflow-hidden">
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Package className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{supplier.totalOrders} orders</span>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-semibold text-foreground truncate">
                      ${supplier.totalSpend.toFixed(2)} total
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="truncate">Last: {formatDate(supplier.lastOrderDate)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
                      {supplier.receivedOrders} received
                    </Badge>
                    {supplier.pendingOrders > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200 whitespace-nowrap"
                      >
                        {supplier.pendingOrders} pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

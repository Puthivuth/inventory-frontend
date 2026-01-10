"use client"

import type { InventoryItem } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface LowStockAlertProps {
  items: InventoryItem[]
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Items that need restocking</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">All items are well stocked</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {item.stock} / {item.minStock}
                  </Badge>
                </div>
              </div>
            ))}
            <Link href="/inventory">
              <Button variant="outline" className="w-full bg-transparent">
                Manage Inventory
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

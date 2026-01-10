"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import { getInventoryItems } from "@/lib/api"
import { Progress } from "@/components/ui/progress"

interface InventoryHealth {
  totalItems: number
  totalValue: number
  inStock: number
  lowStock: number
  outOfStock: number
  healthScore: number
  categories: Array<{
    category: string
    count: number
    value: number
  }>
}

export function InventoryHealthCard() {
  const [health, setHealth] = useState<InventoryHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const items = await getInventoryItems()

        const inStock = items.filter(item => item.stock > item.minStock).length
        const lowStock = items.filter(item => item.stock <= item.minStock && item.stock > 0).length
        const outOfStock = items.filter(item => item.stock === 0).length

        const totalValue = items.reduce((sum, item) => sum + (item.stock * item.salePrice), 0)

        // Calculate health score (0-100)
        const healthScore = Math.round((inStock / items.length) * 100)

        // Group by category
        const categoryMap = new Map<string, { count: number; value: number }>()
        items.forEach(item => {
          const existing = categoryMap.get(item.category)
          if (existing) {
            existing.count += 1
            existing.value += item.stock * item.salePrice
          } else {
            categoryMap.set(item.category, {
              count: 1,
              value: item.stock * item.salePrice
            })
          }
        })

        const categories = Array.from(categoryMap.entries())
          .map(([category, data]) => ({ category, ...data }))
          .sort((a, b) => b.value - a.value)

        setHealth({
          totalItems: items.length,
          totalValue,
          inStock,
          lowStock,
          outOfStock,
          healthScore,
          categories
        })
      } catch (error) {
        console.error("Error loading inventory health:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHealth()
  }, [])

  if (loading || !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Health</CardTitle>
          <CardDescription>Loading inventory metrics...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Health
        </CardTitle>
        <CardDescription>Overall inventory status and value</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Health Score</span>
            <span className={`text-2xl font-bold ${
              health.healthScore >= 80 ? 'text-green-600' :
              health.healthScore >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {health.healthScore}%
            </span>
          </div>
          <Progress 
            value={health.healthScore} 
            className={`h-2 ${
              health.healthScore >= 80 ? '[&>div]:bg-green-600' :
              health.healthScore >= 60 ? '[&>div]:bg-yellow-600' :
              '[&>div]:bg-red-600'
            }`}
          />
        </div>

        {/* Stock Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              In Stock
            </div>
            <div className="text-xl font-bold text-green-600">{health.inStock}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 text-yellow-600" />
              Low Stock
            </div>
            <div className="text-xl font-bold text-yellow-600">{health.lowStock}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-600" />
              Out of Stock
            </div>
            <div className="text-xl font-bold text-red-600">{health.outOfStock}</div>
          </div>
        </div>

        {/* Total Value */}
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">Total Inventory Value</div>
          <div className="text-2xl font-bold">${health.totalValue.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {health.totalItems} items across {health.categories.length} categories
          </div>
        </div>

        {/* Top Categories */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Top Categories by Value</div>
          <div className="space-y-2">
            {health.categories.slice(0, 3).map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-sm">{cat.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${cat.value.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">{cat.count} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

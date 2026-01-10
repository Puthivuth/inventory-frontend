"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { getInvoices, getInventoryItems } from "@/lib/api"

interface RecentActivity {
  type: "sale" | "low_stock" | "new_product"
  title: string
  description: string
  time: Date
  amount?: number
  status?: string
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const [invoices, items] = await Promise.all([getInvoices(), getInventoryItems()])

        const recentActivities: RecentActivity[] = []

        // Recent sales
        invoices
          .filter(inv => inv.status === "paid")
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .forEach(inv => {
            recentActivities.push({
              type: "sale",
              title: `Sale to ${inv.customerName}`,
              description: `Invoice #${inv.invoiceNumber} - ${inv.items.length} items`,
              time: new Date(inv.createdAt),
              amount: inv.total,
              status: "completed"
            })
          })

        // Low stock items (recent)
        items
          .filter(item => item.stock <= item.minStock)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 3)
          .forEach(item => {
            recentActivities.push({
              type: "low_stock",
              title: `Low stock alert: ${item.name}`,
              description: `Only ${item.stock} units remaining`,
              time: new Date(item.updatedAt),
              status: "warning"
            })
          })

        // Sort by time
        recentActivities.sort((a, b) => b.time.getTime() - a.time.getTime())

        setActivities(recentActivities.slice(0, 10))
      } catch (error) {
        console.error("Error loading activities:", error)
      } finally {
        setLoading(false)
      }
    }

    loadActivities()
  }, [])

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading activity feed...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest business events and alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          ) : (
            activities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  activity.type === "sale" ? "bg-green-500" :
                  activity.type === "low_stock" ? "bg-yellow-500" :
                  "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-sm font-bold text-green-600 shrink-0">
                        ${activity.amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(activity.time)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

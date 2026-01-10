"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getActivityLogs } from "@/lib/api"
import { format } from "date-fns"
import { Activity, User, Clock, ArrowLeft } from "lucide-react"

interface ActivityLog {
  logId: number
  user: number | null
  username?: string
  actionType: string
  description: string
  createdAt: string
}

export default function ActivityLogPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivityLogs()
  }, [])

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true)
      const data = await getActivityLogs()
      setLogs(data)
    } catch (error) {
      console.error("Error fetching activity logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActionTypeColor = (actionType: string) => {
    if (actionType.includes("ADD") || actionType.includes("CREATE")) return "text-green-600"
    if (actionType.includes("DELETE") || actionType.includes("REMOVE")) return "text-red-600"
    if (actionType.includes("UPDATE") || actionType.includes("EDIT")) return "text-blue-600"
    return "text-gray-600"
  }

  const formatActionType = (actionType: string) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">Track all system changes and user actions</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>Complete history of system modifications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activity logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No activity logs found</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.logId}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    <Activity className={`h-5 w-5 ${getActionTypeColor(log.actionType)}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getActionTypeColor(log.actionType)}`}>
                        {formatActionType(log.actionType)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.username || "System"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

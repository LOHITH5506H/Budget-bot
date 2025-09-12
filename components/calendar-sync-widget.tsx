"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarCheck, CalendarX, RefreshCw, ExternalLink } from "lucide-react"

interface CalendarEvent {
  id: string
  summary: string
  start: string
  description?: string
  type: "bill" | "goal"
}

interface CalendarSyncWidgetProps {
  userId: string
}

export function CalendarSyncWidget({ userId }: CalendarSyncWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"connected" | "disconnected" | "syncing">("disconnected")

  const mockEvents: CalendarEvent[] = [
    {
      id: "1",
      summary: "💰 Bill Due: Netflix",
      start: "2025-01-15T10:00:00Z",
      description: "Monthly subscription - Netflix\nAmount: $15.99",
      type: "bill",
    },
    {
      id: "2",
      summary: "🎯 Goal Milestone: Vacation Fund",
      start: "2025-02-01T09:00:00Z",
      description: "Target: $5000\nCurrent: $2500\nProgress: 50%",
      type: "goal",
    },
  ]

  useEffect(() => {
    // Simulate checking sync status
    setSyncStatus("connected")
    setEvents(mockEvents)
  }, [])

  const handleSync = async () => {
    setLoading(true)
    setSyncStatus("syncing")

    try {
      // Simulate sync operation
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSyncStatus("connected")
      setEvents(mockEvents)
    } catch (error) {
      console.error("Sync failed:", error)
      setSyncStatus("disconnected")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "syncing":
        return "bg-yellow-100 text-yellow-800"
      case "disconnected":
        return "bg-red-100 text-red-800"
    }
  }

  const getStatusText = () => {
    switch (syncStatus) {
      case "connected":
        return "Connected"
      case "syncing":
        return "Syncing..."
      case "disconnected":
        return "Disconnected"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Google Calendar Sync
          </div>
          <Badge className={getStatusColor()}>
            {syncStatus === "syncing" ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : syncStatus === "connected" ? (
              <CalendarCheck className="w-3 h-3 mr-1" />
            ) : (
              <CalendarX className="w-3 h-3 mr-1" />
            )}
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">Sync your bills and goals to Google Calendar for better planning</p>
          <Button onClick={handleSync} disabled={loading} size="sm" variant="outline">
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sync Now
          </Button>
        </div>

        {events.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Synced Events</h4>
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {event.type === "bill" ? (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  ) : (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{event.summary}</p>
                    <p className="text-xs text-gray-500">{new Date(event.start).toLocaleDateString()}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          💡 Tip: Events are automatically synced when you create new subscriptions or goals with calendar sync enabled.
        </div>
      </CardContent>
    </Card>
  )
}

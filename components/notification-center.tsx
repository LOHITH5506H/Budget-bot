"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Mail, MessageSquare, Calendar, Target, CreditCard, Settings, Check, Wifi, WifiOff, X, Download } from "lucide-react"
import { usePusher } from "@/hooks/use-pusher"
import { useToast } from "@/hooks/use-toast"

interface NotificationPreference {
  id: string
  type: "bill_reminder" | "goal_milestone" | "spending_alert" | "weekly_summary"
  title: string
  description: string
  email: boolean
  sms: boolean
  calendar: boolean
  enabled: boolean
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  priority?: "low" | "medium" | "high"
}

interface NotificationCenterProps {
  userId: string
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const { toast } = useToast()
  const { 
    isConnected, 
    notifications: pusherNotifications, 
    markAsRead: markPusherAsRead, 
    clearAll: clearPusherNotifications,
    sendTestNotification: sendPusherTestNotification 
  } = usePusher({ userId })
  
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "1",
      type: "bill_reminder",
      title: "Bill Reminders",
      description: "Get notified before your bills are due",
      email: true,
      sms: false,
      calendar: true,
      enabled: true,
    },
    {
      id: "2",
      type: "goal_milestone",
      title: "Goal Milestones",
      description: "Celebrate when you reach savings milestones",
      email: true,
      sms: false,
      calendar: true,
      enabled: true,
    },
    {
      id: "3",
      type: "spending_alert",
      title: "Spending Alerts",
      description: "Warning when you exceed budget limits",
      email: true,
      sms: true,
      calendar: false,
      enabled: true,
    },
    {
      id: "4",
      type: "weekly_summary",
      title: "Weekly Summary",
      description: "Weekly financial overview and insights",
      email: true,
      sms: false,
      calendar: false,
      enabled: false,
    },
  ])

  const [localNotifications, setLocalNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "bill_reminder",
      title: "Netflix bill due tomorrow",
      message: "Your Netflix subscription ($15.99) is due tomorrow",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      priority: "high"
    },
    {
      id: "2",
      type: "goal_milestone",
      title: "Vacation fund milestone reached!",
      message: "Congratulations! You've reached 50% of your vacation fund goal",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      priority: "medium"
    },
  ])

  // Merge and sort notifications from both sources
  const allNotifications = [
    ...localNotifications,
    ...pusherNotifications.map(pn => ({
      id: pn.id,
      type: pn.type,
      title: pn.title,
      message: pn.message,
      timestamp: new Date(pn.timestamp),
      read: pn.read || false,
      priority: "medium" as const
    } as Notification))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const [loading, setLoading] = useState(false)

  const updatePreference = async (id: string, field: keyof NotificationPreference, value: boolean) => {
    setPreferences((prev) => prev.map((pref) => (pref.id === id ? { ...pref, [field]: value } : pref)))

    // Here you would typically save to the database
    console.log(`Updated preference ${id}: ${field} = ${value}`)
  }

  const handleTestNotification = async () => {
    setLoading(true)
    try {
      // Use the Pusher test notification function
      await sendPusherTestNotification()
      
      // Also add to local notifications for immediate feedback
      setLocalNotifications((prev) => [
        {
          id: Date.now().toString(),
          type: "bill_reminder",
          title: "Test notification sent",
          message: "Check your real-time notifications - test sent via Pusher!",
          timestamp: new Date(),
          read: false,
          priority: "medium"
        },
        ...prev,
      ])
      
      toast({
        title: "Test notification sent",
        description: "Check your notifications panel for the real-time update",
      })
    } catch (error) {
      console.error("Failed to send test notification:", error)
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (id: string) => {
    // Try to mark as read in Pusher notifications first
    markPusherAsRead(id)
    
    // Also mark in local notifications
    setLocalNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const clearAllNotifications = () => {
    clearPusherNotifications()
    setLocalNotifications([])
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bill_reminder":
        return <CreditCard className="w-4 h-4" />
      case "goal_milestone":
        return <Target className="w-4 h-4" />
      case "spending_alert":
        return <Bell className="w-4 h-4" />
      case "weekly_summary":
        return <Calendar className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bill_reminder":
        return "text-emerald-600"
      case "goal_milestone":
        return "text-blue-600"
      case "spending_alert":
        return "text-orange-600"
      case "weekly_summary":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferences.map((pref) => (
            <div key={pref.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${getTypeColor(pref.type)}`}>{getTypeIcon(pref.type)}</div>
                  <div>
                    <h4 className="font-medium">{pref.title}</h4>
                    <p className="text-sm text-gray-600">{pref.description}</p>
                  </div>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={(checked) => updatePreference(pref.id, "enabled", checked)}
                />
              </div>

              {pref.enabled && (
                <div className="ml-7 flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={pref.email}
                      onCheckedChange={(checked) => updatePreference(pref.id, "email", checked)}
                    />
                    <Label className="flex items-center text-sm">
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={pref.sms}
                      onCheckedChange={(checked) => updatePreference(pref.id, "sms", checked)}
                    />
                    <Label className="flex items-center text-sm">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      SMS
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={pref.calendar}
                      onCheckedChange={(checked) => updatePreference(pref.id, "calendar", checked)}
                    />
                    <Label className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      Calendar
                    </Label>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            <Button
              onClick={handleTestNotification}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? "Sending..." : "Send Test Notification"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-2 text-gray-600" />
              Recent Notifications
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{allNotifications.filter((n) => !n.read).length} unread</Badge>
              {allNotifications.length > 0 && (
                <Button
                  onClick={clearAllNotifications}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allNotifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications yet</p>
          ) : (
            <div className="space-y-3">
              {allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read 
                      ? "bg-gray-50" 
                      : notification.priority === "high" 
                        ? "bg-red-50 border-red-200" 
                        : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`${getTypeColor(notification.type)} mt-0.5`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {notification.priority === "high" && (
                            <Badge variant="destructive" className="text-xs">High</Badge>
                          )}
                          {notification.priority === "medium" && !notification.read && (
                            <Badge variant="secondary" className="text-xs">Medium</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">{notification.timestamp.toLocaleString()}</p>
                          {notification.actionUrl && (
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              <Download className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <Button onClick={() => markAsRead(notification.id)} size="sm" variant="ghost">
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
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

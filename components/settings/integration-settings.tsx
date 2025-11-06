"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Mail,
  MessageSquare,
  Settings,
  CheckCircle,
  XCircle,
  ExternalLink,
  Key,
  Shield,
  Zap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface IntegrationSettingsProps {
  userId: string
}

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: "connected" | "disconnected" | "error"
  type: "calendar" | "email" | "sms"
  settings?: any
}

export function IntegrationSettings({ userId }: IntegrationSettingsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync bill due dates and goal milestones to your calendar",
      icon: <Calendar className="w-5 h-5" />,
      status: "disconnected",
      type: "calendar",
      settings: {
        calendarId: "primary",
        reminderMinutes: [1440, 60], // 1 day and 1 hour before
        autoSync: true,
      },
    },
    {
      id: "sendpulse-email",
      name: "SendPulse Email",
      description: "Receive email notifications for bills, goals, and spending alerts",
      icon: <Mail className="w-5 h-5" />,
      status: "connected",
      type: "email",
      settings: {
        fromName: "BudgetBot",
        fromEmail: "noreply@budgetbot.app",
        enabled: true,
      },
    },
    {
      id: "sendpulse-sms",
      name: "SendPulse SMS",
      description: "Get SMS alerts for urgent financial notifications",
      icon: <MessageSquare className="w-5 h-5" />,
      status: "disconnected",
      type: "sms",
      settings: {
        phoneNumber: "",
        enabled: false,
      },
    },
  ])

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Detect if user has Google session token (connected via OAuth)
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClient()
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session

        const isGoogleConnected = Boolean((session as any)?.provider_token)
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === "google-calendar"
              ? { ...i, status: isGoogleConnected ? ("connected" as const) : ("disconnected" as const) }
              : i,
          ),
        )
      } catch (e) {
        // ignore
      }
    }
    checkConnection()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "disconnected":
        return "bg-gray-100 text-gray-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "disconnected":
        return <XCircle className="w-4 h-4 text-gray-400" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const handleConnect = async (integrationId: string) => {
    setLoading(true)
    try {
      if (integrationId === "google-calendar") {
        const supabase = createClient()
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/settings` : undefined
        // Request Calendar scope so we can insert events without sharing
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            scopes: "https://www.googleapis.com/auth/calendar.events",
            redirectTo,
          },
        })
        if (error) throw error
        // Browser will redirect; optimistic state update
        setIntegrations((prev) =>
          prev.map((integration) =>
            integration.id === integrationId ? { ...integration, status: "connected" as const } : integration,
          ),
        )
        return
      }
      // Other integrations: mock
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIntegrations((prev) =>
        prev.map((integration) => (integration.id === integrationId ? { ...integration, status: "connected" as const } : integration)),
      )
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    setLoading(true)
    try {
      if (integrationId === "google-calendar") {
        const supabase = createClient()
        await supabase.auth.signOut()
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      setIntegrations((prev) => prev.map((i) => (i.id === integrationId ? { ...i, status: "disconnected" as const } : i)))
    } catch (error) {
      console.error("Disconnection failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateIntegrationSetting = (integrationId: string, key: string, value: any) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              settings: { ...integration.settings, [key]: value },
            }
          : integration,
      ),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-600" />
          Integration Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configure">Configure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-blue-600">{integration.icon}</div>
                  <div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(integration.status)}>
                    {getStatusIcon(integration.status)}
                    <span className="ml-1 capitalize">{integration.status}</span>
                  </Badge>
                    {integration.status === "connected" ? (
                    <Button
                      onClick={() => handleDisconnect(integration.id)}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button onClick={() => handleConnect(integration.id)} disabled={loading} size="sm">
                      {loading ? "Connecting..." : integration.id === "google-calendar" ? "Connect with Google" : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Security & Privacy</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    All integrations use secure OAuth 2.0 authentication and encrypted API keys. Your financial data is
                    never shared with third parties without your explicit consent.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configure" className="space-y-6 mt-6">
            {integrations.map((integration) => (
              <div key={integration.id} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-600">{integration.icon}</div>
                  <h4 className="font-medium">{integration.name}</h4>
                  <Badge className={getStatusColor(integration.status)}>{integration.status}</Badge>
                </div>

                {integration.status === "connected" && (
                  <div className="ml-7 space-y-4 p-4 bg-gray-50 rounded-lg">
                    {integration.id === "google-calendar" && (
                      <>
                        <div>
                          <Label htmlFor="calendar-id">Calendar ID</Label>
                          <Input
                            id="calendar-id"
                            value={integration.settings?.calendarId || ""}
                            onChange={(e) => updateIntegrationSetting(integration.id, "calendarId", e.target.value)}
                            placeholder="primary"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use 'primary' for your main calendar or specify a calendar ID
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={integration.settings?.autoSync || false}
                            onCheckedChange={(checked) => updateIntegrationSetting(integration.id, "autoSync", checked)}
                          />
                          <Label>Automatically sync new bills and goals</Label>
                        </div>
                      </>
                    )}

                    {integration.id === "sendpulse-email" && (
                      <>
                        <div>
                          <Label htmlFor="from-name">From Name</Label>
                          <Input
                            id="from-name"
                            value={integration.settings?.fromName || ""}
                            onChange={(e) => updateIntegrationSetting(integration.id, "fromName", e.target.value)}
                            placeholder="BudgetBot"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={integration.settings?.enabled || false}
                            onCheckedChange={(checked) => updateIntegrationSetting(integration.id, "enabled", checked)}
                          />
                          <Label>Enable email notifications</Label>
                        </div>
                      </>
                    )}

                    {integration.id === "sendpulse-sms" && (
                      <>
                        <div>
                          <Label htmlFor="phone-number">Phone Number</Label>
                          <Input
                            id="phone-number"
                            value={integration.settings?.phoneNumber || ""}
                            onChange={(e) => updateIntegrationSetting(integration.id, "phoneNumber", e.target.value)}
                            placeholder="+1234567890"
                          />
                          <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={integration.settings?.enabled || false}
                            onCheckedChange={(checked) => updateIntegrationSetting(integration.id, "enabled", checked)}
                          />
                          <Label>Enable SMS notifications</Label>
                        </div>
                      </>
                    )}

                    <Button size="sm" variant="outline">
                      <Key className="w-4 h-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                )}

                {integration.status === "disconnected" && (
                  <div className="ml-7 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Connect this integration to configure its settings.</p>
                  </div>
                )}
              </div>
            ))}

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">API Configuration</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Some integrations require API keys to be configured in your environment variables. Check the
                    documentation for setup instructions.
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-yellow-700">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

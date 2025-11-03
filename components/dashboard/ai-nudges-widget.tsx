"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback } from "react"
import { usePusherEvent } from "@/hooks/use-pusher"

interface AiNudgesWidgetProps {
  userId: string
}

export function AiNudgesWidget({ userId }: AiNudgesWidgetProps) {
  const [nudge, setNudge] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const generateNudge = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch AI insights")
      }

      const data = await response.json()
      setNudge(data.insight)
    } catch (error) {
      console.error("Error fetching AI insights:", error)
      setNudge("Keep tracking your expenses to get personalized financial insights!")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    generateNudge()
  }, [generateNudge])

  // Listen for real-time expense updates to refresh AI insights
  usePusherEvent('expense-updated', (data) => {
    console.log("[AIInsights] Received expense update, regenerating insights");
    generateNudge();
  }, [generateNudge]);

  // Listen for custom expense events
  useEffect(() => {
    const handleExpenseAdded = () => {
      console.log("[AIInsights] Expense added event received, regenerating insights");
      generateNudge();
    };

    window.addEventListener('expense-added', handleExpenseAdded);
    return () => window.removeEventListener('expense-added', handleExpenseAdded);
  }, [generateNudge])

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
            AI Insights
          </div>
          <Button variant="ghost" size="sm" onClick={generateNudge} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-yellow-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-yellow-200 rounded w-3/4"></div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{nudge}</p>
        )}
      </CardContent>
    </Card>
  )
}

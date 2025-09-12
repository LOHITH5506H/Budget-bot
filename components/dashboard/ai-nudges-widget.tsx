"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface AiNudgesWidgetProps {
  userId: string
}

export function AiNudgesWidget({ userId }: AiNudgesWidgetProps) {
  const [nudge, setNudge] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const generateNudge = async () => {
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
  }

  useEffect(() => {
    generateNudge()
  }, [userId])

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

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface AiNudgesWidgetProps {
  userId: string
}

export function AiNudgesWidget({ userId }: AiNudgesWidgetProps) {
  const [nudge, setNudge] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const generateNudge = async () => {
    setLoading(true)
    const supabase = createClient()

    // Fetch recent spending data
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount, is_need")
      .eq("user_id", userId)
      .gte("expense_date", `${currentMonth}-01`)

    if (expenses && expenses.length > 0) {
      const totalSpent = expenses.reduce((sum, exp) => sum + Number.parseFloat(exp.amount), 0)
      const wantSpending = expenses
        .filter((exp) => !exp.is_need)
        .reduce((sum, exp) => sum + Number.parseFloat(exp.amount), 0)
      const wantPercentage = (wantSpending / totalSpent) * 100

      // Generate contextual nudges based on spending patterns
      const nudges = [
        `You've spent ₹${totalSpent.toLocaleString()} this month. Consider setting a monthly budget to track your progress.`,
        `${wantPercentage.toFixed(0)}% of your spending went to 'wants' this month. Try reducing this to 30% for better savings.`,
        `Great job tracking your expenses! You've logged ${expenses.length} transactions this month.`,
        `Consider moving ₹${Math.round(wantSpending * 0.2)} from 'wants' to your savings goals this month.`,
        `You're building great financial habits! Keep tracking to maintain your momentum.`,
      ]

      const randomNudge = nudges[Math.floor(Math.random() * nudges.length)]
      setNudge(randomNudge)
    } else {
      setNudge("Start tracking your expenses to get personalized financial insights and tips!")
    }

    setLoading(false)
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

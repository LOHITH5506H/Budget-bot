"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GoalCreationDialog } from "@/components/goal-creation-dialog"
import { useLoadingNavigation } from "@/hooks/use-loading-navigation"

interface SavingsGoalsWidgetProps {
  userId: string
}

interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
}

export function SavingsGoalsWidget({ userId }: SavingsGoalsWidgetProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const { navigateWithLoading } = useLoadingNavigation()

  useEffect(() => {
    const fetchGoals = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3)

      if (data) {
        setGoals(data)
      }
      setLoading(false)
    }

    fetchGoals()
  }, [userId])

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-blue-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-blue-200 rounded"></div>
              <div className="h-3 bg-blue-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Savings Goals
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700"
            onClick={() => navigateWithLoading("/goals")}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900">{goal.name}</h4>
                    <span className="text-xs text-gray-600">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>₹{goal.current_amount.toLocaleString()}</span>
                    <span>₹{goal.target_amount.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3 bg-transparent"
              onClick={() => navigateWithLoading("/goals")}
            >
              View All Goals
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <Target className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">No savings goals yet</p>
            <GoalCreationDialog
              userId={userId}
              trigger={
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Create Your First Goal
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

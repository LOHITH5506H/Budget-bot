"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Snowflake } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePusherEvent } from "@/hooks/use-pusher"

interface StreakWidgetProps {
  userId: string
}

interface StreakData {
  current_streak: number
  longest_streak: number
  streak_freezes: number
  last_activity_date: string | null
}

export function StreakWidget({ userId }: StreakWidgetProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStreakData = useCallback(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("streaks").select("*").eq("user_id", userId).single()

      if (data) {
        setStreakData(data)
      }
      setLoading(false)
    }, [userId])

    useEffect(() => {
      fetchStreakData()
    }, [fetchStreakData])

    // Listen for expense updates to update streak
    usePusherEvent('expense-updated', (data) => {
      console.log("[Streak] Received expense update, refreshing streak");
      fetchStreakData();
    }, [fetchStreakData]);

    // Listen for custom expense events
    useEffect(() => {
      const handleExpenseAdded = () => {
        console.log("[Streak] Expense added event received, refreshing streak");
        fetchStreakData();
      };

      window.addEventListener('expense-added', handleExpenseAdded);
      return () => window.removeEventListener('expense-added', handleExpenseAdded);
    }, [fetchStreakData])

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-orange-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-orange-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStreak = streakData?.current_streak || 0
  const streakFreezes = streakData?.streak_freezes || 0

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          Spending Streak
          {streakFreezes > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Snowflake className="w-3 h-3 mr-1" />
              {streakFreezes} freeze{streakFreezes !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-8 h-8 text-orange-500" />
            <div>
              <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
              <div className="text-sm text-gray-600">Day{currentStreak !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {currentStreak > 0 ? (
            <p className="text-sm text-gray-600">
              You're on a roll! Keep tracking your expenses to maintain your streak.
            </p>
          ) : (
            <p className="text-sm text-gray-600">Start tracking your expenses today to begin your streak!</p>
          )}
        </div>
        {streakData?.longest_streak && streakData.longest_streak > currentStreak && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <p className="text-xs text-gray-500">Best streak: {streakData.longest_streak} days</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SubscriptionCreationDialog } from "@/components/subscription-creation-dialog"
import { useLoadingNavigation } from "@/hooks/use-loading-navigation"

interface UpcomingSubscriptionsWidgetProps {
  userId: string
}

interface Subscription {
  id: string
  name: string
  amount: number
  due_date: number
  logo_url: string | null
}

export function UpcomingSubscriptionsWidget({ userId }: UpcomingSubscriptionsWidgetProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const { navigateWithLoading } = useLoadingNavigation()

  useEffect(() => {
    const fetchUpcomingSubscriptions = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("due_date")
        .limit(4)

      if (data) {
        setSubscriptions(data)
      }
      setLoading(false)
    }

    fetchUpcomingSubscriptions()
  }, [userId])

  const getDaysUntilDue = (dueDate: number) => {
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    let targetDate = new Date(currentYear, currentMonth, dueDate)
    if (dueDate < currentDay) {
      targetDate = new Date(currentYear, currentMonth + 1, dueDate)
    }

    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-purple-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-purple-200 rounded"></div>
              <div className="h-3 bg-purple-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
            Upcoming Bills
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-purple-600 hover:text-purple-700"
            onClick={() => navigateWithLoading("/subscriptions")}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {subscriptions.length > 0 ? (
          <div className="space-y-3">
            {subscriptions.map((subscription) => {
              const daysUntil = getDaysUntilDue(subscription.due_date)
              const isOverdue = daysUntil < 0
              const isDueSoon = daysUntil <= 3 && daysUntil >= 0

              return (
                <div key={subscription.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{subscription.name}</p>
                      <p className="text-xs text-gray-600">₹{subscription.amount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={isOverdue ? "destructive" : isDueSoon ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {isOverdue ? "Overdue" : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{subscription.due_date}th</p>
                  </div>
                </div>
              )
            })}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3 bg-transparent"
              onClick={() => navigateWithLoading("/subscriptions")}
            >
              Manage Subscriptions
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">No subscriptions tracked</p>
            <SubscriptionCreationDialog
              userId={userId}
              trigger={
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Add Subscription
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

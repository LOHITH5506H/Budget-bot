'use client'

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, IndianRupee } from "lucide-react"
import { SubscriptionCreationDialog } from "@/components/subscription-creation-dialog"
import { SubscriptionLogo } from "@/components/subscription-logo"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Pusher from 'pusher-js'

interface Subscription {
  id: string
  name: string
  amount: number
  billing_cycle: string
  next_due_date: string
  is_active: boolean
  logo_url: string
}

interface SubscriptionsListProps {
  userId: string
}

export function SubscriptionsList({ userId }: SubscriptionsListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubscriptions = useCallback(async () => {
    console.log("SUBSCRIPTIONS LIST: Fetching subscriptions for user:", userId)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, name, amount, billing_cycle, next_due_date, is_active, logo_url")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("next_due_date")

      if (error) {
        console.error("SUBSCRIPTIONS LIST: Fetch error:", error)
        return
      }

      console.log("SUBSCRIPTIONS LIST: Fetched subscriptions:", data?.length || 0)
      setSubscriptions(data || [])
    } catch (error) {
      console.error("SUBSCRIPTIONS LIST: Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  useEffect(() => {
    // Set up Pusher for real-time updates only if environment variables are available
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) {
      console.warn("SUBSCRIPTIONS LIST: Pusher configuration missing, real-time updates disabled")
      return
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    })

    const channel = pusher.subscribe(`user-${userId}`)
    
    console.log("SUBSCRIPTIONS LIST: Subscribing to Pusher channel:", `user-${userId}`)

    const handleSubscriptionUpdate = (data: any) => {
      console.log("SUBSCRIPTIONS LIST: Received subscription update:", data)
      
      if (data.type === 'subscription-created') {
        console.log("SUBSCRIPTIONS LIST: New subscription created, refreshing list")
        fetchSubscriptions()
      }
    }

    channel.bind('subscription-updated', handleSubscriptionUpdate)

    return () => {
      console.log("SUBSCRIPTIONS LIST: Cleaning up Pusher subscription")
      channel.unbind('subscription-updated', handleSubscriptionUpdate)
      pusher.unsubscribe(`user-${userId}`)
      pusher.disconnect()
    }
  }, [userId, fetchSubscriptions])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Add New Subscription Card */}
      <Card className="border-dashed border-2 border-emerald-300 bg-emerald-50">
        <CardContent className="p-6">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Subscription</h3>
            <p className="text-gray-600 mb-4">Track your recurring bills and subscriptions</p>
            <SubscriptionCreationDialog userId={userId} />
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      {subscriptions.length > 0 ? (
        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <SubscriptionLogo 
                      logoUrl={subscription.logo_url} 
                      subscriptionName={subscription.name} 
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{subscription.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{subscription.billing_cycle || 'monthly'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-lg font-semibold text-gray-900">
                      <IndianRupee className="w-4 h-4 mr-1" />
                      {subscription.amount}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due: {new Date(subscription.next_due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscriptions yet</h3>
            <p className="text-gray-600">Start tracking your recurring bills and subscriptions</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
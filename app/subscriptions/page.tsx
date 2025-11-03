import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, IndianRupee } from "lucide-react"
import Link from "next/link"
import { SubscriptionCreationDialog } from "@/components/subscription-creation-dialog"
import { SubscriptionLogo } from "@/components/subscription-logo"

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch subscriptions
  const { data: subscriptions, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, name, amount, billing_cycle, next_due_date, is_active, logo_url")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("next_due_date")

  // Debug logging
  console.log("Subscriptions fetch result:", { subscriptions, fetchError })
  if (subscriptions) {
    subscriptions.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`, {
        name: sub.name,
        logo_url: sub.logo_url,
        has_logo: !!sub.logo_url
      })
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscriptions & Bills</h1>
              <p className="text-gray-600">Manage your recurring expenses</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Add New Subscription Card */}
          <Card className="border-dashed border-2 border-emerald-300 bg-emerald-50">
            <CardContent className="p-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Subscription</h3>
                <p className="text-gray-600 mb-4">Track your recurring bills and subscriptions</p>
                <SubscriptionCreationDialog userId={user.id} />
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions List */}
          {subscriptions && subscriptions.length > 0 ? (
            <div className="grid gap-4">
              {subscriptions.map((subscription: any) => (
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
      </main>
    </div>
  )
}

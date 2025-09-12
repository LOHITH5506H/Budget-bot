import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { IntegrationSettings } from "@/components/settings/integration-settings"
import { NotificationCenter } from "@/components/notification-center"
import { CalendarSyncWidget } from "@/components/calendar-sync-widget"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your integrations and notification preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Integrations */}
            <div className="space-y-6">
              <IntegrationSettings userId={user.id} />
              <CalendarSyncWidget userId={user.id} />
            </div>

            {/* Right Column - Notifications */}
            <div>
              <NotificationCenter userId={user.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

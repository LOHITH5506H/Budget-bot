import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StreakWidget } from "@/components/dashboard/streak-widget"
import { QuickExpenseWidget } from "@/components/dashboard/quick-expense-widget"
import { QuickIncomeWidget } from "@/components/dashboard/quick-income-widget"
import { IncomeExpenseSummary } from "@/components/dashboard/income-expense-summary"
import { SpendingOverviewWidget } from "@/components/dashboard/spending-overview-widget"
import { SavingsGoalsWidget } from "@/components/dashboard/savings-goals-widget"
import { UpcomingSubscriptionsWidget } from "@/components/dashboard/upcoming-subscriptions-widget"
import { AiNudgesWidget } from "@/components/dashboard/ai-nudges-widget"
import { WeeklyReportWidget } from "@/components/dashboard/weekly-report-widget"

export default async function DashboardPage() {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StreakWidget userId={user.id} />
              <QuickExpenseWidget userId={user.id} />
            </div>

            {/* Income Entry Row */}
            <QuickIncomeWidget userId={user.id} />

            {/* Spending Overview */}
            <SpendingOverviewWidget userId={user.id} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <IncomeExpenseSummary userId={user.id} />
            <WeeklyReportWidget />
            <SavingsGoalsWidget userId={user.id} />
            <UpcomingSubscriptionsWidget userId={user.id} />
            <AiNudgesWidget userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  )
}

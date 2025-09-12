import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target, Calendar, IndianRupee } from "lucide-react"
import Link from "next/link"
import { GoalCreationDialog } from "@/components/goal-creation-dialog"

export default async function GoalsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch savings goals
  const { data: goals } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
              <p className="text-gray-600">Track your financial objectives</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Add New Goal Card */}
          <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
            <CardContent className="p-6">
              <div className="text-center">
                <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Goal</h3>
                <p className="text-gray-600 mb-4">Set a savings target and track your progress</p>
                <GoalCreationDialog userId={user.id} />
              </div>
            </CardContent>
          </Card>

          {/* Goals List */}
          {goals && goals.length > 0 ? (
            <div className="grid gap-4">
              {goals.map((goal: any) => {
                const progress = (goal.current_amount / goal.target_amount) * 100
                const remaining = goal.target_amount - goal.current_amount

                return (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Target className="w-5 h-5 mr-2 text-blue-600" />
                          {goal.name}
                        </span>
                        <span className="text-sm font-normal text-gray-600">{progress.toFixed(1)}% complete</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Progress value={progress} className="h-3" />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Current Amount</p>
                            <p className="font-semibold text-lg">₹{goal.current_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Target Amount</p>
                            <p className="font-semibold text-lg">₹{goal.target_amount.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center text-sm text-gray-600">
                            <IndianRupee className="w-4 h-4 mr-1" />
                            {remaining.toLocaleString()} remaining
                          </div>
                          {goal.target_date && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {new Date(goal.target_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No savings goals yet</h3>
                <p className="text-gray-600">Create your first savings goal to start tracking your progress</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

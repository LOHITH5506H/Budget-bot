"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface SpendingOverviewWidgetProps {
  userId: string
}

interface CategorySpending {
  name: string
  amount: number
  color: string
}

interface NeedWantData {
  type: string
  amount: number
}

export function SpendingOverviewWidget({ userId }: SpendingOverviewWidgetProps) {
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([])
  const [needWantData, setNeedWantData] = useState<NeedWantData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpendingData = async () => {
      console.log("[v0] Fetching spending data for user:", userId)
      const supabase = createClient()

      const now = new Date()
      const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM format
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const nextMonthStr = nextMonth.toISOString().split("T")[0] // YYYY-MM-DD format

      const { data: expenses, error } = await supabase
        .from("expenses")
        .select(`
          amount,
          is_need,
          category_id,
          categories (
            name,
            color
          )
        `)
        .eq("user_id", userId)
        .gte("expense_date", `${currentMonth}-01`)
        .lt("expense_date", nextMonthStr)

      console.log("[v0] Expenses query result:", { expenses, error })

      if (expenses && expenses.length > 0) {
        // Process category data
        const categoryMap = new Map<string, { amount: number; color: string }>()
        let needTotal = 0
        let wantTotal = 0

        expenses.forEach((expense: any) => {
          const categoryName = expense.categories?.name || "Other"
          const categoryColor = expense.categories?.color || "#6b7280"
          const amount = Number.parseFloat(expense.amount)

          if (categoryMap.has(categoryName)) {
            categoryMap.get(categoryName)!.amount += amount
          } else {
            categoryMap.set(categoryName, { amount, color: categoryColor })
          }

          if (expense.is_need) {
            needTotal += amount
          } else {
            wantTotal += amount
          }
        })

        const categorySpending = Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          amount: data.amount,
          color: data.color,
        }))

        console.log("[v0] Processed category data:", categorySpending)
        console.log("[v0] Need/Want totals:", { needTotal, wantTotal })

        setCategoryData(categorySpending)
        setNeedWantData([
          { type: "Needs", amount: needTotal },
          { type: "Wants", amount: wantTotal },
        ])
      } else {
        console.log("[v0] No expenses found for current month")
        setCategoryData([])
        setNeedWantData([])
      }

      setLoading(false)
    }

    fetchSpendingData()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#6b7280"]

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Spending Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Pie Chart */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">By Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">No spending data this month</div>
            )}
          </div>

          {/* Needs vs Wants Bar Chart */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Needs vs Wants</h3>
            {needWantData.some((d) => d.amount > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={needWantData}>
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">No spending data this month</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

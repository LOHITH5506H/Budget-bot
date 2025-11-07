"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { usePusherEvent } from "@/hooks/use-pusher"

interface IncomeExpenseSummaryProps {
  userId: string
}

export function IncomeExpenseSummary({ userId }: IncomeExpenseSummaryProps) {
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchFinancialData = useCallback(async () => {
    const supabase = createClient()
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)

    try {
      // Fetch income for current month
      const { data: incomeData } = await supabase
        .from('income')
        .select('amount')
        .eq('user_id', userId)
        .gte('received_date', startOfMonth.toISOString().split('T')[0])
        .lte('received_date', endOfMonth.toISOString().split('T')[0])

      // Fetch expenses for current month (using expense_date field)
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .gte('expense_date', startOfMonth.toISOString().split('T')[0])
        .lte('expense_date', endOfMonth.toISOString().split('T')[0])

      const income = incomeData?.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) || 0
      const expenses = expenseData?.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) || 0

      setTotalIncome(income)
      setTotalExpenses(expenses)
    } catch (error) {
      console.error("Error fetching financial data:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchFinancialData()
  }, [fetchFinancialData])

  // Listen for updates via Pusher
  usePusherEvent('income-updated', fetchFinancialData)
  usePusherEvent('expense-updated', fetchFinancialData)
  usePusherEvent('subscription-updated', fetchFinancialData)

  // Listen for custom events
  useEffect(() => {
    const handleUpdate = () => fetchFinancialData()
    
    window.addEventListener('income-updated', handleUpdate)
    window.addEventListener('expense-added', handleUpdate)
    window.addEventListener('subscription-added', handleUpdate)
    window.addEventListener('subscription-deleted', handleUpdate)
    
    return () => {
      window.removeEventListener('income-updated', handleUpdate)
      window.removeEventListener('expense-added', handleUpdate)
      window.removeEventListener('subscription-added', handleUpdate)
      window.removeEventListener('subscription-deleted', handleUpdate)
    }
  }, [fetchFinancialData])

  const netBalance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0
  const spendingRate = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100) : 0

  // Determine color based on financial health
  const getBalanceColor = () => {
    if (netBalance > 0) return "text-green-600"
    if (netBalance < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getBalanceIcon = () => {
    if (netBalance > 0) return <TrendingUp className="w-5 h-5 text-green-600" />
    if (netBalance < 0) return <TrendingDown className="w-5 h-5 text-red-600" />
    return <DollarSign className="w-5 h-5 text-gray-600" />
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <PiggyBank className="w-5 h-5 mr-2 text-blue-600" />
            Monthly Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <PiggyBank className="w-5 h-5 mr-2 text-blue-600" />
          Monthly Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Income */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Income</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Expenses</span>
          </div>
          <span className="text-lg font-bold text-red-600">
            ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Net Balance */}
        <div className={`flex items-center justify-between p-4 bg-white rounded-lg border-2 ${
          netBalance > 0 ? 'border-green-300' : netBalance < 0 ? 'border-red-300' : 'border-gray-300'
        }`}>
          <div className="flex items-center space-x-2">
            {getBalanceIcon()}
            <span className="text-sm font-semibold text-gray-700">Net Balance</span>
          </div>
          <span className={`text-xl font-bold ${getBalanceColor()}`}>
            ₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Progress Bar - Spending Rate */}
        {totalIncome > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Spending Rate</span>
              <span className="font-semibold">{Math.min(spendingRate, 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  spendingRate > 100 ? 'bg-red-600' :
                  spendingRate > 80 ? 'bg-orange-500' :
                  spendingRate > 60 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(spendingRate, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Savings Rate */}
        {totalIncome > 0 && (
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
            <span className="text-xs font-medium text-gray-700">Savings Rate</span>
            <span className={`text-sm font-bold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Status Message */}
        {totalIncome > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              {savingsRate >= 20 ? "🎉 Great job! You're saving well!" :
               savingsRate >= 10 ? "👍 Good progress, keep it up!" :
               savingsRate > 0 ? "⚠️ Try to save more this month" :
               "🚨 Spending exceeds income!"}
            </p>
          </div>
        )}

        {/* No Data Message */}
        {totalIncome === 0 && totalExpenses === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No financial data for this month yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add income or expenses to see your summary.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

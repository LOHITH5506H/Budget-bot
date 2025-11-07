"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, DollarSign, Briefcase, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { usePusherEvent } from "@/hooks/use-pusher"

const INCOME_CATEGORIES = [
  { value: "salary", label: "💼 Salary", icon: Briefcase },
  { value: "freelance", label: "💻 Freelance", icon: DollarSign },
  { value: "business", label: "🏢 Business", icon: TrendingUp },
  { value: "investment", label: "📈 Investment Returns", icon: TrendingUp },
  { value: "bonus", label: "🎁 Bonus", icon: DollarSign },
  { value: "rental", label: "🏠 Rental Income", icon: DollarSign },
  { value: "gift", label: "🎉 Gift", icon: DollarSign },
  { value: "other", label: "💰 Other", icon: DollarSign },
]

interface QuickIncomeWidgetProps {
  userId: string
}

export function QuickIncomeWidget({ userId }: QuickIncomeWidgetProps) {
  const { toast } = useToast()
  const [source, setSource] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("salary")
  const [description, setDescription] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState("monthly")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalIncome, setTotalIncome] = useState(0)

  console.log("[QuickIncome] Rendering with userId:", userId)

  // Fetch total income for current month
  const fetchMonthlyIncome = useCallback(async () => {
    const supabase = createClient()
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('income')
      .select('amount')
      .eq('user_id', userId)
      .gte('received_date', startOfMonth.toISOString().split('T')[0])
      .lte('received_date', endOfMonth.toISOString().split('T')[0])

    if (!error && data) {
      const total = data.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
      setTotalIncome(total)
    }
  }, [userId])

  useEffect(() => {
    fetchMonthlyIncome()
  }, [fetchMonthlyIncome])

  // Listen for income updates via Pusher
  usePusherEvent('income-updated', () => {
    console.log('Income updated event received, refetching...')
    fetchMonthlyIncome()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!source.trim() || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid source and amount",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const incomeData = {
        user_id: userId,
        source: source.trim(),
        amount: parseFloat(amount),
        category,
        description: description.trim() || null,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : null,
        received_date: new Date().toISOString().split('T')[0],
      }

      const { error } = await supabase.from('income').insert([incomeData])

      if (error) throw error

      // Success - reset form
      setSource("")
      setAmount("")
      setDescription("")
      setIsRecurring(false)
      setRecurringFrequency("monthly")
      
      toast({
        title: "💰 Income added!",
        description: `₹${parseFloat(amount).toLocaleString()} from ${source}`,
      })

      // Trigger Pusher notification
      await fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          event: 'income-updated',
          data: { source, amount: parseFloat(amount), category }
        })
      }).catch(() => {}) // Non-blocking

      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('income-updated', {
        detail: { source, amount: parseFloat(amount), category }
      }))

      // Refresh the total
      fetchMonthlyIncome()

    } catch (error) {
      console.error("Error adding income:", error)
      toast({
        title: "Error",
        description: "Failed to add income. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Quick Income Entry
        </CardTitle>
        <CardDescription>
          Track your income sources • This month: ₹{totalIncome.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g., Monthly Salary"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCOME_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Add notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded"
              disabled={isSubmitting}
            />
            <Label htmlFor="recurring" className="cursor-pointer">
              Recurring income
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={recurringFrequency} onValueChange={setRecurringFrequency} disabled={isSubmitting}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add Income"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

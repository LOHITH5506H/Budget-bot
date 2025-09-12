"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, IndianRupee } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface QuickExpenseWidgetProps {
  userId: string
}

interface Category {
  id: string
  name: string
  icon: string
}

export function QuickExpenseWidget({ userId }: QuickExpenseWidgetProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isNeed, setIsNeed] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("categories").select("id, name, icon").order("name")
      if (data) {
        setCategories(data)
        setCategoryId(data[0]?.id || "")
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !categoryId) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        amount: Number.parseFloat(amount),
        description,
        category_id: categoryId,
        is_need: isNeed,
        expense_date: new Date().toISOString().split("T")[0],
      })

      if (error) throw error

      // Reset form
      setAmount("")
      setDescription("")
      setIsNeed(true)

      toast({
        title: "Expense added!",
        description: `₹${amount} expense has been recorded.`,
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-emerald-600" />
          Quick Expense
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center">
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              placeholder="What did you spend on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="need-want" checked={isNeed} onCheckedChange={setIsNeed} />
              <Label htmlFor="need-want" className="text-sm font-medium">
                {isNeed ? "Need" : "Want"}
              </Label>
            </div>
            <Button
              type="submit"
              disabled={loading || !amount || !description}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

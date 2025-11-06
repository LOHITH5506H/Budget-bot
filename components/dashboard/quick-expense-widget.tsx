"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, IndianRupee } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/contexts/loading-context";
import { useRouter } from "next/navigation";

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
  const { isLoading, showLoading, hideLoading } = useLoading();
  const { toast } = useToast()
  const router = useRouter();
  const hasLoadedCategoriesRef = useRef(false) // Prevent duplicate fetches

  useEffect(() => {
    const fetchCategories = async () => {
      // Only fetch once on component mount
      if (hasLoadedCategoriesRef.current) {
        return
      }
      
      hasLoadedCategoriesRef.current = true
      const supabase = createClient()
      console.log("[QuickExpense] Fetching categories...")
      const { data, error } = await supabase.from("categories").select("id, name, icon").order("name")
      console.log("[QuickExpense] Categories response:", { data, error })
      if (data) {
        setCategories(data)
        if (data[0]) {
          setCategoryId(data[0].id)
          console.log("[QuickExpense] Default category set to:", data[0].id)
        }
      }
      if (error) {
        console.error("[QuickExpense] Error fetching categories:", error)
      }
    }
    fetchCategories()
  }, []); // Empty deps - only run once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !categoryId) return;

    const amountNum = Number.parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
        return;
    }

    console.log("%cQUICK EXPENSE: --- handleSubmit START ---", "color: green; font-weight: bold;");
    showLoading();
    console.log("QUICK EXPENSE: showLoading() CALLED");

    let loadingHidden = false;
    const ensureHideLoading = () => {
        if (!loadingHidden) {
            console.log("%cQUICK EXPENSE: Hiding loading (ensureHideLoading)", "color: orange; font-weight: bold;");
            hideLoading();
            loadingHidden = true;
        }
    };

    try {
      console.log("QUICK EXPENSE: Starting async operations...");
      const supabase = createClient()
      console.log("[v0] Submitting expense:", { userId, amount: amountNum, description, categoryId, isNeed })

      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        amount: amountNum,
        description,
        category_id: categoryId,
        is_need: isNeed,
        expense_date: new Date().toISOString().split("T")[0],
      })

      if (error) {
        console.error("[v0] Error inserting expense:", error)
        throw error
      }

      console.log("[v0] Expense added successfully");

      // Send real-time notification to update dashboard
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'expense_update',
            title: '💰 Expense Added',
            message: `₹${amountNum.toFixed(2)} expense recorded for ${description}`,
            data: {
              amount: amountNum,
              description,
              category_id: categoryId,
              is_need: isNeed,
              expense_date: new Date().toISOString().split("T")[0],
            }
          })
        });
        console.log("QUICK EXPENSE: Real-time notification sent");
      } catch (notifyError) {
        console.error("QUICK EXPENSE: Failed to send real-time notification:", notifyError);
      }

      console.log("QUICK EXPENSE: Async operations complete.");

      // Actions on success
      ensureHideLoading();
      setAmount("")
      setDescription("")
      setIsNeed(true)

      toast({
        title: "Expense added!",
        description: `₹${amountNum.toFixed(2)} expense has been recorded.`,
      })

      // Trigger dashboard refresh event for real-time updates
      window.dispatchEvent(new CustomEvent('expense-added', { 
        detail: { 
          amount: amountNum, 
          description, 
          categoryId, 
          isNeed,
          userId 
        } 
      }));

      router.refresh(); // Refresh server components
      console.log("QUICK EXPENSE: Form reset, toast shown, router refreshed, real-time events dispatched.");

    } catch (error) {
      console.error("[v0] Failed to add expense:", error)
      ensureHideLoading();
      toast({
        title: "Error",
        description: `Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
        ensureHideLoading();
        console.log("%cQUICK EXPENSE: --- handleSubmit END (Finally) ---", "color: green; font-weight: bold;");
    }
  }

  // Rest of the component's JSX remains the same...
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
              <Label htmlFor="expense-amount" className="text-sm font-medium">Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="expense-amount" type="number" placeholder="0.00" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9" step="0.01" min="0.01" required disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category" className="text-sm font-medium">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required disabled={isLoading || categories.length === 0}>
                <SelectTrigger id="expense-category" className="w-full">
                  <SelectValue placeholder={categories.length > 0 ? "Select category" : "Loading..."} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center">
                        <span className="mr-2">{category.icon || '•'}</span>
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description" className="text-sm font-medium">Description</Label>
            <Input
              id="expense-description" placeholder="What did you spend on?" value={description}
              onChange={(e) => setDescription(e.target.value)} required disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="expense-need-want" checked={isNeed} onCheckedChange={setIsNeed} disabled={isLoading} />
              <Label htmlFor="expense-need-want" className={`text-sm font-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isNeed ? "Need" : "Want"}
              </Label>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !amount || !description || !categoryId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Expense
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
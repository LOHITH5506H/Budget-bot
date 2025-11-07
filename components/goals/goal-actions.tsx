"use client"

import { useState } from "react"
import { MoreVertical, PiggyBank, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface GoalActionsProps {
  goalId: string
  goalName: string
  userId: string
  targetAmount: number
}

export function GoalActions({ goalId, goalName, userId, targetAmount }: GoalActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [note, setNote] = useState("")
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddSavings = async () => {
    const parsedAmount = Number.parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive number.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { data: goal, error: fetchError } = await supabase
        .from("savings_goals")
        .select("current_amount, target_amount")
        .eq("id", goalId)
        .maybeSingle()

      if (fetchError || !goal) {
        throw new Error(fetchError?.message || "Goal not found")
      }

      const nextAmount = (goal.current_amount ?? 0) + parsedAmount

      const { error: updateError } = await supabase
        .from("savings_goals")
        .update({
          current_amount: nextAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)

      if (updateError) {
        throw updateError
      }

      try {
        await supabase.from("goal_savings_entries").insert({
          goal_id: goalId,
          user_id: userId,
          amount: parsedAmount,
          note: note || null,
        })
      } catch (entryError) {
        console.warn("goal_savings_entries insert failed", entryError)
      }

      toast({
        title: "Savings added",
        description: `Recorded ₹${parsedAmount.toFixed(2)} for ${goalName}.`,
      })

      window.dispatchEvent(
        new CustomEvent("goal-updated", {
          detail: { goalId, type: "savings-added", amount: parsedAmount },
        }),
      )

      setIsAddOpen(false)
      setAmount("")
      setNote("")
      router.refresh()
    } catch (error) {
      console.error("Failed to add savings", error)
      toast({
        title: "Could not add savings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("savings_goals")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)

      if (error) {
        throw error
      }

      // Close dialog immediately
      setIsDeleteOpen(false)

      // Show success toast
      toast({
        title: "Goal removed",
        description: `${goalName} is no longer active.`,
      })

      // Dispatch custom event for real-time updates
      window.dispatchEvent(
        new CustomEvent("goal-deleted", {
          detail: { goalId, goalName, type: "goal-deleted" },
        }),
      )

      // Force hard reload to ensure UI updates
      window.location.reload()

    } catch (error) {
      console.error("Failed to delete goal", error)
      toast({
        title: "Could not delete goal",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Goal actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setIsAddOpen(true)}>
            <PiggyBank className="mr-2 h-4 w-4" />
            Add savings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onSelect={() => setIsDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete goal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAddOpen} onOpenChange={(open) => !isSubmitting && setIsAddOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add savings to {goalName}</DialogTitle>
            <DialogDescription>Record a new savings contribution towards your goal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`savings-amount-${goalId}`}>Amount (₹)</Label>
              <Input
                id={`savings-amount-${goalId}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Target: ₹{targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`savings-note-${goalId}`}>Note (optional)</Label>
              <Textarea
                id={`savings-note-${goalId}`}
                placeholder="E.g. salary bonus, monthly transfer"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddSavings} isLoading={isSubmitting} loadingText="Recording...">
              Add savings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => !isDeleting && setIsDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {goalName}?</DialogTitle>
            <DialogDescription>
              This removes the goal from active tracking. You can recreate it later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting} loadingText="Removing...">
              Delete goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

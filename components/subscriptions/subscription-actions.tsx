"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { MoreVertical, Trash2, Edit } from "lucide-react"

interface SubscriptionActionsProps {
  subscriptionId: string
  subscriptionName: string
  subscriptionAmount?: number
  subscriptionBillingCycle?: string
  subscriptionNextDueDate?: string
}

export function SubscriptionActions({ 
  subscriptionId, 
  subscriptionName,
  subscriptionAmount = 0,
  subscriptionBillingCycle = "monthly",
  subscriptionNextDueDate = ""
}: SubscriptionActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [editData, setEditData] = useState({
    name: subscriptionName,
    amount: subscriptionAmount.toString(),
    billing_cycle: subscriptionBillingCycle,
    next_due_date: subscriptionNextDueDate
  })

  const handleEdit = async () => {
    const amountNum = Number.parseFloat(editData.amount)
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive number.", variant: "destructive" })
      return
    }

    setIsUpdating(true)
    try {
      const supabase = createClient()
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from("subscriptions")
        .update({
          name: editData.name,
          amount: amountNum,
          billing_cycle: editData.billing_cycle,
          next_due_date: editData.next_due_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId)

      if (error) {
        throw error
      }

      // Send Pusher notification (non-blocking)
      fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          event: 'subscription-updated',
          data: {
            id: subscriptionId,
            name: editData.name,
            amount: amountNum,
            billing_cycle: editData.billing_cycle,
            next_due_date: editData.next_due_date,
            action: 'updated'
          }
        })
      }).catch(err => console.error('❌ Pusher notification failed:', err))

      toast({
        title: "✅ Subscription updated",
        description: `${editData.name} has been updated successfully.`,
      })

      window.dispatchEvent(
        new CustomEvent("subscription-updated", {
          detail: { subscriptionId, type: "subscription-edited" },
        }),
      )

      setIsEditOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to update subscription", error)
      toast({
        title: "❌ Could not update subscription",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const supabase = createClient()
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from("subscriptions")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId)

      if (error) {
        throw error
      }

      // Close dialog immediately
      setIsDeleteOpen(false)

      // Show success toast
      toast({
        title: "🗑️ Subscription removed",
        description: `${subscriptionName} has been deleted.`,
      })

      // Send Pusher notification (non-blocking, ignore errors)
      fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          event: 'subscription-deleted',
          data: {
            id: subscriptionId,
            name: subscriptionName,
            action: 'deleted'
          }
        })
      }).catch(() => {}) // Silently fail

      // Dispatch custom event for real-time updates
      window.dispatchEvent(
        new CustomEvent("subscription-deleted", {
          detail: { subscriptionId, subscriptionName, type: "subscription-deleted" },
        }),
      )

      // Force hard reload to ensure UI updates
      window.location.reload()

    } catch (error) {
      console.error("Failed to delete subscription", error)
      toast({
        title: "❌ Could not delete subscription",
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
            <span className="sr-only">Subscription actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit subscription
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onSelect={() => setIsDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete subscription
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={(open) => !isUpdating && setIsEditOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {subscriptionName}</DialogTitle>
            <DialogDescription>Update subscription details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${subscriptionId}`}>Service Name</Label>
              <Input
                id={`edit-name-${subscriptionId}`}
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-amount-${subscriptionId}`}>Amount (₹)</Label>
              <Input
                id={`edit-amount-${subscriptionId}`}
                type="number"
                step="0.01"
                min="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-billing-${subscriptionId}`}>Billing Cycle</Label>
              <Select 
                value={editData.billing_cycle} 
                onValueChange={(value) => setEditData({ ...editData, billing_cycle: value })}
                disabled={isUpdating}
              >
                <SelectTrigger id={`edit-billing-${subscriptionId}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-date-${subscriptionId}`}>Next Due Date</Label>
              <Input
                id={`edit-date-${subscriptionId}`}
                type="date"
                value={editData.next_due_date}
                onChange={(e) => setEditData({ ...editData, next_due_date: e.target.value })}
                disabled={isUpdating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleEdit} isLoading={isUpdating} loadingText="Updating...">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => !isDeleting && setIsDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {subscriptionName}?</DialogTitle>
            <DialogDescription>
              This removes the subscription from your active list. Billing history stays intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting} loadingText="Removing...">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

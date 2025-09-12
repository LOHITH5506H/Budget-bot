"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calendar, CalendarPlus, Bell } from "lucide-react"
import { useRouter } from "next/navigation"

interface SubscriptionCreationDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export function SubscriptionCreationDialog({ userId, trigger }: SubscriptionCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    billing_cycle: "monthly",
    next_due_date: "",
    sync_to_calendar: true,
    email_notifications: true,
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const nextDueDate = new Date(formData.next_due_date)
      const dueDate = nextDueDate.getDate() // Get day of month (1-31)

      const { error } = await supabase.from("subscriptions").insert({
        user_id: userId,
        name: formData.name,
        amount: Number.parseFloat(formData.amount),
        billing_cycle: formData.billing_cycle,
        next_due_date: formData.next_due_date,
        due_date: dueDate, // Add the required due_date field
        is_active: true,
      })

      if (error) throw error

      if (formData.sync_to_calendar) {
        try {
          await fetch("/api/calendar/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "bill_reminder",
              data: {
                name: formData.name,
                amount: Number.parseFloat(formData.amount),
                dueDate: formData.next_due_date,
                description: `${formData.billing_cycle} subscription - ${formData.name}`,
              },
            }),
          })
        } catch (calendarError) {
          console.error("Calendar sync failed:", calendarError)
          // Don't fail the entire operation if calendar sync fails
        }
      }

      setOpen(false)
      setFormData({
        name: "",
        amount: "",
        billing_cycle: "monthly",
        next_due_date: "",
        sync_to_calendar: true,
        email_notifications: true,
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
            Add New Subscription
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              placeholder="e.g., Netflix, Spotify, Internet Bill"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="199"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="billing_cycle">Billing Cycle</Label>
            <Select
              value={formData.billing_cycle}
              onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="next_due_date">Next Due Date</Label>
            <Input
              id="next_due_date"
              type="date"
              value={formData.next_due_date}
              onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync_to_calendar"
                checked={formData.sync_to_calendar}
                onCheckedChange={(checked) => setFormData({ ...formData, sync_to_calendar: checked as boolean })}
              />
              <Label htmlFor="sync_to_calendar" className="flex items-center text-sm">
                <CalendarPlus className="w-4 h-4 mr-1 text-emerald-600" />
                Sync to Google Calendar
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email_notifications"
                checked={formData.email_notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked as boolean })}
              />
              <Label htmlFor="email_notifications" className="flex items-center text-sm">
                <Bell className="w-4 h-4 mr-1 text-blue-600" />
                Email reminders via SendPulse
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Plus, Calendar, Bell } from "lucide-react"
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
  const [calendarStatus, setCalendarStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const nextDueDate = new Date(formData.next_due_date)
      const dueDate = nextDueDate.getDate() // Get day of month (1-31)

      const { data: insertedSubscription, error } = await supabase.from("subscriptions").insert({
        user_id: userId,
        name: formData.name,
        amount: Number.parseFloat(formData.amount),
        billing_cycle: formData.billing_cycle,
        next_due_date: formData.next_due_date,
        due_date: dueDate, // Add the required due_date field
        is_active: true,
      }).select().single()

      if (error) throw error

      // Check if the due date is today and send immediate notification
      const today = new Date()
      const isToday = nextDueDate.toDateString() === today.toDateString()
      
      if (isToday && formData.email_notifications) {
        try {
          // Send immediate notification for same-day due date
          await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "bill_reminder",
              data: {
                billName: formData.name,
                amount: Number.parseFloat(formData.amount),
                dueDate: formData.next_due_date,
              },
              recipients: {
                email: [], // Will use user's email from session
              },
            }),
          })
          console.log(`Sent immediate notification for ${formData.name} - due today!`)
        } catch (emailError) {
          console.error("Immediate email notification failed:", emailError)
        }
      }

      // Sync to Google Calendar if enabled
      if (formData.sync_to_calendar) {
        try {
          setCalendarStatus("syncing")
          
          const calendarResponse = await fetch("/api/calendar/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: {
                name: formData.name,
                amount: Number.parseFloat(formData.amount),
                billing_cycle: formData.billing_cycle,
                next_due_date: formData.next_due_date,
              },
            }),
          })

          if (!calendarResponse.ok) {
            throw new Error("Calendar sync failed")
          }

          const calendarResult = await calendarResponse.json()
          console.log("Calendar sync successful:", calendarResult)
          setCalendarStatus("success")
          
        } catch (calendarError) {
          console.error("Calendar sync failed:", calendarError)
          setCalendarStatus("error")
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
      setCalendarStatus("idle")
      router.refresh()
      
    } catch (error) {
      console.error("Error creating subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar event data for the Add to Calendar button
  const getCalendarEvent = () => {
    if (!formData.name || !formData.next_due_date) return null

    const dueDate = new Date(formData.next_due_date)
    const reminderDate = new Date(dueDate)
    reminderDate.setDate(dueDate.getDate() - 1) // Reminder 1 day before

    return {
      name: `${formData.name} Payment Due`,
      description: `${formData.billing_cycle} subscription payment of ₹${formData.amount} for ${formData.name}`,
      startDate: reminderDate.toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "09:30",
      recurrence: formData.billing_cycle === 'monthly' ? 'FREQ=MONTHLY;INTERVAL=1' 
                 : formData.billing_cycle === 'yearly' ? 'FREQ=YEARLY;INTERVAL=1'
                 : 'FREQ=WEEKLY;INTERVAL=1',
      uid: `subscription-${formData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
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
                <Calendar className="w-4 h-4 mr-1 text-emerald-600" />
                Sync to Google Calendar
                {calendarStatus === "syncing" && <span className="ml-2 text-xs text-yellow-600">Syncing...</span>}
                {calendarStatus === "success" && <span className="ml-2 text-xs text-green-600">✓ Synced</span>}
                {calendarStatus === "error" && <span className="ml-2 text-xs text-red-600">✗ Failed</span>}
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

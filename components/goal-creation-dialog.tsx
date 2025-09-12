"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Plus, Target, CalendarPlus, Bell } from "lucide-react"
import { useRouter } from "next/navigation"

interface GoalCreationDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export function GoalCreationDialog({ userId, trigger }: GoalCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: "",
    target_date: "",
    sync_to_calendar: true,
    milestone_notifications: true,
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("savings_goals").insert({
        user_id: userId,
        name: formData.name,
        description: formData.description,
        target_amount: Number.parseFloat(formData.target_amount),
        current_amount: 0,
        target_date: formData.target_date || null,
        is_active: true,
      })

      if (error) throw error

      if (formData.sync_to_calendar && formData.target_date) {
        try {
          await fetch("/api/calendar/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "goal_milestone",
              data: {
                name: formData.name,
                targetAmount: Number.parseFloat(formData.target_amount),
                currentAmount: 0,
                targetDate: formData.target_date,
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
        description: "",
        target_amount: "",
        target_date: "",
        sync_to_calendar: true,
        milestone_notifications: true,
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating goal:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Create New Savings Goal
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              placeholder="e.g., New Laptop, Vacation Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this goal for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="target_amount">Target Amount (₹)</Label>
            <Input
              id="target_amount"
              type="number"
              placeholder="50000"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="target_date">Target Date (Optional)</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync_to_calendar"
                checked={formData.sync_to_calendar}
                onCheckedChange={(checked) => setFormData({ ...formData, sync_to_calendar: checked as boolean })}
                disabled={!formData.target_date}
              />
              <Label htmlFor="sync_to_calendar" className="flex items-center text-sm">
                <CalendarPlus className="w-4 h-4 mr-1 text-blue-600" />
                Sync milestone to Google Calendar
                {!formData.target_date && <span className="text-xs text-gray-500 ml-1">(requires target date)</span>}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="milestone_notifications"
                checked={formData.milestone_notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, milestone_notifications: checked as boolean })}
              />
              <Label htmlFor="milestone_notifications" className="flex items-center text-sm">
                <Bell className="w-4 h-4 mr-1 text-purple-600" />
                Progress notifications via SendPulse
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

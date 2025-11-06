"use client"

import React, { useState, forwardRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Plus, Target, CalendarPlus, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLoading } from "@/contexts/loading-context";
import { useToast } from "@/hooks/use-toast"
import { createGoalCalendarUrl, openCalendarInNewTab } from "@/lib/add-to-calendar"

interface GoalCreationDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export const GoalCreationDialog = forwardRef<HTMLButtonElement, GoalCreationDialogProps>(
  ({ userId, trigger }, ref) => {
    const [open, setOpen] = useState(false)
    const { showLoading, hideLoading } = useLoading();
    const [isSubmitting, setIsSubmitting] = useState(false); // Local state
    const { toast } = useToast(); // Initialize toast
    const [formData, setFormData] = useState({
      name: "", description: "", target_amount: "", target_date: "",
      add_to_calendar: false, milestone_notifications: true,
    })
    const router = useRouter()

    console.log("DIALOG (Goal): Rendering, isSubmitting (local):", isSubmitting);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("%cDIALOG (Goal): --- handleSubmit START ---", "color: green; font-weight: bold;");
      setIsSubmitting(true);
      showLoading();
      console.log("DIALOG (Goal): setIsSubmitting(true) and showLoading() CALLED");

      let loadingHidden = false;
      const ensureHideLoading = () => {
          if (!loadingHidden) {
              console.log("%cDIALOG (Goal): Hiding loading (ensureHideLoading)", "color: orange; font-weight: bold;");
              hideLoading();
              loadingHidden = true;
          }
      };

      try {
        console.log("DIALOG (Goal): Starting async operations...");
        const supabase = createClient()

        const targetAmountNum = Number.parseFloat(formData.target_amount);
        if (isNaN(targetAmountNum) || targetAmountNum <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid positive target amount.", variant: "destructive" });
            throw new Error("Invalid target amount"); // Throw to trigger catch block
        }

        const { error } = await supabase.from("savings_goals").insert({
            user_id: userId, name: formData.name, description: formData.description,
            target_amount: targetAmountNum, current_amount: 0,
            target_date: formData.target_date || null, is_active: true,
        });

        if (error) {
            console.error("DIALOG (Goal): Supabase insert error:", error);
            throw error;
        }
        console.log("DIALOG (Goal): Supabase insert successful");

        // Send notifications in parallel (don't wait for them to prevent blocking)
        const notificationPromises = [];

        // 1. Send Pusher real-time notification
        notificationPromises.push(
            fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    type: 'goal_update',
                    title: 'Goal Created',
                    message: `${formData.name} goal has been created successfully!`,
                    data: {
                        goalName: formData.name,
                        targetAmount: targetAmountNum,
                        currentAmount: 0,
                        targetDate: formData.target_date
                    }
                })
            }).catch(err => console.error('DIALOG (Goal): Pusher notification failed:', err))
        );

        // 2. Send email notification if enabled
        if (formData.milestone_notifications) {
            notificationPromises.push(
                fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        type: 'goal_milestone',
                        data: {
                            goalName: formData.name,
                            currentAmount: 0,
                            targetAmount: targetAmountNum
                        }
                    })
                }).catch(err => console.error('DIALOG (Goal): Email notification failed:', err))
            );
        }

        // Execute all notifications in parallel without waiting
        Promise.all(notificationPromises).then(() => {
            console.log('DIALOG (Goal): All notifications processed');
        });

        console.log("DIALOG (Goal): Async operations likely complete.");
        
        // Prepare calendar data before closing dialog
        const calendarData = {
            name: formData.name,
            targetAmount: targetAmountNum,
            targetDate: formData.target_date ? new Date(formData.target_date) : new Date(),
            description: formData.description
        };
        const shouldAddToCalendar = formData.add_to_calendar && formData.target_date;
        
        // Success actions
        ensureHideLoading();
        setIsSubmitting(false);
        setOpen(false);
        setFormData({ name: "", description: "", target_amount: "", target_date: "", add_to_calendar: false, milestone_notifications: true });
        toast({ title: "Goal Created!", description: `Your goal "${formData.name}" has been added.` });
        router.refresh();
        console.log("DIALOG (Goal): Dialog closed, form reset, router refreshed.");
        
        // Open calendar in new tab after dialog closes
        if (shouldAddToCalendar) {
            const calendarUrl = createGoalCalendarUrl(
                calendarData.name,
                calendarData.targetAmount,
                calendarData.targetDate,
                0,
                calendarData.description
            );
            openCalendarInNewTab(calendarUrl);
        }

      } catch (error) {
        console.error("Error creating goal in catch block:", error);
        ensureHideLoading();
        setIsSubmitting(false);
        // Show specific error if it's not the validation one
        if (!(error instanceof Error && error.message === "Invalid target amount")) {
            toast({ title: "Error Creating Goal", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
        }
      } finally {
         ensureHideLoading();
         // Check if still submitting (might happen if error occurred before setIsSubmitting(false))
         if (isSubmitting) setIsSubmitting(false);
         console.log("%cDIALOG (Goal): --- handleSubmit END (Finally) ---", "color: green; font-weight: bold;");
      }
    }

    return (
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isSubmitting) setOpen(isOpen); }}>
        <DialogTrigger asChild>
          {trigger ? React.cloneElement(trigger as React.ReactElement, { ref }) : (
            <Button ref={ref} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Create Goal
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if(isSubmitting) e.preventDefault(); }} onEscapeKeyDown={(e) => { if(isSubmitting) e.preventDefault(); }}>
           <DialogHeader>
             <DialogTitle className="flex items-center">
               <Target className="w-5 h-5 mr-2 text-blue-600" /> Create New Savings Goal
             </DialogTitle>
             <DialogDescription>Fill in the details for your new savings goal.</DialogDescription>
           </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="goal-name">Goal Name</Label><Input id="goal-name" placeholder="e.g., New Laptop, Vacation Fund" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={isSubmitting} /></div>
              <div><Label htmlFor="goal-description">Description (Optional)</Label><Textarea id="goal-description" placeholder="What is this goal for?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={isSubmitting} /></div>
              <div><Label htmlFor="goal-target_amount">Target Amount (₹)</Label><Input id="goal-target_amount" type="number" step="0.01" min="0.01" placeholder="50000" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} required disabled={isSubmitting} /></div>
              <div><Label htmlFor="goal-target_date">Target Date (Optional)</Label><Input id="goal-target_date" type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} disabled={isSubmitting} /></div>
              <div className="space-y-3 pt-2 border-t">
                 <div className="flex items-center space-x-2"><Checkbox id="goal-add_to_calendar" checked={formData.add_to_calendar} onCheckedChange={(checked) => setFormData({ ...formData, add_to_calendar: checked as boolean })} disabled={!formData.target_date || isSubmitting} /><Label htmlFor="goal-add_to_calendar" className={`flex items-center text-sm ${isSubmitting || !formData.target_date ? 'opacity-50 cursor-not-allowed' : ''}`}><CalendarPlus className="w-4 h-4 mr-1 text-blue-600" /> Add to Google Calendar {!formData.target_date && <span className="text-xs text-gray-500 ml-1">(requires target date)</span>}</Label></div>
                 <div className="flex items-center space-x-2"><Checkbox id="goal-milestone_notifications" checked={formData.milestone_notifications} onCheckedChange={(checked) => setFormData({ ...formData, milestone_notifications: checked as boolean })} disabled={isSubmitting} /><Label htmlFor="goal-milestone_notifications" className={`flex items-center text-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}><Bell className="w-4 h-4 mr-1 text-purple-600" /> Progress notifications via SendPulse</Label></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting} loadingText="Creating...">Create Goal</Button>
              </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>
    )
  }
);
GoalCreationDialog.displayName = "GoalCreationDialog";
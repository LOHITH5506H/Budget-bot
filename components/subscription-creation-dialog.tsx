"use client"

import React, { useState, forwardRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calendar, CalendarPlus, Bell, Search, Image, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLoading } from "@/contexts/loading-context";
import { useToast } from "@/hooks/use-toast"
import { createSubscriptionCalendarUrl, openCalendarInNewTab } from "@/lib/add-to-calendar"

interface SubscriptionCreationDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export const SubscriptionCreationDialog = forwardRef<HTMLButtonElement, SubscriptionCreationDialogProps>(
  ({ userId, trigger }, ref) => {
    const [open, setOpen] = useState(false)
    const { showLoading, hideLoading } = useLoading();
    const [isSubmitting, setIsSubmitting] = useState(false); // Local state
    const { toast } = useToast(); // Initialize toast
    const [formData, setFormData] = useState({
        name: "", amount: "", billing_cycle: "monthly",
        next_due_date: "", add_to_calendar: false, email_notifications: true,
        logo_url: ""
    })
    const [logoSuggestions, setLogoSuggestions] = useState<Array<{domain: string, logo: string}>>([])
    const [isSearchingLogos, setIsSearchingLogos] = useState(false)
    const [selectedLogo, setSelectedLogo] = useState<string>("")
    const router = useRouter()

    // Search for logos when service name changes
    useEffect(() => {
        const searchLogos = async () => {
            if (formData.name.length >= 3) {
                setIsSearchingLogos(true)
                try {
                    const response = await fetch('/api/logos/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: formData.name })
                    })
                    
                    if (response.ok) {
                        const data = await response.json()
                        setLogoSuggestions(data.suggestions || [])
                    }
                } catch (error) {
                    console.error('Error searching logos:', error)
                } finally {
                    setIsSearchingLogos(false)
                }
            } else {
                setLogoSuggestions([])
            }
        }

        const debounceTimeout = setTimeout(searchLogos, 500)
        return () => clearTimeout(debounceTimeout)
    }, [formData.name])

    const handleLogoSelect = (logo: {domain: string, logo: string}) => {
        console.log("DIALOG (Subscription): Logo selected:", logo);
        setSelectedLogo(logo.logo)
        setFormData({
            ...formData,
            logo_url: logo.logo
        })
        console.log("DIALOG (Subscription): Updated formData with logo_url:", logo.logo);
    }

    console.log("DIALOG (Subscription): Rendering, isSubmitting (local):", isSubmitting);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("%cDIALOG (Subscription): --- handleSubmit START ---", "color: green; font-weight: bold;");
        setIsSubmitting(true);
        showLoading();
        console.log("DIALOG (Subscription): setIsSubmitting(true) and showLoading() CALLED");

        let loadingHidden = false;
        const ensureHideLoading = () => {
            if (!loadingHidden) {
                console.log("%cDIALOG (Subscription): Hiding loading (ensureHideLoading)", "color: orange; font-weight: bold;");
                hideLoading();
                loadingHidden = true;
            }
        };

        try {
            console.log("DIALOG (Subscription): Starting async operations...");
            const supabase = createClient()

            let nextDueDate: Date;
            try {
                 nextDueDate = new Date(formData.next_due_date);
                 if (isNaN(nextDueDate.getTime())) throw new Error(); // Check if valid date
            } catch {
                 toast({ title: "Invalid Date", description: "Please enter a valid next due date.", variant: "destructive" });
                 throw new Error("Invalid Next Due Date entered.");
            }

            const amountNum = Number.parseFloat(formData.amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                 toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
                 throw new Error("Invalid amount entered");
            }

            // Insert subscription with core fields
            const subscriptionData = {
                user_id: userId, 
                name: formData.name, 
                amount: amountNum,
                is_active: true, 
                logo_url: formData.logo_url || null,
            };

            // Add optional fields that might exist in the schema
            if (formData.billing_cycle) {
                (subscriptionData as any).billing_cycle = formData.billing_cycle;
            }
            if (formData.next_due_date) {
                (subscriptionData as any).next_due_date = formData.next_due_date;
                // Also add due_date as day of month for legacy schema compatibility
                const dayOfMonth = nextDueDate.getDate(); // Extract day (1-31)
                (subscriptionData as any).due_date = dayOfMonth;
            }

            console.log("DIALOG (Subscription): Inserting data:", JSON.stringify(subscriptionData, null, 2));
            
            const { error } = await supabase.from("subscriptions").insert(subscriptionData);

            if (error) {
                console.error("DIALOG (Subscription): Supabase insert error:", error);
                console.error("DIALOG (Subscription): Error details:", JSON.stringify(error, null, 2));
                throw error;
            }
            console.log("DIALOG (Subscription): Supabase insert successful!");

            // Send notifications in parallel (don't wait for them to prevent blocking)
            const notificationPromises = [];

            // 1. Send Pusher real-time notification via trigger endpoint
            notificationPromises.push(
                fetch('/api/pusher/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        event: 'subscription-added',
                        data: {
                            name: formData.name,
                            amount: amountNum,
                            billing_cycle: formData.billing_cycle,
                            next_due_date: formData.next_due_date
                        }
                    })
                }).then(res => {
                    if (res.ok) {
                        console.log('✅ Pusher notification sent successfully');
                    } else {
                        console.warn('⚠️ Pusher notification failed:', res.statusText);
                    }
                }).catch(err => console.error('❌ Pusher notification error:', err))
            );

            // 2. Send email notification if enabled
            if (formData.email_notifications) {
                notificationPromises.push(
                    fetch('/api/notifications/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userId,
                            type: 'bill_reminder',
                            data: {
                                billName: formData.name,
                                subscriptionName: formData.name,
                                amount: amountNum,
                                dueDate: formData.next_due_date
                            }
                        })
                    }).then(res => {
                        if (res.ok) {
                            console.log('✅ Email notification sent successfully');
                        } else {
                            console.warn('⚠️ Email notification failed:', res.statusText);
                        }
                    }).catch(err => console.error('❌ Email notification error:', err))
                );
            }

            // Execute all notifications in parallel without waiting
            Promise.all(notificationPromises).then(() => {
                console.log('✅ All notifications processed');
            });

            console.log("DIALOG (Subscription): Async operations likely complete.");
            
            // Prepare calendar data before closing dialog
            const calendarData = {
                name: formData.name,
                amount: amountNum,
                dueDate: nextDueDate,
                billingCycle: formData.billing_cycle
            };
            const shouldAddToCalendar = formData.add_to_calendar && formData.next_due_date;
            
            // Actions on success
            ensureHideLoading();
            setIsSubmitting(false);
            setOpen(false);
            setFormData({ name: "", amount: "", billing_cycle: "monthly", next_due_date: "", add_to_calendar: false, email_notifications: true, logo_url: "" });
            setLogoSuggestions([]);
            setSelectedLogo("");
            toast({ title: "Subscription Added!", description: `Subscription "${formData.name}" has been recorded.` });
            
            // Dispatch event for AI Insights refresh
            window.dispatchEvent(
                new CustomEvent("subscription-added", {
                    detail: { 
                        name: formData.name,
                        amount: amountNum,
                        type: "subscription-added" 
                    },
                }),
            );
            
            router.refresh();
            console.log("DIALOG (Subscription): Dialog closed, form reset, router refreshed.");
            
            // Open calendar in new tab after dialog closes
            if (shouldAddToCalendar) {
                const calendarUrl = createSubscriptionCalendarUrl(
                    calendarData.name,
                    calendarData.amount,
                    calendarData.dueDate,
                    calendarData.billingCycle
                );
                openCalendarInNewTab(calendarUrl);
            }

        } catch (error) {
            console.error("Error creating subscription in catch block:", error);
            console.error("Error creating subscription - Full details:", JSON.stringify(error, null, 2));
            console.error("Error type:", typeof error);
            console.error("Error constructor:", error?.constructor?.name);
            ensureHideLoading();
            setIsSubmitting(false);
            // Show specific error if it's not one of the validation ones
            if (!(error instanceof Error && (error.message.includes("Invalid amount") || error.message.includes("Invalid Next Due Date")))) {
               const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : 
                                   error instanceof Error ? error.message : 
                                   "An unknown error occurred.";
               toast({ title: "Error Adding Subscription", description: errorMessage, variant: "destructive" });
            }
        } finally {
             ensureHideLoading(); // Final safety check
             if (isSubmitting) setIsSubmitting(false);
             console.log("%cDIALOG (Subscription): --- handleSubmit END (Finally) ---", "color: green; font-weight: bold;");
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isSubmitting) setOpen(isOpen); }}>
            <DialogTrigger asChild>
                {trigger ? React.cloneElement(trigger as React.ReactElement, { ref }) : (
                    <Button ref={ref} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Subscription
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if(isSubmitting) e.preventDefault(); }} onEscapeKeyDown={(e) => { if(isSubmitting) e.preventDefault(); }}>
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-emerald-600" /> Add New Subscription
                    </DialogTitle>
                    <DialogDescription>Enter the details of your recurring subscription or bill.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="sub-name">Service Name</Label>
                        <Input 
                            id="sub-name" 
                            placeholder="e.g., Netflix, Spotify, Internet Bill" 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            required 
                            disabled={isSubmitting} 
                        />
                        
                        {/* Logo Suggestions */}
                        {(logoSuggestions.length > 0 || isSearchingLogos) && (
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                                <Label className="text-sm font-medium flex items-center">
                                    <Image className="w-4 h-4 mr-1" />
                                    Service Logo
                                    {isSearchingLogos && <Search className="w-3 h-3 ml-1 animate-spin" />}
                                </Label>
                                
                                {isSearchingLogos ? (
                                    <p className="text-xs text-gray-500 mt-1">Searching for logos...</p>
                                ) : logoSuggestions.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            {logoSuggestions.slice(0, 6).map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => handleLogoSelect(suggestion)}
                                                    disabled={isSubmitting}
                                                    className={`p-2 border rounded-md hover:border-emerald-500 transition-colors ${
                                                        selectedLogo === suggestion.logo 
                                                            ? 'border-emerald-500 bg-emerald-50' 
                                                            : 'border-gray-200 bg-white'
                                                    }`}
                                                >
                                                    <img 
                                                        src={suggestion.logo} 
                                                        alt={`${suggestion.domain} logo`}
                                                        className="w-8 h-8 mx-auto object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                        }}
                                                    />
                                                    <p className="text-xs text-gray-600 mt-1 truncate">
                                                        {suggestion.domain}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                        {selectedLogo && (
                                            <div className="flex items-center space-x-2 text-xs text-emerald-600">
                                                <Image className="w-3 h-3" />
                                                <span>Logo selected!</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">No logos found for this service</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div><Label htmlFor="sub-amount">Amount (₹)</Label><Input id="sub-amount" type="number" step="0.01" min="0.01" placeholder="199" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required disabled={isSubmitting} /></div>
                    <div><Label htmlFor="sub-billing_cycle">Billing Cycle</Label><Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })} disabled={isSubmitting}><SelectTrigger id="sub-billing_cycle"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="sub-next_due_date">Next Due Date</Label><Input id="sub-next_due_date" type="date" value={formData.next_due_date} onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })} required disabled={isSubmitting} /></div>
                    <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center space-x-2"><Checkbox id="sub-add_to_calendar" checked={formData.add_to_calendar} onCheckedChange={(checked) => setFormData({ ...formData, add_to_calendar: checked as boolean })} disabled={isSubmitting} /><Label htmlFor="sub-add_to_calendar" className={`flex items-center text-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}><CalendarPlus className="w-4 h-4 mr-1 text-emerald-600" /> Add to Google Calendar</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox id="sub-email_notifications" checked={formData.email_notifications} onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked as boolean })} disabled={isSubmitting} /><Label htmlFor="sub-email_notifications" className={`flex items-center text-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}><Bell className="w-4 h-4 mr-1 text-blue-600" /> Email reminders via SendPulse</Label></div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmitting} loadingText="Adding...">Add Subscription</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
  }
);
SubscriptionCreationDialog.displayName = "SubscriptionCreationDialog";
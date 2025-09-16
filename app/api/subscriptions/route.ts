import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { updateRecurringSubscriptionReminder, deleteCalendarEvent } from "@/lib/google-calendar"

export async function PUT(request: NextRequest) {
  try {
    const { subscriptionId, ...subscriptionData } = await request.json()

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current subscription with calendar event ID
    const { data: currentSubscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !currentSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Update subscription in database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("id", subscriptionId)
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    // Update calendar event if it exists and subscription details changed
    if (currentSubscription.calendar_event_id && 
        (subscriptionData.name || subscriptionData.amount || subscriptionData.billing_cycle || subscriptionData.next_due_date)) {
      
      // Get user's calendar ID
      const { data: profile } = await supabase.from("profiles").select("google_calendar_id").eq("id", user.id).single()
      const calendarId = profile?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || "primary"

      const success = await updateRecurringSubscriptionReminder(
        calendarId,
        currentSubscription.calendar_event_id,
        subscriptionData.name || currentSubscription.name,
        subscriptionData.amount || currentSubscription.amount,
        subscriptionData.billing_cycle || currentSubscription.billing_cycle,
        new Date(subscriptionData.next_due_date || currentSubscription.next_due_date),
        `${(subscriptionData.billing_cycle || currentSubscription.billing_cycle).charAt(0).toUpperCase() + (subscriptionData.billing_cycle || currentSubscription.billing_cycle).slice(1)} subscription - ${subscriptionData.name || currentSubscription.name}`
      )

      if (!success) {
        console.error("Failed to update calendar event, but subscription was updated successfully")
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("id")

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 })
    }

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subscription with calendar event ID before deletion
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("calendar_event_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Delete calendar event if it exists
    if (subscription.calendar_event_id) {
      const { data: profile } = await supabase.from("profiles").select("google_calendar_id").eq("id", user.id).single()
      const calendarId = profile?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || "primary"

      const success = await deleteCalendarEvent(calendarId, subscription.calendar_event_id)
      if (!success) {
        console.error("Failed to delete calendar event, but will proceed with subscription deletion")
      }
    }

    // Delete subscription from database
    const { error: deleteError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", subscriptionId)
      .eq("user_id", user.id)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
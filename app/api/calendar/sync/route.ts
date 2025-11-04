import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createBillReminderEvent, createGoalMilestoneEvent } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    // Check if Google Calendar is properly configured
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
      console.warn('Google Calendar not configured - skipping calendar sync');
      return NextResponse.json({ 
        success: false, 
        error: "Calendar sync is not configured",
        message: "Google Calendar credentials are missing"
      }, { status: 200 }); // Return 200 to avoid breaking the flow
    }

    const { type, data } = await request.json()

    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get user's calendar settings
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the logged-in user's email as their calendar ID
    // This syncs events to their personal Google Calendar
    const calendarId = user.email || "primary"
    
    console.log(`📅 Syncing calendar event for user: ${user.email} (Calendar ID: ${calendarId})`)

    let eventId: string | null = null

    switch (type) {
      case "bill_reminder":
        eventId = await createBillReminderEvent(
          calendarId,
          data.name,
          new Date(data.dueDate),
          data.amount,
          data.description,
        )
        break

      case "goal_milestone":
        eventId = await createGoalMilestoneEvent(
          calendarId,
          data.name,
          new Date(data.targetDate),
          data.targetAmount,
          data.currentAmount,
        )
        break

      default:
        return NextResponse.json({ error: "Invalid sync type" }, { status: 400 })
    }

    if (eventId) {
      return NextResponse.json({ success: true, eventId })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create calendar event",
        message: "Calendar event creation returned null"
      }, { status: 200 }) // Return 200 to avoid breaking the flow
    }
  } catch (error) {
    console.error("Calendar sync error:", error)
    
    // Return a soft error (200 status) so it doesn't break the user flow
    return NextResponse.json({ 
      success: false,
      error: "Calendar sync failed",
      message: error instanceof Error ? error.message : "Unknown error",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 200 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createBillReminderEvent, createGoalMilestoneEvent } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    // Initialize Supabase client
    const cookieStore = cookies()
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

    // Get user's calendar ID from profile or use default
    const { data: profile } = await supabase.from("profiles").select("google_calendar_id").eq("id", user.id).single()

    const calendarId = profile?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || "primary"

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
      return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
    }
  } catch (error) {
    console.error("Calendar sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

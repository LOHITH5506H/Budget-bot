import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has Google OAuth token
    if (!session.provider_token) {
      return NextResponse.json({ error: 'No Google access token found' }, { status: 401 })
    }

    const { subscription } = await request.json()

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.provider_token })
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Create calendar event
    const startDate = new Date(subscription.next_due_date)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour

    // Determine recurrence pattern
    let recurrence: string[] = []
    switch (subscription.billing_cycle) {
      case 'monthly':
        recurrence = ['RRULE:FREQ=MONTHLY;COUNT=24']
        break
      case 'yearly':
        recurrence = ['RRULE:FREQ=YEARLY;COUNT=5']
        break
      case 'weekly':
        recurrence = ['RRULE:FREQ=WEEKLY;COUNT=52']
        break
      case 'quarterly':
        recurrence = ['RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=20']
        break
    }

    const event = {
      summary: `💰 ${subscription.name} - ₹${subscription.amount}`,
      description: `Billing reminder for ${subscription.name}\nAmount: ₹${subscription.amount}\nBilling cycle: ${subscription.billing_cycle}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      recurrence,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    }

    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })

    return NextResponse.json({
      success: true,
      eventId: result.data.id,
      message: 'Calendar event created successfully'
    })

  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with calendar' },
      { status: 500 }
    )
  }
}
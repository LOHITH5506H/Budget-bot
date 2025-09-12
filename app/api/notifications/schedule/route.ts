import { type NextRequest, NextResponse } from "next/server"
import { notificationScheduler } from "@/lib/notification-scheduler"

// This endpoint can be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (e.g., Vercel Cron)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await notificationScheduler.runScheduledNotifications()

    return NextResponse.json({
      success: true,
      message: "Scheduled notifications processed",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Scheduled notification error:", error)
    return NextResponse.json(
      {
        error: "Failed to process scheduled notifications",
      },
      { status: 500 },
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "notification-scheduler",
    timestamp: new Date().toISOString(),
  })
}

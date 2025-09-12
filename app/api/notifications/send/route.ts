import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSendPulseClient, emailTemplates } from "@/lib/sendpulse"

export async function POST(request: NextRequest) {
  try {
    const { type, data, recipients } = await request.json()

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sendPulse = getSendPulseClient()
    let success = false

    switch (type) {
      case "bill_reminder":
        const billTemplate = emailTemplates.billReminder(
          data.billName,
          data.amount,
          new Date(data.dueDate).toLocaleDateString(),
        )
        success = await sendPulse.sendEmail({
          to: recipients.email || [user.email!],
          subject: billTemplate.subject,
          html: billTemplate.html,
        })
        break

      case "goal_milestone":
        const progress = Math.round((data.currentAmount / data.targetAmount) * 100)
        const goalTemplate = emailTemplates.goalMilestone(data.goalName, progress, data.targetAmount)
        success = await sendPulse.sendEmail({
          to: recipients.email || [user.email!],
          subject: goalTemplate.subject,
          html: goalTemplate.html,
        })
        break

      case "spending_alert":
        const alertTemplate = emailTemplates.spendingAlert(data.amount, data.category, data.monthlyLimit)
        success = await sendPulse.sendEmail({
          to: recipients.email || [user.email!],
          subject: alertTemplate.subject,
          html: alertTemplate.html,
        })
        break

      case "sms":
        if (recipients.phone) {
          success = await sendPulse.sendSMS({
            phones: Array.isArray(recipients.phone) ? recipients.phone : [recipients.phone],
            body: data.message,
          })
        }
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
    }
  } catch (error) {
    console.error("Notification send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

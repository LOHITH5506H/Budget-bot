import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendEmail, sendSMS, emailTemplates } from "@/lib/sendpulse"

const config = {
  userId: process.env.SENDPULSE_USER_ID!,
  secret: process.env.SENDPULSE_SECRET!,
}

export async function POST(request: NextRequest) {
  try {
    const { type, data, recipients } = await request.json()

    console.log("Notification send request:", { type, data, recipients })

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user from the request
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError)
      return NextResponse.json(
        { error: "Authentication failed", details: userError.message },
        { status: 401 }
      )
    }

    if (!user) {
      console.error("No user found in session")
      return NextResponse.json(
        { error: "Unauthorized - no user session" },
        { status: 401 }
      )
    }

    console.log("Authenticated user:", user.email)

    let success = false

    switch (type) {
      case "bill_reminder": {
        const billTemplate = emailTemplates.billReminder(
          data.billName,
          data.amount,
          new Date(data.dueDate).toLocaleDateString()
        )

        console.log("Sending bill reminder email...")
        success = await sendEmail(config, {
          to: recipients.email?.length ? recipients.email : [user.email!],
          subject: billTemplate.subject,
          html: billTemplate.html,
        })
        break
      }

      case "goal_milestone": {
        const progress = Math.round(
          (data.currentAmount / data.targetAmount) * 100
        )
        const goalTemplate = emailTemplates.goalMilestone(
          data.goalName,
          progress,
          data.targetAmount
        )
        success = await sendEmail(config, {
          to: recipients.email || [user.email!],
          subject: goalTemplate.subject,
          html: goalTemplate.html,
        })
        break
      }

      case "spending_alert": {
        const alertTemplate = emailTemplates.spendingAlert(
          data.amount,
          data.category,
          data.monthlyLimit
        )
        success = await sendEmail(config, {
          to: recipients.email || [user.email!],
          subject: alertTemplate.subject,
          html: alertTemplate.html,
        })
        break
      }

      case "sms": {
        if (recipients.phone) {
          success = await sendSMS(config, {
            phones: Array.isArray(recipients.phone)
              ? recipients.phone
              : [recipients.phone],
            body: data.message,
          })
        }
        break
      }

      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 }
        )
    }

    if (success) {
      console.log("Notification sent successfully")
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error("Failed to send notification")
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Notification send error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

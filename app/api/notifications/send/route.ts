import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSendPulseClient, emailTemplates } from "@/lib/sendpulse"
import { pusherService, NotificationData } from "@/lib/pusher-service"

export async function POST(request: NextRequest) {
  try {
    const { type, data, recipients, userId, title, message } = await request.json()

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get user info (either from auth or userId parameter)
    let user: any = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .eq('id', userId)
        .single();
      user = profile;
    } else {
      const { data: authData } = await supabase.auth.getUser()
      user = authData.user;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const sendPulse = getSendPulseClient()
    let emailSuccess = false
    let pushSuccess = false

    // Send real-time push notification via Pusher
    if (title && message) {
      const notification: NotificationData = {
        id: `notif-${Date.now()}`,
        type: type as NotificationData['type'],
        title,
        message,
        timestamp: new Date().toISOString(),
        data,
        read: false,
      };

      pushSuccess = await pusherService.sendNotificationToUser(user.id, notification);
    }

    // Send email notification if recipients specified or for specific types
    if (recipients?.email || ['bill_reminder', 'goal_milestone', 'spending_alert', 'report_ready'].includes(type)) {
      switch (type) {
        case "bill_reminder":
          const billTemplate = emailTemplates.billReminder(
            data.billName || data.subscriptionName,
            data.amount,
            new Date(data.dueDate).toLocaleDateString(),
          )
          emailSuccess = await sendPulse.sendEmail({
            to: recipients?.email || [user.email],
            subject: billTemplate.subject,
            html: billTemplate.html,
          })
          break

        case "goal_milestone":
          const progress = Math.round((data.currentAmount / data.targetAmount) * 100)
          const goalTemplate = emailTemplates.goalMilestone(data.goalName, progress, data.targetAmount)
          emailSuccess = await sendPulse.sendEmail({
            to: recipients?.email || [user.email],
            subject: goalTemplate.subject,
            html: goalTemplate.html,
          })
          break

        case "spending_alert":
          const alertTemplate = emailTemplates.spendingAlert(data.amount, data.category, data.monthlyLimit)
          emailSuccess = await sendPulse.sendEmail({
            to: recipients?.email || [user.email],
            subject: alertTemplate.subject,
            html: alertTemplate.html,
          })
          break

        case "report_ready":
          emailSuccess = await sendPulse.sendEmail({
            to: recipients?.email || [user.email],
            subject: data.subject || 'Your Report is Ready',
            html: data.html || message,
            attachments: data.attachments,
          })
          break

        case "sms":
          if (recipients?.phone) {
            emailSuccess = await sendPulse.sendSMS({
              phones: Array.isArray(recipients.phone) ? recipients.phone : [recipients.phone],
              body: data.message || message,
            })
          }
          break

        case "email":
          // Direct email sending
          emailSuccess = await sendPulse.sendEmail({
            to: recipients?.to || [user.email],
            subject: data.subject || title,
            html: data.html || message,
            attachments: data.attachments,
          })
          break
      }
    }

    // Return success if either push or email succeeded
    const overallSuccess = pushSuccess || emailSuccess;
    
    if (overallSuccess) {
      return NextResponse.json({ 
        success: true, 
        pushNotification: pushSuccess,
        emailNotification: emailSuccess 
      })
    } else {
      return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
    }
  } catch (error) {
    console.error("Notification send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

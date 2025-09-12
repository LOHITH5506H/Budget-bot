// Automated notification scheduler for BudgetBot
import { createServerClient } from "@supabase/ssr"
import { getSendPulseClient, emailTemplates } from "./sendpulse"

interface ScheduledNotification {
  id: string
  user_id: string
  type: "bill_reminder" | "goal_milestone" | "spending_alert"
  scheduled_for: Date
  data: any
  sent: boolean
}

export class NotificationScheduler {
  private supabase: any

  constructor() {
    this.supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get() {
          return undefined
        },
      },
    })
  }

  // Schedule bill reminder notifications
  async scheduleBillReminders() {
    try {
      // Get all active subscriptions with due dates in the next 3 days
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const { data: subscriptions, error } = await this.supabase
        .from("subscriptions")
        .select(`
          *,
          profiles!inner(email, notification_preferences)
        `)
        .eq("is_active", true)
        .lte("next_due_date", threeDaysFromNow.toISOString())

      if (error) throw error

      const sendPulse = getSendPulseClient()

      for (const subscription of subscriptions) {
        const user = subscription.profiles

        // Check if user has bill reminders enabled
        const preferences = user.notification_preferences || {}
        if (!preferences.bill_reminders_enabled) continue

        // Check if we haven't already sent a reminder for this bill
        const { data: existingReminder } = await this.supabase
          .from("sent_notifications")
          .select("id")
          .eq("user_id", subscription.user_id)
          .eq("subscription_id", subscription.id)
          .eq("type", "bill_reminder")
          .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

        if (existingReminder && existingReminder.length > 0) continue

        // Send email notification
        if (preferences.email_notifications) {
          const template = emailTemplates.billReminder(
            subscription.name,
            subscription.amount,
            new Date(subscription.next_due_date).toLocaleDateString(),
          )

          const emailSent = await sendPulse.sendEmail({
            to: [user.email],
            subject: template.subject,
            html: template.html,
          })

          if (emailSent) {
            // Log the sent notification
            await this.supabase.from("sent_notifications").insert({
              user_id: subscription.user_id,
              subscription_id: subscription.id,
              type: "bill_reminder",
              sent_at: new Date().toISOString(),
              channel: "email",
            })
          }
        }

        // Send SMS if enabled
        if (preferences.sms_notifications && user.phone) {
          const smsMessage = `💰 BudgetBot Reminder: Your ${subscription.name} bill ($${subscription.amount}) is due on ${new Date(subscription.next_due_date).toLocaleDateString()}`

          const smsSent = await sendPulse.sendSMS({
            phones: [user.phone],
            body: smsMessage,
          })

          if (smsSent) {
            await this.supabase.from("sent_notifications").insert({
              user_id: subscription.user_id,
              subscription_id: subscription.id,
              type: "bill_reminder",
              sent_at: new Date().toISOString(),
              channel: "sms",
            })
          }
        }
      }

      console.log(`Processed ${subscriptions.length} subscription reminders`)
    } catch (error) {
      console.error("Error scheduling bill reminders:", error)
    }
  }

  // Check for goal milestones and send notifications
  async checkGoalMilestones() {
    try {
      const { data: goals, error } = await this.supabase
        .from("savings_goals")
        .select(`
          *,
          profiles!inner(email, notification_preferences)
        `)
        .eq("is_active", true)

      if (error) throw error

      const sendPulse = getSendPulseClient()

      for (const goal of goals) {
        const user = goal.profiles
        const progress = Math.round((goal.current_amount / goal.target_amount) * 100)

        // Check for milestone achievements (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100]

        for (const milestone of milestones) {
          if (progress >= milestone) {
            // Check if we've already sent this milestone notification
            const { data: existingMilestone } = await this.supabase
              .from("sent_notifications")
              .select("id")
              .eq("user_id", goal.user_id)
              .eq("goal_id", goal.id)
              .eq("type", "goal_milestone")
              .eq("milestone", milestone)

            if (existingMilestone && existingMilestone.length > 0) continue

            // Send milestone notification
            const preferences = user.notification_preferences || {}

            if (preferences.goal_notifications && preferences.email_notifications) {
              const template = emailTemplates.goalMilestone(goal.name, progress, goal.target_amount)

              const emailSent = await sendPulse.sendEmail({
                to: [user.email],
                subject: template.subject,
                html: template.html,
              })

              if (emailSent) {
                await this.supabase.from("sent_notifications").insert({
                  user_id: goal.user_id,
                  goal_id: goal.id,
                  type: "goal_milestone",
                  milestone: milestone,
                  sent_at: new Date().toISOString(),
                  channel: "email",
                })
              }
            }
          }
        }
      }

      console.log(`Processed ${goals.length} goal milestones`)
    } catch (error) {
      console.error("Error checking goal milestones:", error)
    }
  }

  // Check for spending alerts
  async checkSpendingAlerts() {
    try {
      // Get monthly spending by category for all users
      const currentMonth = new Date()
      currentMonth.setDate(1) // First day of current month

      const { data: monthlySpending, error } = await this.supabase
        .from("expenses")
        .select(`
          user_id,
          category,
          amount,
          profiles!inner(email, notification_preferences, monthly_budget)
        `)
        .gte("date", currentMonth.toISOString())

      if (error) throw error

      // Group spending by user and category
      const spendingByUser = monthlySpending.reduce((acc: any, expense: any) => {
        const key = `${expense.user_id}-${expense.category}`
        if (!acc[key]) {
          acc[key] = {
            user_id: expense.user_id,
            category: expense.category,
            total: 0,
            user: expense.profiles,
          }
        }
        acc[key].total += expense.amount
        return acc
      }, {})

      const sendPulse = getSendPulseClient()

      for (const spending of Object.values(spendingByUser) as any[]) {
        const user = spending.user
        const monthlyBudget = user.monthly_budget || {}
        const categoryLimit = monthlyBudget[spending.category]

        if (!categoryLimit) continue

        const spendingPercentage = (spending.total / categoryLimit) * 100

        // Send alert if spending is over 80% of budget
        if (spendingPercentage >= 80) {
          // Check if we've already sent an alert this month
          const { data: existingAlert } = await this.supabase
            .from("sent_notifications")
            .select("id")
            .eq("user_id", spending.user_id)
            .eq("type", "spending_alert")
            .eq("category", spending.category)
            .gte("sent_at", currentMonth.toISOString())

          if (existingAlert && existingAlert.length > 0) continue

          const preferences = user.notification_preferences || {}

          if (preferences.spending_alerts && preferences.email_notifications) {
            const template = emailTemplates.spendingAlert(spending.total, spending.category, categoryLimit)

            const emailSent = await sendPulse.sendEmail({
              to: [user.email],
              subject: template.subject,
              html: template.html,
            })

            if (emailSent) {
              await this.supabase.from("sent_notifications").insert({
                user_id: spending.user_id,
                type: "spending_alert",
                category: spending.category,
                sent_at: new Date().toISOString(),
                channel: "email",
              })
            }
          }
        }
      }

      console.log(`Processed spending alerts for ${Object.keys(spendingByUser).length} categories`)
    } catch (error) {
      console.error("Error checking spending alerts:", error)
    }
  }

  // Run all scheduled notifications
  async runScheduledNotifications() {
    console.log("Running scheduled notifications...")

    await Promise.all([this.scheduleBillReminders(), this.checkGoalMilestones(), this.checkSpendingAlerts()])

    console.log("Scheduled notifications completed")
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler()

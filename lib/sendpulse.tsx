// SendPulse API configuration and utilities
export interface SendPulseConfig {
  userId: string
  secret: string
  tokenStorage?: string
}

export interface EmailNotification {
  to: string[]
  subject: string
  html: string
  text?: string
  from?: {
    name: string
    email: string
  }
  attachments?: Array<{
    filename: string
    content: string
    encoding?: string
    type?: string
  }>
}

export interface SMSNotification {
  phones: string[]
  body: string
  from?: string
}

// SendPulse client wrapper
export class SendPulseClient {
  private config: SendPulseConfig
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor(config: SendPulseConfig) {
    this.config = config
  }

  // Get access token for API requests
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await fetch("https://api.sendpulse.com/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: this.config.userId,
          client_secret: this.config.secret,
        }),
      })

      const data = await response.json()

      if (data.access_token) {
        this.accessToken = data.access_token
        this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 minute early
        return this.accessToken as string
      }

      throw new Error("Failed to get access token")
    } catch (error) {
      console.error("SendPulse authentication error:", error)
      throw error
    }
  }

  // Send transactional email
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch("https://api.sendpulse.com/smtp/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: {
            subject: notification.subject,
            from: notification.from || {
              name: "BudgetBot",
              email: "noreply@budgetbot.app",
            },
            to: notification.to.map((email) => ({ email })),
            html: notification.html,
            text: notification.text || notification.html.replace(/<[^>]*>/g, ""),
          },
        }),
      })

      const result = await response.json()
      return response.ok && result.result
    } catch (error) {
      console.error("SendPulse email error:", error)
      return false
    }
  }

  // Send SMS notification
  async sendSMS(notification: SMSNotification): Promise<boolean> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch("https://api.sendpulse.com/sms/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phones: notification.phones,
          body: notification.body,
          from: notification.from || "BudgetBot",
        }),
      })

      const result = await response.json()
      return response.ok && result.result
    } catch (error) {
      console.error("SendPulse SMS error:", error)
      return false
    }
  }
}

// Initialize SendPulse client
export function getSendPulseClient(): SendPulseClient {
  const config: SendPulseConfig = {
    userId: process.env.SENDPULSE_USER_ID!,
    secret: process.env.SENDPULSE_SECRET!,
  }

  return new SendPulseClient(config)
}

// Predefined email templates for budget notifications
export const emailTemplates = {
  billReminder: (billName: string, amount: number, dueDate: string) => ({
    subject: `💰 Bill Reminder: ${billName} Due Soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">💰 BudgetBot Reminder</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #374151;">Bill Due Soon</h2>
          <p style="color: #6b7280; font-size: 16px;">Don't forget about your upcoming bill:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0; color: #111827;">${billName}</h3>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Amount:</strong> $${amount}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          <p style="color: #6b7280; margin-top: 20px;">Stay on top of your finances with BudgetBot!</p>
        </div>
      </div>
    `,
  }),

  goalMilestone: (goalName: string, progress: number, targetAmount: number) => ({
    subject: `🎯 Goal Update: ${goalName} - ${progress}% Complete`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎯 BudgetBot Goal Update</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #374151;">Great Progress!</h2>
          <p style="color: #6b7280; font-size: 16px;">You're making excellent progress on your savings goal:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 10px 0; color: #111827;">${goalName}</h3>
            <div style="background: #e5e7eb; border-radius: 10px; height: 20px; margin: 10px 0;">
              <div style="background: #3b82f6; height: 20px; border-radius: 10px; width: ${progress}%;"></div>
            </div>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Progress:</strong> ${progress}% complete</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Target:</strong> $${targetAmount}</p>
          </div>
          <p style="color: #6b7280; margin-top: 20px;">Keep up the great work! You're on track to reach your goal.</p>
        </div>
      </div>
    `,
  }),

  spendingAlert: (amount: number, category: string, monthlyLimit: number) => ({
    subject: `⚠️ Spending Alert: ${category} Budget Warning`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ BudgetBot Alert</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #374151;">Spending Alert</h2>
          <p style="color: #6b7280; font-size: 16px;">You're approaching your budget limit for this category:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #111827;">${category}</h3>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Current Spending:</strong> $${amount}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Monthly Limit:</strong> $${monthlyLimit}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Remaining:</strong> $${monthlyLimit - amount}</p>
          </div>
          <p style="color: #6b7280; margin-top: 20px;">Consider reviewing your spending to stay within budget.</p>
        </div>
      </div>
    `,
  }),
}

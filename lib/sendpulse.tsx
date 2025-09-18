// SendPulse API configuration and utilities using official sendpulse-api package
const sendpulse = require("sendpulse-api")

// --- Config ---
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
}

export interface SMSNotification {
  phones: string[]
  body: string
  from?: string
}

let initialized = false

// --- Initialize SendPulse ---
async function initialize(config: SendPulseConfig): Promise<boolean> {
  if (initialized) return true

  return new Promise((resolve) => {
    sendpulse.init(
      config.userId,
      config.secret,
      config.tokenStorage || "/tmp/",
      (token: any) => {
        // Case 1: Object with access_token
        if (token && typeof token === "object" && token.access_token) {
          console.log("✅ SendPulse initialized (object token)")
          initialized = true
          resolve(true)

        // Case 2: Plain JWT string
        } else if (token && typeof token === "string") {
          console.log("✅ SendPulse initialized (raw JWT)")
          initialized = true
          resolve(true)

        } else {
          console.error("❌ SendPulse initialization failed:", token)
          resolve(false)
        }
      }
    )
  })
}

// --- Send Email ---
export async function sendEmail(config: SendPulseConfig, notification: EmailNotification): Promise<boolean> {
  try {
    console.log(`📧 Sending email to: ${notification.to.join(", ")}`)
    console.log(config);
    const ok = await initialize(config)
    if (!ok) return logEmailNotification(notification)

    const emailData = {
      html: notification.html,
      text: notification.text || notification.html.replace(/<[^>]*>/g, ""),
      subject: notification.subject,
      from: notification.from || {
        name: process.env.SENDPULSE_FROM_NAME || "BudgetBot",
        email: process.env.SENDPULSE_FROM_EMAIL || "raghav@gamicgo.xyz"
      },
      to: notification.to.map(email => ({ email }))
    }

    console.log(`📧 Using sender: ${emailData.from.email}`)

    return new Promise((resolve) => {
      sendpulse.smtpSendMail((data: any) => {
        if (data?.result) {
          console.log("✅ Email sent successfully!", data)
          resolve(true)
        } else {
          console.error("❌ Email failed:", data)
          
          // Check for specific error codes
          if (data?.error_code === 422) {
            console.error("🚫 Sender email not verified in SendPulse account!")
            console.error("💡 Please verify the sender email in SendPulse dashboard")
          }
          
          logEmailNotification(notification)
          resolve(true) // Return true to prevent app breaking, but email is logged
        }
      }, emailData)
    })
  } catch (err) {
    console.error("❌ Email error:", err)
    return logEmailNotification(notification)
  }
}

// --- Send SMS ---
export async function sendSMS(config: SendPulseConfig, notification: SMSNotification): Promise<boolean> {
  try {
    const ok = await initialize(config)
    if (!ok) return false

    const smsData = {
      phones: notification.phones,
      body: notification.body,
      from: notification.from || "BudgetBot"
    }

    return new Promise((resolve) => {
      sendpulse.smsSend((data: any) => {
        if (data?.result) {
          console.log("✅ SMS sent successfully!")
          resolve(true)
        } else {
          console.error("❌ SMS failed:", data)
          resolve(false)
        }
      }, smsData)
    })
  } catch (err) {
    console.error("❌ SMS error:", err)
    return false
  }
}

// --- Fallback logger ---
function logEmailNotification(notification: EmailNotification): boolean {
  console.log("=".repeat(40))
  console.log("📧 EMAIL LOG (SendPulse failed)")
  console.log(`To: ${notification.to.join(", ")}`)
  console.log(`Subject: ${notification.subject}`)
  console.log(`Content: ${notification.html.substring(0, 200)}...`)
  console.log("=".repeat(40))
  return true
}

// --- Predefined Templates ---
export const emailTemplates = {
  billReminder: (billName: string, amount: number, dueDate: string) => ({
    subject: `💰 Bill Reminder: ${billName} Due Soon`,
    html: `<h2>Bill Reminder</h2><p>${billName} - $${amount}, due on ${dueDate}</p>`
  }),
  goalMilestone: (goal: string, progress: number, target: number) => ({
    subject: `🎯 Goal Update: ${goal} - ${progress}% Complete`,
    html: `<h2>${goal}</h2><p>Progress: ${progress}% of $${target}</p>`
  }),
  spendingAlert: (amount: number, category: string, limit: number) => ({
    subject: `⚠️ Spending Alert: ${category}`,
    html: `<h2>${category} Alert</h2><p>Spent: $${amount} / Limit: $${limit}</p>`
  })
}

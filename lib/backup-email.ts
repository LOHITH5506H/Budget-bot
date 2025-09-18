// Backup email service using Nodemailer and Gmail SMTP
import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string[]
  subject: string
  html: string
  text?: string
}

class BackupEmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    try {
      // For development/testing, you can use Gmail SMTP
      // In production, use a proper email service
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER, // Your Gmail address
          pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
        },
      })
    } catch (error) {
      console.error('Failed to initialize backup email service:', error)
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Backup email service not initialized')
      return false
    }

    try {
      console.log('Sending email via backup service (Gmail SMTP)...')
      
      const mailOptions = {
        from: {
          name: 'BudgetBot',
          address: process.env.GMAIL_USER || 'noreply@budgetbot.app'
        },
        to: options.to.join(', '),
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Backup email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Backup email service error:', error)
      return false
    }
  }
}

export const backupEmailService = new BackupEmailService()
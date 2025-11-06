// Gmail SMTP Fallback for email sending
import nodemailer from 'nodemailer';

export interface GmailConfig {
  user: string;
  password: string; // App-specific password
}

export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from?: {
    name: string;
    email: string;
  };
}

export class GmailSMTPClient {
  private transporter: nodemailer.Transporter | null = null;
  private config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  // Initialize Gmail SMTP transporter
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Gmail SMTP connection verified');
      
      return this.transporter;
    } catch (error) {
      console.error('❌ Gmail SMTP connection failed:', error);
      throw new Error('Failed to connect to Gmail SMTP');
    }
  }

  // Send email via Gmail SMTP
  async sendEmail(notification: EmailMessage): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: notification.from 
          ? `"${notification.from.name}" <${notification.from.email || this.config.user}>`
          : `"BudgetBot" <${this.config.user}>`,
        to: notification.to.join(', '),
        subject: notification.subject,
        html: notification.html,
        text: notification.text || notification.html.replace(/<[^>]*>/g, ''),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Gmail email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Gmail SMTP send error:', error);
      return false;
    }
  }

  // Close connection
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}

// Initialize Gmail SMTP client
export function getGmailSMTPClient(): GmailSMTPClient | null {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn('⚠️ Gmail SMTP credentials not configured');
    return null;
  }

  return new GmailSMTPClient({
    user: gmailUser,
    password: gmailPassword,
  });
}

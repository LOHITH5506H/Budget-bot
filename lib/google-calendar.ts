import { google } from "googleapis"

// Helper function to decode and format private key
function getFormattedPrivateKey(): string | undefined {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!privateKey) {
    console.warn('⚠️ GOOGLE_PRIVATE_KEY environment variable is not set - Calendar sync disabled');
    return undefined;
  }

  try {
    // If the key is base64 encoded, decode it
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.log('📝 Decoding base64 encoded private key...');
      const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
      
      // Verify the decoded key looks valid
      if (!decoded.includes('BEGIN PRIVATE KEY') || !decoded.includes('END PRIVATE KEY')) {
        console.error('❌ Decoded private key appears invalid or corrupted');
        console.error('   Expected to find: -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----');
        console.error('   Calendar sync will be disabled. See GOOGLE_KEY_FIX.md for instructions.');
        return undefined;
      }
      
      console.log('✅ Private key decoded successfully');
      return decoded;
    }
    
    // If it's already in PEM format, just replace escaped newlines
    console.log('📝 Using PEM format private key');
    return privateKey.replace(/\\n/g, '\n');
  } catch (error) {
    console.error('❌ Error processing private key:', error);
    console.error('   Calendar sync will be disabled. See GOOGLE_KEY_FIX.md for instructions.');
    return undefined;
  }
}

// Google Calendar API configuration
export const googleCalendarConfig = {
  scopes: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"],
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: getFormattedPrivateKey(),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
}

// Initialize Google Calendar client
export function getGoogleCalendarClient() {
  // Validate configuration before creating client
  if (!googleCalendarConfig.credentials.private_key) {
    console.warn('⚠️ Google Calendar configuration incomplete: Missing or invalid private key');
    console.warn('   Calendar sync is disabled. See GOOGLE_KEY_FIX.md for setup instructions.');
    throw new Error('Google Calendar not configured: Invalid private key');
  }
  
  if (!googleCalendarConfig.credentials.client_email) {
    throw new Error('Google Calendar not configured: Missing client email');
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: googleCalendarConfig.credentials,
      scopes: googleCalendarConfig.scopes,
    })

    return google.calendar({ version: "v3", auth })
  } catch (error) {
    console.error('❌ Failed to initialize Google Calendar client:', error);
    throw error;
  }
}

// Calendar event types for budget tracking
export interface BudgetCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: "email" | "popup"
      minutes: number
    }>
  }
}

// Create calendar event for bill due date
export async function createBillReminderEvent(
  calendarId: string,
  billName: string,
  dueDate: Date,
  amount: number,
  description?: string,
): Promise<string | null> {
  try {
    console.log('=== Creating Bill Reminder Event ===');
    console.log('Calendar ID:', calendarId);
    console.log('Bill Name:', billName);
    console.log('Due Date:', dueDate);
    console.log('Amount:', amount);
    
    const calendar = getGoogleCalendarClient()

    const event: BudgetCalendarEvent = {
      summary: `💰 Bill Due: ${billName}`,
      description: `${description || ""}\nAmount: ₹${amount}\nDue Date: ${dueDate.toLocaleDateString()}`,
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: "Asia/Kolkata", // Changed to Indian timezone
      },
      end: {
        dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 60 }, // 1 hour before
        ],
      },
    }

    console.log('Event to be created:', JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })

    console.log('✅ Calendar event created successfully!');
    console.log('Event ID:', response.data.id);
    console.log('Event Link:', response.data.htmlLink);

    return response.data.id || null
  } catch (error: any) {
    console.error("❌ Error creating calendar event:", error)
    
    // Check if it's a permission error
    if (error.message === 'Not Found' || error.code === 404) {
      console.error('\n⚠️  CALENDAR ACCESS DENIED ⚠️');
      console.error(`   The service account does not have access to calendar: ${calendarId}`);
      console.error('\n📋 TO FIX THIS:');
      console.error('   1. Go to https://calendar.google.com/calendar/u/0/r/settings');
      console.error('   2. Click on your calendar in the left sidebar');
      console.error('   3. Scroll to "Share with specific people"');
      console.error('   4. Add: calender-sync-service@budgetbot-471917.iam.gserviceaccount.com');
      console.error('   5. Set permission: "Make changes to events"');
      console.error('   6. Click "Send"');
      console.error('\n📖 See USER_CALENDAR_SETUP.md for detailed instructions\n');
    } else if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return null
  }
}

// Create calendar event for savings goal milestone
export async function createGoalMilestoneEvent(
  calendarId: string,
  goalName: string,
  targetDate: Date,
  targetAmount: number,
  currentAmount: number,
): Promise<string | null> {
  try {
    console.log('=== Creating Goal Milestone Event ===');
    console.log('Calendar ID:', calendarId);
    console.log('Goal Name:', goalName);
    console.log('Target Date:', targetDate);
    
    const calendar = getGoogleCalendarClient()
    const progress = Math.round((currentAmount / targetAmount) * 100)

    const event: BudgetCalendarEvent = {
      summary: `🎯 Goal Milestone: ${goalName}`,
      description: `Target: ₹${targetAmount}\nCurrent: ₹${currentAmount}\nProgress: ${progress}%\nTarget Date: ${targetDate.toLocaleDateString()}`,
      start: {
        dateTime: targetDate.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: new Date(targetDate.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 7 * 24 * 60 }, // 1 week before
          { method: "popup", minutes: 24 * 60 }, // 1 day before
        ],
      },
    }

    console.log('Event to be created:', JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })

    console.log('✅ Calendar event created successfully!');
    console.log('Event ID:', response.data.id);
    console.log('Event Link:', response.data.htmlLink);

    return response.data.id || null
  } catch (error: any) {
    console.error("❌ Error creating goal milestone event:", error)
    
    // Check if it's a permission error
    if (error.message === 'Not Found' || error.code === 404) {
      console.error('\n⚠️  CALENDAR ACCESS DENIED ⚠️');
      console.error(`   The service account does not have access to calendar: ${calendarId}`);
      console.error('\n📋 TO FIX THIS:');
      console.error('   1. Go to https://calendar.google.com/calendar/u/0/r/settings');
      console.error('   2. Click on your calendar in the left sidebar');
      console.error('   3. Scroll to "Share with specific people"');
      console.error('   4. Add: calender-sync-service@budgetbot-471917.iam.gserviceaccount.com');
      console.error('   5. Set permission: "Make changes to events"');
      console.error('   6. Click "Send"');
      console.error('\n📖 See USER_CALENDAR_SETUP.md for detailed instructions\n');
    } else if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return null
  }
}

// Update existing calendar event
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  updates: Partial<BudgetCalendarEvent>,
): Promise<boolean> {
  try {
    const calendar = getGoogleCalendarClient()

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updates,
    })

    return true
  } catch (error) {
    console.error("Error updating calendar event:", error)
    return false
  }
}

// Delete calendar event
export async function deleteCalendarEvent(calendarId: string, eventId: string): Promise<boolean> {
  try {
    const calendar = getGoogleCalendarClient()

    await calendar.events.delete({
      calendarId,
      eventId,
    })

    return true
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return false
  }
}

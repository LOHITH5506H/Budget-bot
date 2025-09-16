// lib/google-calendar.ts

import { google } from "googleapis";

// Google Calendar API configuration
export const googleCalendarConfig = {
  scopes: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    // Handle escaped newlines in private key
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
};

// Initialize Google Calendar client
export function getGoogleCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: googleCalendarConfig.credentials,
    scopes: googleCalendarConfig.scopes,
  });

  return google.calendar({ version: "v3", auth });
}

// Calendar event types for budget tracking
export interface BudgetCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
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
    const calendar = getGoogleCalendarClient();

    const event: BudgetCalendarEvent = {
      summary: `💰 Bill Due: ${billName}`,
      description: `${description || ""}\nAmount: ₹${amount}\nDue Date: ${dueDate.toLocaleDateString()}`,
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: "Asia/Kolkata", // Indian timezone
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
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

// Create recurring calendar event for subscription/EMI reminders
export async function createRecurringSubscriptionReminder(
  calendarId: string,
  subscriptionName: string,
  amount: number,
  billingCycle: string,
  nextDueDate: Date,
  description?: string,
): Promise<string | null> {
  try {
    const calendar = getGoogleCalendarClient();

    // Calculate recurrence rule based on billing cycle
    let recurrenceRule = "";
    switch (billingCycle.toLowerCase()) {
      case "monthly":
        recurrenceRule = "RRULE:FREQ=MONTHLY";
        break;
      case "yearly":
        recurrenceRule = "RRULE:FREQ=YEARLY";
        break;
      case "weekly":
        recurrenceRule = "RRULE:FREQ=WEEKLY";
        break;
      default:
        recurrenceRule = "RRULE:FREQ=MONTHLY";
    }

    // Set reminder time to 9 AM on the due date
    const reminderDateTime = new Date(nextDueDate);
    reminderDateTime.setHours(9, 0, 0, 0);

    const event: BudgetCalendarEvent = {
      summary: `💳 ${subscriptionName} - Payment Due`,
      description: `${description || `${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} subscription payment`}\n\nAmount: ₹${amount}\nBilling Cycle: ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}\nNext Due: ${nextDueDate.toLocaleDateString("en-IN")}\n\nDon't forget to pay your ${subscriptionName} subscription!`,
      start: {
        dateTime: reminderDateTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: new Date(
          reminderDateTime.getTime() + 30 * 60 * 1000,
        ).toISOString(), // 30 minutes duration
        timeZone: "Asia/Kolkata",
      },
      recurrence: [recurrenceRule],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 2 * 60 }, // 2 hours before
          { method: "popup", minutes: 10 }, // 10 minutes before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log(
      `Created recurring reminder for ${subscriptionName} with event ID: ${response.data.id}`,
    );
    return response.data.id || null;
  } catch (error) {
    console.error("Error creating recurring subscription reminder:", error);
    return null;
  }
}

// Update recurring subscription reminder
export async function updateRecurringSubscriptionReminder(
  calendarId: string,
  eventId: string,
  subscriptionName: string,
  amount: number,
  billingCycle: string,
  nextDueDate: Date,
  description?: string,
): Promise<boolean> {
  try {
    const calendar = getGoogleCalendarClient();

    // Calculate recurrence rule based on billing cycle
    let recurrenceRule = "";
    switch (billingCycle.toLowerCase()) {
      case "monthly":
        recurrenceRule = "RRULE:FREQ=MONTHLY";
        break;
      case "yearly":
        recurrenceRule = "RRULE:FREQ=YEARLY";
        break;
      case "weekly":
        recurrenceRule = "RRULE:FREQ=WEEKLY";
        break;
      default:
        recurrenceRule = "RRULE:FREQ=MONTHLY";
    }

    const reminderDateTime = new Date(nextDueDate);
    reminderDateTime.setHours(9, 0, 0, 0);

    const updates: Partial<BudgetCalendarEvent> = {
      summary: `💳 ${subscriptionName} - Payment Due`,
      description: `${description || `${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} subscription payment`}\n\nAmount: ₹${amount}\nBilling Cycle: ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}\nNext Due: ${nextDueDate.toLocaleDateString("en-IN")}\n\nDon't forget to pay your ${subscriptionName} subscription!`,
      start: {
        dateTime: reminderDateTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: new Date(
          reminderDateTime.getTime() + 30 * 60 * 1000,
        ).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      recurrence: [recurrenceRule],
    };

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updates,
    });

    console.log(`Updated recurring reminder for ${subscriptionName}`);
    return true;
  } catch (error) {
    console.error("Error updating recurring subscription reminder:", error);
    return false;
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
    const calendar = getGoogleCalendarClient();
    const progress = Math.round((currentAmount / targetAmount) * 100);

    const event: BudgetCalendarEvent = {
      summary: `🎯 Goal Milestone: ${goalName}`,
      description: `Target: ₹${targetAmount}\nCurrent: ₹${currentAmount}\nProgress: ${progress}%\nTarget Date: ${targetDate.toLocaleDateString("en-IN")}`,
      start: {
        dateTime: targetDate.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: new Date(
          targetDate.getTime() + 60 * 60 * 1000,
        ).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 7 * 24 * 60 }, // 1 week before
          { method: "popup", minutes: 24 * 60 }, // 1 day before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error("Error creating goal milestone event:", error);
    return null;
  }
}

// Update existing calendar event
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  updates: Partial<BudgetCalendarEvent>,
): Promise<boolean> {
  try {
    const calendar = getGoogleCalendarClient();

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updates,
    });

    return true;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return false;
  }
}

// Delete calendar event
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string,
): Promise<boolean> {
  try {
    const calendar = getGoogleCalendarClient();

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return true;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
}
import { google } from 'googleapis';import { google } from 'googleapis';// lib/google-calendar.ts// lib/google-calendar.ts// lib/google-calendar.ts



interface CalendarEvent {import { createClient } from '@/lib/supabase/server';

  summary: string;

  description?: string;import { google } from 'googleapis';

  start: {

    dateTime: string;interface CalendarEvent {

    timeZone?: string;

  };  summary: string;import { createClient } from '@/lib/supabase/server';import { google } from 'googleapis';

  end: {

    dateTime: string;  description?: string;

    timeZone?: string;

  };  start: {import type { calendar_v3 } from 'googleapis';

  recurrence?: string[];

}    dateTime: string;



export class GoogleCalendarService {    timeZone?: string;import { createClient } from '@/lib/supabase/server';import { google } from "googleapis";

  private auth: InstanceType<typeof google.auth.OAuth2>;

  };

  constructor(accessToken: string) {

    this.auth = new google.auth.OAuth2();  end: {interface CalendarEvent {

    this.auth.setCredentials({ access_token: accessToken });

  }    dateTime: string;



  async createRecurringEvent(eventData: CalendarEvent) {    timeZone?: string;  summary: string;// Import the centralized function to get decoded credentials

    const calendar = google.calendar({ version: 'v3', auth: this.auth });

  };

    try {

      const event = await calendar.events.insert({  recurrence?: string[];  description?: string;

        calendarId: 'primary',

        requestBody: eventData,}

      });

  start: {interface CalendarEvent {import { getDecodedGoogleCredentials } from "./google-auth";

      return event.data;

    } catch (error) {export class GoogleCalendarService {

      console.error('Error creating calendar event:', error);

      throw error;  private auth: InstanceType<typeof google.auth.OAuth2>;    dateTime: string;

    }

  }



  async createSubscriptionReminder(subscription: {  constructor(accessToken: string) {    timeZone?: string;  summary: string;

    name: string;

    cost: number;    this.auth = new google.auth.OAuth2();

    billing_cycle: string;

    next_billing_date: string;    this.auth.setCredentials({ access_token: accessToken });  };

    description?: string;

  }) {  }

    const startDate = new Date(subscription.next_billing_date);

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);  end: {  description?: string;// Get the full, decoded credentials object once



    let recurrence = [];  async createRecurringEvent(eventData: CalendarEvent) {

    switch (subscription.billing_cycle) {

      case 'monthly':    const calendar = google.calendar({ version: 'v3', auth: this.auth });    dateTime: string;

        recurrence = ['RRULE:FREQ=MONTHLY;COUNT=24'];

        break;

      case 'yearly':

        recurrence = ['RRULE:FREQ=YEARLY;COUNT=5'];    try {    timeZone?: string;  start: {const googleCredentials = getDecodedGoogleCredentials();

        break;

      case 'weekly':      const event = await calendar.events.insert({

        recurrence = ['RRULE:FREQ=WEEKLY;COUNT=52'];

        break;        calendarId: 'primary',  };

      case 'quarterly':

        recurrence = ['RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=20'];        requestBody: eventData,

        break;

    }      });  recurrence?: string[];    dateTime: string;



    const eventData: CalendarEvent = {

      summary: `💰 ${subscription.name} - $${subscription.cost}`,

      description: `Billing reminder for ${subscription.name}\nAmount: $${subscription.cost}\nBilling cycle: ${subscription.billing_cycle}`,      return event.data;}

      start: {

        dateTime: startDate.toISOString(),    } catch (error) {

        timeZone: 'America/New_York',

      },      console.error('Error creating calendar event:', error);    timeZone?: string;// Google Calendar API configuration

      end: {

        dateTime: endDate.toISOString(),      throw error;

        timeZone: 'America/New_York',

      },    }export class GoogleCalendarService {

      recurrence,

    };  }



    return this.createRecurringEvent(eventData);  private auth: InstanceType<typeof google.auth.OAuth2>;  };export const googleCalendarConfig = {

  }

}  async createSubscriptionReminder(subscription: {



export async function syncSubscriptionToCalendar(subscription: any, accessToken: string) {    name: string;

  try {

    const calendarService = new GoogleCalendarService(accessToken);    cost: number;

    const event = await calendarService.createSubscriptionReminder(subscription);

        billing_cycle: string;  constructor(accessToken: string) {  end: {  scopes: [

    console.log('Calendar event created:', event?.id);

        next_billing_date: string;

    return { success: true, eventId: event?.id };

  } catch (error) {    description?: string;    this.auth = new google.auth.OAuth2();

    console.error('Failed to sync subscription to calendar:', error);

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };  }) {

  }

}    const startDate = new Date(subscription.next_billing_date);    this.auth.setCredentials({ access_token: accessToken });    dateTime: string;    "https://www.googleapis.com/auth/calendar.events",

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  }

    // Determine recurrence pattern based on billing cycle

    let recurrence = [];    timeZone?: string;    "https://www.googleapis.com/auth/calendar.readonly",

    switch (subscription.billing_cycle) {

      case 'monthly':  async createRecurringEvent(eventData: CalendarEvent) {

        recurrence = ['RRULE:FREQ=MONTHLY;COUNT=24']; // 2 years

        break;    const calendar = google.calendar({ version: 'v3', auth: this.auth });  };  ],

      case 'yearly':

        recurrence = ['RRULE:FREQ=YEARLY;COUNT=5']; // 5 years

        break;

      case 'weekly':    try {  recurrence?: string[];  credentials: {

        recurrence = ['RRULE:FREQ=WEEKLY;COUNT=52']; // 1 year

        break;      const event = await calendar.events.insert({

      case 'quarterly':

        recurrence = ['RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=20']; // 5 years        calendarId: 'primary',}    type: "service_account",

        break;

      default:        requestBody: eventData,

        // For one-time payments, no recurrence

        break;      });    project_id: process.env.GOOGLE_PROJECT_ID,

    }



    const eventData: CalendarEvent = {

      summary: `💰 ${subscription.name} - $${subscription.cost}`,      return event.data;export class GoogleCalendarService {    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,

      description: `${subscription.description || ''}\n\nBilling reminder for ${subscription.name}\nAmount: $${subscription.cost}\nBilling cycle: ${subscription.billing_cycle}`,

      start: {    } catch (error) {

        dateTime: startDate.toISOString(),

        timeZone: 'America/New_York',      console.error('Error creating calendar event:', error);  private auth: any;    // Use the correctly decoded private key here

      },

      end: {      throw error;

        dateTime: endDate.toISOString(),

        timeZone: 'America/New_York',    }    private_key: googleCredentials.private_key,

      },

      recurrence,  }

    };

  constructor(accessToken: string) {    client_email: process.env.GOOGLE_CLIENT_EMAIL,

    return this.createRecurringEvent(eventData);

  }  async createSubscriptionReminder(subscription: {

}

    name: string;    this.auth = new google.auth.OAuth2();    client_id: process.env.GOOGLE_CLIENT_ID,

export async function getUserAccessToken(userId: string) {

  const supabase = createClient();    cost: number;

  

  const { data: session } = await supabase.auth.getSession();    billing_cycle: string;    this.auth.setCredentials({ access_token: accessToken });    auth_uri: "https://accounts.google.com/o/oauth2/auth",

  

  if (!session?.session?.provider_token) {    next_billing_date: string;

    throw new Error('No Google access token found for user');

  }    description?: string;  }    token_uri: "https://oauth2.googleapis.com/token",



  return session.session.provider_token;  }) {

}

    const startDate = new Date(subscription.next_billing_date);    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",

export async function syncSubscriptionToCalendar(subscription: any, userId: string) {

  try {    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    const accessToken = await getUserAccessToken(userId);

    const calendarService = new GoogleCalendarService(accessToken);  async createRecurringEvent(eventData: CalendarEvent) {    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,

    

    const event = await calendarService.createSubscriptionReminder(subscription);    // Determine recurrence pattern based on billing cycle

    

    console.log('Calendar event created:', event?.id);    let recurrence = [];    const calendar = google.calendar({ version: 'v3', auth: this.auth });  },

    

    return { success: true, eventId: event?.id };    switch (subscription.billing_cycle) {

  } catch (error) {

    console.error('Failed to sync subscription to calendar:', error);      case 'monthly':};

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };

  }        recurrence = ['RRULE:FREQ=MONTHLY;COUNT=24']; // 2 years

}
        break;    try {

      case 'yearly':

        recurrence = ['RRULE:FREQ=YEARLY;COUNT=5']; // 5 years      const event = await calendar.events.insert({// ... (the rest of your file remains the same)

        break;

      case 'weekly':        calendarId: 'primary',// export function getGoogleCalendarClient() { ... }

        recurrence = ['RRULE:FREQ=WEEKLY;COUNT=52']; // 1 year

        break;        requestBody: eventData,// ... (all other functions)

      case 'quarterly':

        recurrence = ['RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=20']; // 5 years      });

        break;

      default:// Initialize Google Calendar client

        // For one-time payments, no recurrence

        break;      return event.data;export function getGoogleCalendarClient() {

    }

    } catch (error) {  const auth = new google.auth.GoogleAuth({

    const eventData: CalendarEvent = {

      summary: `💰 ${subscription.name} - $${subscription.cost}`,      console.error('Error creating calendar event:', error);    credentials: googleCalendarConfig.credentials,

      description: `${subscription.description || ''}\n\nBilling reminder for ${subscription.name}\nAmount: $${subscription.cost}\nBilling cycle: ${subscription.billing_cycle}`,

      start: {      throw error;    scopes: googleCalendarConfig.scopes,

        dateTime: startDate.toISOString(),

        timeZone: 'America/New_York', // You can make this configurable    }  });

      },

      end: {  }

        dateTime: endDate.toISOString(),

        timeZone: 'America/New_York',  return google.calendar({ version: "v3", auth });

      },

      recurrence,  async createSubscriptionReminder(subscription: {}

    };

    name: string;

    return this.createRecurringEvent(eventData);

  }    cost: number;// Calendar event types for budget tracking

}

    billing_cycle: string;export interface BudgetCalendarEvent {

export async function getUserAccessToken(userId: string) {

  const supabase = createClient();    next_billing_date: string;  id?: string;

  

  // Get the user's session to access the provider token    description?: string;  summary: string;

  const { data: session } = await supabase.auth.getSession();

    }) {  description?: string;

  if (!session?.session?.provider_token) {

    throw new Error('No Google access token found for user');    const startDate = new Date(subscription.next_billing_date);  start: {

  }

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration    dateTime: string;

  return session.session.provider_token;

}    timeZone?: string;



export async function syncSubscriptionToCalendar(subscription: any, userId: string) {    // Determine recurrence pattern based on billing cycle  };

  try {

    const accessToken = await getUserAccessToken(userId);    let recurrence = [];  end: {

    const calendarService = new GoogleCalendarService(accessToken);

        switch (subscription.billing_cycle) {    dateTime: string;

    const event = await calendarService.createSubscriptionReminder(subscription);

          case 'monthly':    timeZone?: string;

    // Optionally, store the event ID in your database for future reference

    console.log('Calendar event created:', event?.id);        recurrence = ['RRULE:FREQ=MONTHLY;COUNT=24']; // 2 years  };

    

    return { success: true, eventId: event?.id };        break;  recurrence?: string[];

  } catch (error) {

    console.error('Failed to sync subscription to calendar:', error);      case 'yearly':  reminders?: {

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };

  }        recurrence = ['RRULE:FREQ=YEARLY;COUNT=5']; // 5 years    useDefault: boolean;

}
        break;    overrides?: Array<{

      case 'weekly':      method: "email" | "popup";

        recurrence = ['RRULE:FREQ=WEEKLY;COUNT=52']; // 1 year      minutes: number;

        break;    }>;

      case 'quarterly':  };

        recurrence = ['RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=20']; // 5 years}

        break;

      default:// Create calendar event for bill due date

        // For one-time payments, no recurrenceexport async function createBillReminderEvent(

        break;  calendarId: string,

    }  billName: string,

  dueDate: Date,

    const eventData: CalendarEvent = {  amount: number,

      summary: `💰 ${subscription.name} - $${subscription.cost}`,  description?: string,

      description: `${subscription.description || ''}\n\nBilling reminder for ${subscription.name}\nAmount: $${subscription.cost}\nBilling cycle: ${subscription.billing_cycle}`,): Promise<string | null> {

      start: {  try {

        dateTime: startDate.toISOString(),    const calendar = getGoogleCalendarClient();

        timeZone: 'America/New_York', // You can make this configurable

      },    const event: BudgetCalendarEvent = {

      end: {      summary: `💰 Bill Due: ${billName}`,

        dateTime: endDate.toISOString(),      description: `${description || ""}\nAmount: ₹${amount}\nDue Date: ${dueDate.toLocaleDateString()}`,

        timeZone: 'America/New_York',      start: {

      },        dateTime: dueDate.toISOString(),

      recurrence,        timeZone: "Asia/Kolkata", // Indian timezone

    };      },

      end: {

    return this.createRecurringEvent(eventData);        dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration

  }        timeZone: "Asia/Kolkata",

}      },

      reminders: {

export async function getUserAccessToken(userId: string) {        useDefault: false,

  const supabase = createClient();        overrides: [

            { method: "email", minutes: 24 * 60 }, // 1 day before

  // Get the user's session to access the provider token          { method: "popup", minutes: 60 }, // 1 hour before

  const { data: session } = await supabase.auth.getSession();        ],

        },

  if (!session?.session?.provider_token) {    };

    throw new Error('No Google access token found for user');

  }    const response = await calendar.events.insert({

      calendarId,

  return session.session.provider_token;      requestBody: event,

}    });



export async function syncSubscriptionToCalendar(subscription: any, userId: string) {    return response.data.id || null;

  try {  } catch (error) {

    const accessToken = await getUserAccessToken(userId);    console.error("Error creating calendar event:", error);

    const calendarService = new GoogleCalendarService(accessToken);    return null;

      }

    const event = await calendarService.createSubscriptionReminder(subscription);}

    

    // Optionally, store the event ID in your database for future reference// Create recurring calendar event for subscription/EMI reminders

    console.log('Calendar event created:', event?.id);export async function createRecurringSubscriptionReminder(

      calendarId: string,

    return { success: true, eventId: event?.id };  subscriptionName: string,

  } catch (error) {  amount: number,

    console.error('Failed to sync subscription to calendar:', error);  billingCycle: string,

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };  nextDueDate: Date,

  }  description?: string,

}): Promise<string | null> {
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
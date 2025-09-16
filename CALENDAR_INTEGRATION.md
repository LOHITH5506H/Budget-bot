# Google Calendar Integration for Subscriptions

This document outlines the implementation of automatic recurring Google Calendar reminders for subscriptions and EMIs.

## Features

- **Automatic Calendar Event Creation**: When users create a subscription, a recurring reminder is automatically created in their Google Calendar
- **Recurring Reminders**: Events recur based on the billing cycle (monthly, yearly, weekly)
- **Multiple Reminder Types**: Email and popup reminders at different intervals
- **Event Management**: Calendar events are updated or deleted when subscriptions are modified or removed
- **Visual Feedback**: UI shows sync status and confirmation

## Database Changes

A new database migration has been created to track calendar events:

### Migration File: `005_add_calendar_event_id_to_subscriptions.sql`

```sql
-- Add calendar_event_id column to track Google Calendar events for subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_event_id ON public.subscriptions(calendar_event_id);

-- Add comment to explain the purpose
COMMENT ON COLUMN public.subscriptions.calendar_event_id IS 'Google Calendar event ID for recurring reminders';
```

**To apply this migration:**
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the contents of the migration file above
4. Verify the column was added successfully

## Implementation Details

### New Functions Added

#### 1. `createRecurringSubscriptionReminder()`
- Creates recurring calendar events based on billing cycle
- Sets appropriate recurrence rules (RRULE)
- Includes multiple reminder types (email, popup)
- Returns the event ID for tracking

#### 2. `updateRecurringSubscriptionReminder()`
- Updates existing calendar events when subscription details change
- Maintains recurring nature of the event
- Updates all event properties (name, amount, due date, etc.)

#### 3. Enhanced API Endpoints
- `/api/calendar/sync` - Now supports `subscription_reminder` type
- `/api/subscriptions` - New PUT/DELETE endpoints for managing subscriptions and their calendar events

### Calendar Event Details

**Event Properties:**
- **Title**: `💳 [Subscription Name] - Payment Due`
- **Description**: Includes amount, billing cycle, next due date, and helpful reminder text
- **Timezone**: Asia/Kolkata (Indian timezone)
- **Duration**: 30 minutes
- **Recurrence**: Based on billing cycle (monthly/yearly/weekly)

**Reminder Schedule:**
- Email reminder: 24 hours before
- Popup reminder: 2 hours before
- Popup reminder: 10 minutes before

### UI Enhancements

The subscription creation dialog now includes:
- Visual feedback for calendar sync status
- Success/error indicators
- Non-blocking operation (subscription creation succeeds even if calendar sync fails)

## Usage

### For Users

1. **Creating a Subscription:**
   - Fill out subscription details (name, amount, billing cycle, due date)
   - Ensure "Sync to Google Calendar" is checked
   - Submit the form
   - A recurring reminder will be automatically created in Google Calendar

2. **Managing Subscriptions:**
   - Updates to subscription details will automatically update the calendar event
   - Deleting a subscription will remove the calendar event

### For Developers

**Prerequisites:**
- Google Calendar API credentials configured
- Supabase database with proper schema
- User authentication in place

**Environment Variables Required:**
```env
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_CLIENT_EMAIL=your_client_email
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_X509_CERT_URL=your_cert_url
GOOGLE_CALENDAR_ID=primary (or specific calendar ID)
```

## Error Handling

- Calendar sync failures don't prevent subscription creation
- Errors are logged for debugging
- UI provides feedback about sync status
- Graceful degradation when calendar service is unavailable

## Testing

To test the complete flow:

1. **Setup**: Ensure Google Calendar credentials are configured
2. **Create**: Add a new subscription with calendar sync enabled
3. **Verify**: Check Google Calendar for the recurring event
4. **Update**: Modify subscription details and verify calendar event updates
5. **Delete**: Remove subscription and verify calendar event is deleted

## Troubleshooting

**Common Issues:**

1. **Calendar events not created:**
   - Check Google Calendar API credentials
   - Verify user has calendar access
   - Check browser console for errors

2. **Recurring events not working:**
   - Ensure RRULE is properly formatted
   - Verify timezone settings
   - Check Google Calendar API permissions

3. **Events not updating/deleting:**
   - Verify calendar_event_id is stored correctly
   - Check API response codes
   - Ensure user has proper permissions

## Future Enhancements

- Support for custom reminder times
- Integration with other calendar providers (Outlook, Apple Calendar)
- Bulk calendar sync for existing subscriptions
- Calendar conflict detection
- Smart rescheduling based on payment history
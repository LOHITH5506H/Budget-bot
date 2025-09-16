-- Add calendar_event_id column to track Google Calendar events for subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_calendar_event_id ON public.subscriptions(calendar_event_id);

-- Add comment to explain the purpose
COMMENT ON COLUMN public.subscriptions.calendar_event_id IS 'Google Calendar event ID for recurring reminders';
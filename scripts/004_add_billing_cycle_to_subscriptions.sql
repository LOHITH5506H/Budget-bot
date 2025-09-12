-- Add missing billing_cycle column to subscriptions table
-- This aligns the database schema with the subscription creation dialog expectations

-- Add billing_cycle column if it doesn't exist
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly';

-- Update the due_date system to use next_due_date instead
-- First add the new column
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS next_due_date DATE;

-- For existing records, convert due_date (day of month) to next_due_date (actual date)
-- This assumes current month, but you may want to adjust based on your needs
UPDATE public.subscriptions 
SET next_due_date = DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (due_date - 1) * INTERVAL '1 day'
WHERE next_due_date IS NULL AND due_date IS NOT NULL;

-- Make next_due_date NOT NULL after populating existing records
ALTER TABLE public.subscriptions 
ALTER COLUMN next_due_date SET NOT NULL;

-- Remove the old due_date column (optional - uncomment if you want to clean up)
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS due_date;

-- Remove category_id and last_paid_date if they exist but aren't used by the current dialog
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS category_id;
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS last_paid_date;

-- Create indexes for better performance on the new column
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle ON public.subscriptions(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date ON public.subscriptions(next_due_date);

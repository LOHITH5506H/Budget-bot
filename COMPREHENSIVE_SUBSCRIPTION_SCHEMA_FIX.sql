-- Comprehensive Subscription Schema Fix
-- This ensures the subscriptions table matches the frontend expectations
-- Run this in your Supabase SQL Editor

-- Step 1: Add missing columns if they don't exist
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50) DEFAULT 'monthly';

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS next_due_date DATE;

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS company_domain TEXT;

-- Step 2: Handle the due_date vs next_due_date transition
-- If next_due_date is null but due_date exists, convert it
UPDATE public.subscriptions 
SET next_due_date = DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (due_date - 1) * INTERVAL '1 day'
WHERE next_due_date IS NULL AND due_date IS NOT NULL;

-- If next_due_date is still null, set a default
UPDATE public.subscriptions 
SET next_due_date = CURRENT_DATE + INTERVAL '1 month'
WHERE next_due_date IS NULL;

-- Step 3: Make required columns NOT NULL after populating them
ALTER TABLE public.subscriptions 
ALTER COLUMN billing_cycle SET NOT NULL;

ALTER TABLE public.subscriptions 
ALTER COLUMN billing_cycle SET DEFAULT 'monthly';

-- Only set next_due_date to NOT NULL if all rows have valid dates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.subscriptions WHERE next_due_date IS NULL
    ) THEN
        ALTER TABLE public.subscriptions ALTER COLUMN next_due_date SET NOT NULL;
    END IF;
END $$;

-- Step 4: Make category_id nullable if it exists (frontend doesn't use it)
ALTER TABLE public.subscriptions 
ALTER COLUMN category_id DROP NOT NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle ON public.subscriptions(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date ON public.subscriptions(next_due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_domain ON public.subscriptions(company_domain);

-- Step 6: Verify the final schema
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
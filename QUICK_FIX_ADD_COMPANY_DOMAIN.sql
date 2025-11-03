-- Quick Fix: Add company_domain column to resolve schema cache error
-- Run this in your Supabase SQL Editor

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS company_domain TEXT;

-- Add an index for performance (optional)
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_domain 
ON public.subscriptions(company_domain);

-- Add comment
COMMENT ON COLUMN public.subscriptions.company_domain 
IS 'Domain name of the subscription service (e.g., netflix.com, spotify.com) - can be null';

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
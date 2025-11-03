-- Add company_domain column to subscriptions table
-- This migration adds the missing company_domain column that was referenced in the subscription dialog

-- Add company_domain column if it doesn't exist
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS company_domain TEXT;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.subscriptions.company_domain IS 'Domain name of the subscription service (e.g., netflix.com, spotify.com)';

-- Create index for better performance if needed
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_domain ON public.subscriptions(company_domain);

-- Update any existing records that have logo_url but no company_domain
-- This tries to extract domain from logo URLs where possible
UPDATE public.subscriptions 
SET company_domain = 
  CASE 
    WHEN logo_url LIKE '%netflix.com%' THEN 'netflix.com'
    WHEN logo_url LIKE '%spotify.com%' THEN 'spotify.com'
    WHEN logo_url LIKE '%disney%' THEN 'disneyplus.com'
    WHEN logo_url LIKE '%apple.com%' THEN 'apple.com'
    WHEN logo_url LIKE '%amazon.com%' THEN 'amazon.com'
    WHEN logo_url LIKE '%youtube.com%' THEN 'youtube.com'
    WHEN logo_url LIKE '%hulu.com%' THEN 'hulu.com'
    WHEN logo_url LIKE '%hbo%' THEN 'hbomax.com'
    WHEN logo_url LIKE '%microsoft.com%' THEN 'microsoft.com'
    WHEN logo_url LIKE '%adobe.com%' THEN 'adobe.com'
    WHEN logo_url LIKE '%zoom.us%' THEN 'zoom.us'
    WHEN logo_url LIKE '%dropbox.com%' THEN 'dropbox.com'
    ELSE NULL
  END
WHERE company_domain IS NULL AND logo_url IS NOT NULL;
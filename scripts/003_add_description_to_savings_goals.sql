-- Add description column to savings_goals table
-- This migration adds the missing description column that the goal creation dialog expects

ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS description TEXT;

-- Update the comment for clarity
COMMENT ON COLUMN public.savings_goals.description IS 'Optional description for the savings goal';

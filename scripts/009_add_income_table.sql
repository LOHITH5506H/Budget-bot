-- Add Income Tracking Table
-- This allows users to track their income sources and amounts

-- Create income table
CREATE TABLE IF NOT EXISTS public.income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(100) DEFAULT 'salary',
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(50), -- 'weekly', 'biweekly', 'monthly', 'yearly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_income_user_id ON public.income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_received_date ON public.income(received_date);
CREATE INDEX IF NOT EXISTS idx_income_category ON public.income(category);
CREATE INDEX IF NOT EXISTS idx_income_is_recurring ON public.income(is_recurring);

-- Add RLS policies
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own income
CREATE POLICY "Users can view own income"
ON public.income FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own income
CREATE POLICY "Users can insert own income"
ON public.income FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own income
CREATE POLICY "Users can update own income"
ON public.income FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own income
CREATE POLICY "Users can delete own income"
ON public.income FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_income_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_income_updated_at
BEFORE UPDATE ON public.income
FOR EACH ROW
EXECUTE FUNCTION update_income_updated_at();

-- Add comment
COMMENT ON TABLE public.income IS 'Stores user income records with source, amount, and frequency tracking';

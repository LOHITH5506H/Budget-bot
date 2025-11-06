-- Track individual savings deposits for goals
CREATE TABLE IF NOT EXISTS public.goal_savings_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_goal_savings_entries_goal_id ON public.goal_savings_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_savings_entries_user_id ON public.goal_savings_entries(user_id);

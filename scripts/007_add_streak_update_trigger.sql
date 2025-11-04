-- Function to update streak when an expense is added
CREATE OR REPLACE FUNCTION public.update_streak_on_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_streak RECORD;
  today_date DATE;
  yesterday_date DATE;
BEGIN
  -- Get today and yesterday's dates
  today_date := CURRENT_DATE;
  yesterday_date := today_date - INTERVAL '1 day';

  -- Get the current streak data for this user
  SELECT * INTO user_streak
  FROM public.streaks
  WHERE user_id = NEW.user_id;

  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_activity_date, streak_freezes)
    VALUES (NEW.user_id, 1, 1, today_date, 1);
    RETURN NEW;
  END IF;

  -- Check if this is the first expense today
  -- If last_activity_date is NULL or not today, we need to update
  IF user_streak.last_activity_date IS NULL THEN
    -- First ever expense
    UPDATE public.streaks
    SET 
      current_streak = 1,
      longest_streak = GREATEST(1, user_streak.longest_streak),
      last_activity_date = today_date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
  ELSIF user_streak.last_activity_date = today_date THEN
    -- Already logged an expense today, don't increment streak
    -- Just update the timestamp
    UPDATE public.streaks
    SET updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
  ELSIF user_streak.last_activity_date = yesterday_date THEN
    -- Consecutive day! Increment the streak
    UPDATE public.streaks
    SET 
      current_streak = user_streak.current_streak + 1,
      longest_streak = GREATEST(user_streak.current_streak + 1, user_streak.longest_streak),
      last_activity_date = today_date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
  ELSE
    -- Streak broken! Reset to 1
    UPDATE public.streaks
    SET 
      current_streak = 1,
      last_activity_date = today_date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_streak_on_expense ON public.expenses;

-- Create trigger that fires after each expense insert
CREATE TRIGGER trigger_update_streak_on_expense
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak_on_expense();

-- Add helpful comment
COMMENT ON FUNCTION public.update_streak_on_expense() IS 'Automatically updates user streak when an expense is added. Increments streak for consecutive days, resets if days are missed.';

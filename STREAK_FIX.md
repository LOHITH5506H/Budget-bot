# Streak Not Incrementing - FIX

## Problem
The streak counter stays at 1 even after adding expenses on multiple days.

## Root Cause
There's **no database trigger** to automatically update the streak when an expense is added. The streak table exists but nothing is updating it!

## Solution

### Option 1: Run SQL Script in Supabase (RECOMMENDED)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **budgetbot-471917**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire content of `scripts/007_add_streak_update_trigger.sql`
6. Click **Run** or press `Ctrl+Enter`

### Option 2: Quick Fix - Copy This SQL

```sql
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

-- Create trigger
CREATE TRIGGER trigger_update_streak_on_expense
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak_on_expense();
```

## How It Works

The trigger automatically:
1. ✅ **First expense ever**: Sets streak to 1
2. ✅ **Expense on same day**: Doesn't increment (only one streak per day)
3. ✅ **Consecutive day**: Increments streak by 1
4. ✅ **Missed days**: Resets streak to 1
5. ✅ **Tracks longest streak**: Updates if current beats previous best

## Testing

### Step 1: Run the SQL
Execute the SQL script in Supabase SQL Editor.

### Step 2: Reset Your Current Streak (Optional)
If you want to test from scratch:

```sql
-- Reset your streak to 0
UPDATE public.streaks 
SET current_streak = 0, last_activity_date = NULL 
WHERE user_id = 'YOUR_USER_ID';
```

### Step 3: Add an Expense
1. Go to your dashboard
2. Use the Quick Expense widget
3. Add any expense
4. Check the Streak Widget - it should show **1 day**

### Step 4: Test Consecutive Days
To test without waiting for tomorrow:

```sql
-- Manually set last_activity_date to yesterday
UPDATE public.streaks 
SET last_activity_date = CURRENT_DATE - INTERVAL '1 day',
    current_streak = 1
WHERE user_id = 'YOUR_USER_ID';
```

Then add another expense - streak should increment to **2 days**!

## Expected Behavior After Fix

| Scenario | Streak Behavior |
|----------|-----------------|
| First expense ever | Streak = 1 |
| 2nd expense same day | Streak stays at 1 |
| Expense next day | Streak = 2 |
| Expense 2 days later | Streak resets to 1 |
| 7 consecutive days | Streak = 7 |

## Verification

After running the SQL, check that the trigger was created:

```sql
-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_streak_on_expense';

-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_update_streak_on_expense';
```

Both should return results.

## Troubleshooting

### ❌ Error: "function already exists"
**Solution:** The script uses `CREATE OR REPLACE`, so this shouldn't happen. If it does, run:
```sql
DROP FUNCTION IF EXISTS public.update_streak_on_expense() CASCADE;
```
Then re-run the main script.

### ❌ Streak still not updating
**Check:**
1. Verify trigger is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_streak_on_expense';
```

2. Check for errors in logs (Supabase Dashboard → Logs)

3. Verify expenses table has the trigger:
```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.expenses'::regclass;
```

### ✅ Success Indicators
- Function created successfully
- Trigger created successfully
- Adding expense updates `last_activity_date` in streaks table
- Consecutive day expenses increment `current_streak`
- Dashboard shows updated streak immediately

## Files Created
- `scripts/007_add_streak_update_trigger.sql` - The SQL script

---

**After running the SQL script, your streak will automatically update every time you add an expense!** 🔥

# Google Calendar Not Showing Events - CRITICAL FIX NEEDED

## 🚨 CRITICAL ISSUE FOUND

Your `GOOGLE_CALENDAR_ID` in `.env.local` is **INCORRECT**!

### Current (WRONG):
```env
GOOGLE_CALENDAR_ID=https://calendar.google.com/calendar/embed?src=gurukarthikeya05%40gmail.com&ctz=UTC
```

### Should Be (CORRECT):
```env
GOOGLE_CALENDAR_ID=gurukarthikeya05@gmail.com
```

## How to Fix

### Step 1: Update `.env.local`

Open your `.env.local` file and change line 27 from:
```env
GOOGLE_CALENDAR_ID=https://calendar.google.com/calendar/embed?src=gurukarthikeya05%40gmail.com&ctz=UTC
```

To:
```env
GOOGLE_CALENDAR_ID=gurukarthikeya05@gmail.com
```

### Step 2: Restart Your Dev Server

```powershell
# Stop the current server (Ctrl+C in the terminal)
# Then restart
pnpm dev
```

### Step 3: Grant Service Account Access to Your Calendar

This is **CRITICAL** - without this, events won't appear in your calendar!

1. Go to [Google Calendar](https://calendar.google.com/)
2. Click the **Settings gear** (⚙️) → **Settings**
3. In the left sidebar, find **Settings for my calendars**
4. Click on your calendar (`gurukarthikeya05@gmail.com`)
5. Scroll down to **Share with specific people**
6. Click **Add people**
7. Enter the service account email:
   ```
   calender-sync-service@budgetbot-471917.iam.gserviceaccount.com
   ```
8. Select permission: **Make changes to events**
9. Click **Send**

**Without this step, the service account cannot create events in your calendar!**

### Step 4: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **budgetbot-471917**
3. Go to **APIs & Services** → **Library**
4. Search for "**Google Calendar API**"
5. Click on it
6. Click **ENABLE** (if not already enabled)

## What Changed in the Code

### ✅ Added Detailed Logging

The code now logs every step of calendar event creation:
```
=== Creating Bill Reminder Event ===
Calendar ID: gurukarthikeya05@gmail.com
Bill Name: Netflix
Due Date: 2025-11-15
Amount: 199
✅ Calendar event created successfully!
Event ID: abc123...
Event Link: https://calendar.google.com/...
```

### ✅ Changed Timezone to India

Changed from `America/New_York` to `Asia/Kolkata` (Indian Standard Time)

### ✅ Changed Currency Symbol

Changed from `$` to `₹` in event descriptions

## Testing Steps

### 1. Check Environment Variables

Run this command to verify your service account email:
```powershell
# This should show your service account email
node -e "console.log('Service Account:', process.env.GOOGLE_CLIENT_EMAIL || 'NOT SET')"
```

Expected output:
```
Service Account: calender-sync-service@budgetbot-471917.iam.gserviceaccount.com
```

### 2. Create a Test Subscription

1. Navigate to `/subscriptions`
2. Click "Add Subscription"
3. Fill in:
   - **Service Name**: Netflix Test
   - **Amount**: 199
   - **Billing Cycle**: Monthly
   - **Next Due Date**: Pick a future date
   - ✅ **Sync to Google Calendar**: CHECK THIS
4. Click "Add Subscription"

### 3. Check Server Logs

In your terminal, you should see:
```
=== Creating Bill Reminder Event ===
Calendar ID: gurukarthikeya05@gmail.com
Bill Name: Netflix Test
Due Date: 2025-11-15T00:00:00.000Z
Amount: 199
Event to be created: {
  "summary": "💰 Bill Due: Netflix Test",
  "description": "monthly subscription\nAmount: ₹199\nDue Date: 11/15/2025",
  ...
}
✅ Calendar event created successfully!
Event ID: xyz123abc...
Event Link: https://calendar.google.com/calendar/event?eid=...
```

### 4. Check Your Google Calendar

1. Open [Google Calendar](https://calendar.google.com/)
2. Look for the event on the due date
3. Event should show:
   - Title: **💰 Bill Due: Netflix Test**
   - Description: Amount and due date
   - Reminders: 1 day before (email), 1 hour before (popup)

## Troubleshooting

### ❌ Error: "Insufficient Permission" or "Calendar not found"

**Solution:** You didn't share your calendar with the service account.
- Go back to Step 3 above
- Make sure you added `calender-sync-service@budgetbot-471917.iam.gserviceaccount.com`
- Give it "Make changes to events" permission

### ❌ No error but event not appearing

**Possible causes:**
1. Wrong calendar ID (already fixed above)
2. Service account doesn't have access (see Step 3)
3. Looking at wrong calendar in Google Calendar
4. Event created on wrong date

**Solution:**
1. Check server logs for the event link
2. Click the link to see if event exists
3. Verify you're logged into `gurukarthikeya05@gmail.com` in Google Calendar

### ❌ Error: "Invalid credentials" or "DECODER routines"

**Solution:** Already fixed in previous update!
- Code now decodes base64 private key automatically
- Just restart your server

### ❌ Error: "API not enabled"

**Solution:** Enable Google Calendar API
- Go to Step 4 above
- Enable the API in Google Cloud Console

## Quick Checklist

Before creating a subscription, verify:

- [ ] `.env.local` has `GOOGLE_CALENDAR_ID=gurukarthikeya05@gmail.com` (not the full URL)
- [ ] Service account email added to calendar sharing settings
- [ ] Service account has "Make changes to events" permission
- [ ] Google Calendar API is enabled in Google Cloud Console
- [ ] Dev server restarted after changing `.env.local`
- [ ] Logged into correct Google account (`gurukarthikeya05@gmail.com`)

## Expected Behavior After Fix

✅ Create subscription with calendar sync enabled
✅ See detailed logs in terminal
✅ Event appears in your Google Calendar immediately
✅ Event has correct date, time, and description
✅ Email reminder sent 1 day before
✅ Popup reminder shown 1 hour before

## Test Different Scenarios

### Test 1: Subscription
- Create subscription with future due date
- Check calendar for "💰 Bill Due: [name]" event

### Test 2: Goal
- Create goal with target date
- Check calendar for "🎯 Goal Milestone: [name]" event

### Test 3: Multiple Events
- Create multiple subscriptions with different dates
- Verify all events appear in calendar
- Check that dates are correct

## Debug Command

If events still don't appear, run this test:

1. Open browser console (F12)
2. Go to Network tab
3. Create a subscription
4. Look for `/api/calendar/sync` request
5. Check the response

**Success response:**
```json
{
  "success": true,
  "eventId": "abc123xyz..."
}
```

**Failure response:**
```json
{
  "success": false,
  "error": "...",
  "message": "..."
}
```

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-account-overview)
- [Calendar Sharing Settings](https://support.google.com/calendar/answer/37082)

---

## Summary

**The main issue is your `GOOGLE_CALENDAR_ID` - it's a full embed URL instead of just the email address.**

**Fix:**
1. ✅ Change `GOOGLE_CALENDAR_ID` to `gurukarthikeya05@gmail.com`
2. ✅ Share calendar with service account
3. ✅ Restart server
4. ✅ Test!

After these changes, events should appear in your calendar immediately! 🎉

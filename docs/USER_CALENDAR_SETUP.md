# 📅 User-Specific Calendar Sync Setup

## 🎯 How It Works Now

✅ **FIXED:** Calendar events now sync to **each user's personal calendar** instead of a shared calendar!

When a user creates a subscription or goal, the event is created in **their own Google Calendar** using their email address.

---

## ⚠️ Important: Calendar Sharing Required

For the Budget-bot service account to create events in user calendars, **each user must share their calendar with the service account**.

### 🔑 Service Account Email
```
calender-sync-service@budgetbot-471917.iam.gserviceaccount.com
```

---

## 📋 User Setup Instructions

Each user needs to follow these steps **ONCE** to enable calendar sync:

### Step 1: Open Google Calendar Settings

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the **gear icon** (⚙️) in the top right
3. Click **Settings**

### Step 2: Share Your Calendar

1. In the left sidebar, find **"Settings for my calendars"**
2. Click on your **primary calendar** (usually your email)
3. Scroll down to **"Share with specific people or groups"**
4. Click **"+ Add people and groups"**

### Step 3: Add the Service Account

1. In the "Add people and groups" field, paste:
   ```
   calender-sync-service@budgetbot-471917.iam.gserviceaccount.com
   ```

2. Set permissions to **"Make changes to events"**

3. Click **Send**

4. ✅ Done! Budget-bot can now create events in your calendar!

---

## 🧪 Testing

After sharing your calendar:

1. Go to Budget-bot: http://localhost:3001/subscriptions
2. Create a new subscription with a due date
3. Check your Google Calendar - you should see the event!

---

## 🔐 Alternative: Use User's Own OAuth (Future Enhancement)

Instead of requiring users to share their calendar, we could implement **Google OAuth** where users authorize Budget-bot to access their calendar directly.

### Pros:
- ✅ More secure
- ✅ No manual sharing required
- ✅ Users control access

### Cons:
- ⚠️ More complex implementation
- ⚠️ Requires OAuth setup
- ⚠️ Users need to authorize the app

**Current implementation uses service account for simplicity.**

---

## 🚨 What Happens If Calendar Isn't Shared?

If a user hasn't shared their calendar with the service account:

- ❌ Calendar sync will fail silently
- ✅ Subscription/goal is still created in the database
- ✅ Pusher notifications still work
- ✅ Email notifications still work
- ⚠️ Calendar event creation returns error (doesn't break the app)

The app is designed to work **with or without** calendar sync!

---

## 🎯 For Development/Testing

During development, you can test with your own calendar:

1. Use your personal email when signing up
2. Share your calendar with the service account (see steps above)
3. Create subscriptions and check your calendar

---

## 📝 Code Changes Made

### Before:
```typescript
const calendarId = profile?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || "primary"
```
- All events went to `gurukarthikeya05@gmail.com`

### After:
```typescript
const calendarId = user.email || "primary"
```
- Events go to **the logged-in user's email/calendar**

---

## 🔮 Future Improvements

1. **OAuth Integration:** Let users authorize via Google
2. **Calendar Preference:** Let users choose which calendar to sync to
3. **Auto-sharing:** Automatically send calendar sharing invitations
4. **Status Indicator:** Show if calendar sync is enabled for the user
5. **Settings Page:** Let users configure calendar sync on/off

---

## ✅ Summary

**What changed:**
- ✅ Calendar events now sync to each user's personal calendar
- ✅ Uses the user's email address as calendar ID
- ✅ No more hardcoded calendar in .env.local

**What users need to do:**
- 📧 Share their Google Calendar with the service account
- 📧 Email: `calender-sync-service@budgetbot-471917.iam.gserviceaccount.com`
- 🔑 Permission: "Make changes to events"

**That's it!** 🎉

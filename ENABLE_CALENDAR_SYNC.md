# ⚠️ Calendar Access Denied - Quick Fix

## 🚨 The Problem

You're seeing this error:
```
Error: Not Found
```

This means the Budget-bot service account **doesn't have permission** to create events in your Google Calendar.

---

## ✅ The Solution (2 Minutes)

Follow these steps to enable calendar sync for YOUR account:

### Step 1: Open Google Calendar Settings

Click this link (opens your calendar settings):
👉 **https://calendar.google.com/calendar/u/0/r/settings**

### Step 2: Find Your Calendar

1. In the left sidebar, look for **"Settings for my calendars"**
2. Click on your **primary calendar** (usually your email address)

### Step 3: Share with Service Account

1. Scroll down to **"Share with specific people or groups"**
2. Click **"+ Add people and groups"**
3. In the email field, paste this:
   ```
   calender-sync-service@budgetbot-471917.iam.gserviceaccount.com
   ```
4. Change permission dropdown to: **"Make changes to events"**
5. Click **"Send"**

### Step 4: Test Again

1. Go back to Budget-bot
2. Create a new subscription
3. ✅ Calendar event should now be created successfully!

---

## 🎯 Visual Guide

```
Google Calendar Settings
├── Settings for my calendars
│   ├── Your Email (click this)
│   │   ├── Share with specific people
│   │   │   ├── + Add people and groups
│   │   │   │   ├── Email: calender-sync-service@budgetbot-471917...
│   │   │   │   ├── Permission: "Make changes to events"
│   │   │   │   └── Click "Send"
```

---

## ❓ FAQ

**Q: Why do I need to share my calendar?**  
A: Budget-bot uses a service account to create events. It needs your permission to access your calendar.

**Q: Is this safe?**  
A: Yes! The service account can only create/edit events. It cannot read your emails or access other Google services.

**Q: What if I don't want calendar sync?**  
A: No problem! Just don't share your calendar. Everything else (subscriptions, notifications, emails) will still work perfectly.

**Q: Can I revoke access later?**  
A: Absolutely! Just go back to calendar settings and remove the service account email.

**Q: Will my events be private?**  
A: Yes! Events are created in YOUR calendar and are only visible to you (unless you share your calendar with others).

---

## 🔐 Privacy & Security

- **The service account can:** Create and modify calendar events
- **The service account CANNOT:**
  - Read your emails
  - Access your files
  - View other calendars
  - Share your data
  - Access any other Google services

The service account is **limited to calendar events only**.

---

## ✅ After Setup

Once you've shared your calendar, you'll see messages like this:

```
📅 Syncing calendar event for user: your-email@gmail.com
=== Creating Bill Reminder Event ===
✅ Calendar event created successfully!
Event Link: https://calendar.google.com/calendar/event?eid=...
```

**That's it!** Your calendar sync is now working! 🎉

---

## 🆘 Still Having Issues?

If you've shared your calendar but still getting errors:

1. **Check the email is correct:**
   ```
   calender-sync-service@budgetbot-471917.iam.gserviceaccount.com
   ```

2. **Check the permission level:**
   - Should be: "Make changes to events"
   - NOT: "See only free/busy" or "See all event details"

3. **Wait a minute and try again**
   - Sometimes Google takes a moment to update permissions

4. **Check you're using the right Google account**
   - Make sure you're signed into the same account in Budget-bot

---

**Need more help?** Check `USER_CALENDAR_SETUP.md` for detailed instructions with screenshots.

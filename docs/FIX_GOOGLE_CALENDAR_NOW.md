# 🔧 Fix Google Calendar - IMMEDIATE ACTION REQUIRED

## The Problem
Your `GOOGLE_PRIVATE_KEY` in `.env.local` is causing a decoder error. While the format looks correct, the key itself is incompatible with Node.js's crypto library.

**Error:** `error:1E08010C:DECODER routines::unsupported`

## ✅ THE FIX (5 minutes)

### Step 1: Download Fresh Service Account Key

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/

2. **Select your project:** `budgetbot-471917`

3. **Navigate to IAM & Admin → Service Accounts**
   Direct link: https://console.cloud.google.com/iam-admin/serviceaccounts?project=budgetbot-471917

4. **Click on:** `calender-sync-service@budgetbot-471917.iam.gserviceaccount.com`

5. **Go to "Keys" tab**

6. **Click "ADD KEY" → "Create new key"**

7. **Select JSON** (NOT P12)

8. **Click "CREATE"** - A JSON file will download

### Step 2: Extract the Private Key

1. Open the downloaded JSON file in Notepad or VS Code

2. Find the `"private_key"` field - it will look like:
   ```json
   {
     "type": "service_account",
     "project_id": "budgetbot-471917",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...(very long)...=\n-----END PRIVATE KEY-----\n",
     "client_email": "calender-sync-service@budgetbot-471917.iam.gserviceaccount.com",
     ...
   }
   ```

3. **Copy the ENTIRE value** of `"private_key"` (including the quotes and `\n` characters)

### Step 3: Update .env.local

1. Open `.env.local` in VS Code

2. Find the line starting with `GOOGLE_PRIVATE_KEY=`

3. Replace it with:
   ```env
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...(paste your new key here)...\n-----END PRIVATE KEY-----\n"
   ```

**IMPORTANT:** Keep all the `\n` characters - they are required!

### Step 4: Restart Server

1. Stop the dev server (Ctrl+C in terminal)

2. Delete .next folder:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. Restart:
   ```powershell
   npm run dev
   ```

### Step 5: Test

1. Go to `/subscriptions`
2. Create a new subscription
3. Check terminal - should see "✅ Calendar event created successfully!"
4. Check your Google Calendar at gurukarthikeya05@gmail.com

---

## 🎯 Why This Happens

- Old service account keys can become corrupted
- Encoding issues when copying/pasting
- Node.js crypto library compatibility
- Invisible characters in the key

**Fresh key = Fresh start = Working calendar!** 🚀

---

## ⚠️ CRITICAL: About the 404 Error

I also see this in your logs:
```
POST /api/notifications/send 404 in 10011ms
```

After downloading the new key and updating `.env.local`:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

This will fix BOTH issues:
- ✅ Calendar sync decoder error
- ✅ Notifications API 404

---

## 📞 If Still Having Issues

If you still get errors after following these steps:

1. Make sure you copied the ENTIRE private key including:
   - `-----BEGIN PRIVATE KEY-----`
   - All the middle content
   - `-----END PRIVATE KEY-----`
   - Keep all `\n` characters

2. Make sure the key is wrapped in **double quotes**:
   ```env
   GOOGLE_PRIVATE_KEY="-----BEGIN...-----END PRIVATE KEY-----\n"
   ```

3. Don't remove any `\n` - they represent newlines!

---

**Expected result after fix:**
```
=== Creating Bill Reminder Event ===
✅ Calendar event created successfully!
Event ID: abc123xyz
Event Link: https://calendar.google.com/calendar/event?eid=...
```


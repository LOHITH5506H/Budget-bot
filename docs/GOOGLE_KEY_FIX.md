# FIX: Google Calendar Private Key Error

## The Problem

The `GOOGLE_PRIVATE_KEY` in your `.env.local` is base64 encoded but appears to be **corrupted or truncated**. The decoder is failing because the key data is incomplete.

## SOLUTION 1: Get Fresh Service Account Key (RECOMMENDED)

### Step 1: Download New Key from Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **budgetbot-471917**
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Find: `calender-sync-service@budgetbot-471917.iam.gserviceaccount.com`
5. Click on it
6. Go to **Keys** tab
7. Click **Add Key** → **Create new key**
8. Select **JSON**
9. Click **Create** - a file will download

### Step 2: Extract the Private Key

Open the downloaded JSON file. You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "budgetbot-471917",
  "private_key_id": "6b38080e509162c00008c8a44312da7a56298586",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w...[FULL KEY]...END PRIVATE KEY-----\n",
  "client_email": "calender-sync-service@budgetbot-471917.iam.gserviceaccount.com",
  ...
}
```

### Step 3: Update .env.local

Copy the **ENTIRE** `private_key` value (including quotes) into your `.env.local`:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCkdiKH...[FULL KEY HERE]...END PRIVATE KEY-----\n"
```

**IMPORTANT:** 
- Keep the entire key in ONE LINE with `\n` characters
- Keep the quotes around it
- Don't break it into multiple lines
- Make sure nothing is truncated

## SOLUTION 2: Quick Fix - Disable Calendar Sync

If you want to skip calendar sync for now:

### Option A: Comment out in .env.local

```env
# GOOGLE_PRIVATE_KEY="..."
# This will disable calendar sync but everything else will work
```

### Option B: Update the code to skip calendar

Already done! The code returns a soft error (200 status) if Google Calendar credentials are missing, so subscriptions and goals will still be created successfully even if calendar sync fails.

## Verification Script

After updating the private key, run this to verify it's valid:

```javascript
// test-google-key.js
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.GOOGLE_PRIVATE_KEY;

console.log('Private key length:', privateKey?.length || 0);
console.log('Has BEGIN:', privateKey?.includes('BEGIN PRIVATE KEY'));
console.log('Has END:', privateKey?.includes('END PRIVATE KEY'));

// Try to decode if base64
if (!privateKey?.includes('BEGIN')) {
  try {
    const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
    console.log('Decoded successfully!');
    console.log('Decoded has BEGIN:', decoded.includes('BEGIN PRIVATE KEY'));
    console.log('Decoded length:', decoded.length);
  } catch (error) {
    console.error('Decode failed:', error.message);
  }
}
```

Run:
```powershell
node test-google-key.js
```

## Why This Happens

Common causes:
1. ❌ Private key was copy/pasted incorrectly
2. ❌ Base64 encoding was done incorrectly
3. ❌ Key got truncated during copy/paste
4. ❌ Line breaks were added/removed
5. ❌ Old/revoked key being used

## What Works Right Now

Even with the calendar error, these still work:
- ✅ Subscription created in database
- ✅ Pusher real-time notifications
- ✅ Email notifications (SendPulse)
- ✅ Dashboard updates

**Only calendar sync fails**, and it's a soft failure (doesn't break the flow).

## Recommended Action

### Quick Fix (Now):
```env
# Comment out Google Calendar for now
# GOOGLE_PRIVATE_KEY="..."
```

This disables calendar sync but everything else works.

### Proper Fix (5 minutes):
1. Download fresh service account key from Google Cloud
2. Copy the `private_key` value from JSON
3. Paste into `.env.local` exactly as shown above
4. Restart dev server
5. Test subscription creation

## Testing After Fix

1. Update `.env.local` with correct private key
2. Restart: `pnpm dev`
3. Create a test subscription
4. Check logs for:
   ```
   === Creating Bill Reminder Event ===
   ✅ Calendar event created successfully!
   Event Link: https://calendar.google.com/...
   ```
5. Open Google Calendar - event should be there!

---

**For now, your app works perfectly except for calendar sync. The calendar error doesn't block anything!** 🎉

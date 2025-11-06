# Google Calendar Integration Setup Guide

## Error Fix: `DECODER routines::unsupported`

This error occurs when the Google private key is not in the correct format. Follow these steps to fix it.

## Problem

Your `.env.local` currently has the `GOOGLE_PRIVATE_KEY` as a **base64-encoded** string, but it needs to be the actual **PEM format** private key.

## Solution

### Option 1: Use Base64 Encoded Key (Current Setup - Now Fixed)

✅ **The code has been updated to automatically decode base64 keys!**

Your current `.env.local` setup will now work. The `google-calendar.ts` file now automatically:
1. Detects if the key is base64 encoded
2. Decodes it to the proper PEM format
3. Uses it for authentication

**No changes needed to your `.env.local` if you're using base64!**

### Option 2: Use Raw PEM Format (Alternative)

If you want to use the raw PEM format instead, update your `.env.local`:

```env
# Get the actual private key from Google Cloud Console
# It should look like this (as a single line with \n for newlines):
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCkdiKH2qzvGEq9\n...[rest of key]...\n-----END PRIVATE KEY-----\n"
```

## How to Get Google Service Account Credentials

### Step 1: Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Name it `budget-bot-calendar` and click **Create**
6. Grant it the **Owner** role (or **Calendar Editor** if available)
7. Click **Done**

### Step 2: Create and Download the Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create** - a JSON file will download

### Step 3: Extract Values from the JSON File

Open the downloaded JSON file. You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----\n",
  "client_email": "budget-bot-calendar@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 4: Update Your .env.local

Copy values from the JSON into your `.env.local`:

```env
# Google Calendar Configuration
GOOGLE_PROJECT_ID=your-project-123456
GOOGLE_PRIVATE_KEY_ID=abc123...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=budget-bot-calendar@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=123456789
GOOGLE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
GOOGLE_CALENDAR_ID=primary
```

**Important Notes:**
- Keep the entire `private_key` value in quotes
- Keep the `\n` characters - they are important!
- Or use base64 encoding (current setup works with both)

### Step 5: Enable Google Calendar API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and click **Enable**

### Step 6: Share Your Calendar with the Service Account

For the service account to create events, you need to share your calendar with it:

1. Open [Google Calendar](https://calendar.google.com/)
2. Click the settings gear → **Settings**
3. In the left sidebar, find your calendar under "Settings for my calendars"
4. Click on your calendar
5. Scroll to **Share with specific people**
6. Click **Add people**
7. Add the service account email (from `GOOGLE_CLIENT_EMAIL`)
8. Give it **Make changes to events** permission
9. Click **Send**

## Testing the Setup

### Test 1: Check Environment Variables

Run this in your terminal:

```powershell
# Check if variables are set (without revealing values)
node -e "console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Set ✓' : 'Not Set ✗'); console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Set ✓' : 'Not Set ✗');"
```

### Test 2: Create a Test Subscription

1. Start your dev server: `pnpm dev`
2. Navigate to the Subscriptions page
3. Click "Add Subscription"
4. Fill in the form
5. ✅ Check "Sync to Google Calendar"
6. Submit

**Check the browser console for:**
- ✅ `"DIALOG (Subscription): Attempting calendar sync..."`
- ✅ `"DIALOG (Subscription): All notifications processed"`

**Check your Google Calendar:**
- You should see a new event created!

## Troubleshooting

### Error: "Calendar sync is not configured"

**Solution:** Environment variables are missing. Check `.env.local` exists and has all Google variables.

### Error: "DECODER routines::unsupported"

**Solution:** ✅ Already fixed! The code now handles base64 and PEM formats automatically.

### Error: "Insufficient Permission"

**Solution:** 
1. Make sure you've shared your calendar with the service account email
2. Give it "Make changes to events" permission
3. Make sure Google Calendar API is enabled in Google Cloud Console

### Error: "Calendar event creation returned null"

**Solution:**
1. Check the service account has access to the calendar
2. Verify the calendar ID is correct (usually "primary" for your main calendar)
3. Check Google Cloud Console for API usage limits

### Calendar Events Not Appearing

**Possible causes:**
1. Wrong calendar ID - change `GOOGLE_CALENDAR_ID` to `primary`
2. Service account doesn't have access - share your calendar with it
3. Timezone issues - events might be created in a different timezone

**Debug steps:**
1. Check browser console for calendar sync logs
2. Check server logs for "Calendar sync error"
3. Go to Google Calendar settings and check "Events from Gmail"
4. Try creating a test event manually with the service account

## Code Changes Made

### ✅ Fixed: `lib/google-calendar.ts`

Added automatic base64 decoding:
- Detects if private key is base64 encoded
- Automatically decodes it to PEM format
- Validates configuration before creating client
- Better error messages

### ✅ Fixed: `app/api/calendar/sync/route.ts`

Improved error handling:
- Checks if Google Calendar is configured before attempting sync
- Returns soft errors (200 status) to avoid breaking user flow
- Better error messages for debugging
- Calendar sync failures won't block subscription/goal creation

## Environment Variable Format Reference

### Format 1: Base64 Encoded (Current)
```env
GOOGLE_PRIVATE_KEY="LS0tLS1CRUdJTi..." # Base64 string
```

### Format 2: PEM Format (Alternative)
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIB...\n-----END PRIVATE KEY-----\n"
```

**Both formats now work!** The code automatically detects and handles both.

## Next Steps

1. ✅ Code is fixed to handle base64 keys
2. 🔄 Restart your dev server
3. ✅ Test creating a subscription with calendar sync enabled
4. ✅ Check Google Calendar for the event
5. 🎉 Enjoy automated calendar reminders!

---

**Need Help?** Check the browser console and server logs for detailed error messages.

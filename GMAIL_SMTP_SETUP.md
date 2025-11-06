# Gmail SMTP Fallback Setup Guide

## Overview

This application uses SendPulse as the primary email service. If SendPulse fails (due to API errors, rate limits, or service downtime), the system automatically falls back to Gmail SMTP to ensure email delivery.

## Prerequisites

- A Gmail account
- Two-factor authentication (2FA) enabled on your Google account

## Setup Instructions

### Step 1: Enable Two-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2FA if not already enabled

### Step 2: Generate App Password

1. Visit: https://myaccount.google.com/apppasswords
2. Sign in if prompted
3. Under "App passwords", select:
   - **App**: Choose "Mail"
   - **Device**: Choose "Other (Custom name)" and enter "BudgetBot"
4. Click **Generate**
5. Copy the **16-character password** (it will be shown as: `xxxx xxxx xxxx xxxx`)

### Step 3: Configure Environment Variables

Add the following to your `.env` or `.env.local` file:

```bash
# Gmail SMTP Fallback Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx  # 16-character password (no spaces)
```

**Important:** 
- Use your full Gmail address for `GMAIL_USER`
- Remove all spaces from the app password when copying it to `GMAIL_APP_PASSWORD`
- Keep these credentials secure and never commit them to version control

### Step 4: Verify Configuration

The application will automatically use Gmail SMTP when:
1. SendPulse API authentication fails
2. SendPulse API returns an error response
3. SendPulse rate limits are exceeded
4. SendPulse service is unavailable

You can test the fallback by checking the console logs. When fallback occurs, you'll see:
```
SendPulse failed, attempting Gmail SMTP fallback...
```

## Email Sending Flow

```
┌─────────────────┐
│  Send Email     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SendPulse API │◄─── Primary Service
└────────┬────────┘
         │
         │ ✅ Success → Email Sent
         │
         │ ❌ Failed/Error
         ▼
┌─────────────────┐
│  Gmail SMTP     │◄─── Fallback Service
└────────┬────────┘
         │
         ▼
   ✅ Email Sent
```

## Troubleshooting

### "Authentication failed" errors

**Solution:**
- Verify your Gmail address is correct
- Ensure you're using an **App Password**, not your regular Gmail password
- Re-generate the app password if needed
- Check that 2FA is enabled on your Google account

### "Connection timeout" errors

**Solution:**
- Check your internet connection
- Verify firewall settings allow SMTP connections (port 587)
- Try using a different network if behind corporate firewall

### "Invalid credentials" errors

**Solution:**
- Ensure there are no spaces in your app password in `.env`
- Verify the app password hasn't been revoked at https://myaccount.google.com/apppasswords
- Check that `GMAIL_USER` matches the Google account that generated the app password

### Gmail not receiving fallback emails

**Check:**
1. SendPulse configuration - ensure SendPulse credentials are intentionally invalid to trigger fallback
2. Application logs for error messages
3. Gmail spam/junk folder
4. Google account security alerts for blocked sign-in attempts

## Security Best Practices

1. **Never share your app password** - It has full access to your Gmail account
2. **Rotate passwords regularly** - Generate new app passwords every 6-12 months
3. **Use environment variables** - Never hardcode credentials in source code
4. **Revoke unused passwords** - Delete old app passwords at https://myaccount.google.com/apppasswords
5. **Monitor account activity** - Check https://myaccount.google.com/device-activity regularly

## Rate Limits

Gmail SMTP has the following sending limits:

- **Personal Gmail accounts**: 500 emails/day
- **Google Workspace accounts**: 2,000 emails/day

The application does not implement rate limiting for Gmail SMTP, so ensure your email volume stays within these limits.

## Technical Details

### SMTP Configuration
- **Host**: smtp.gmail.com
- **Port**: 587 (TLS/STARTTLS)
- **Authentication**: OAuth2 via App Passwords
- **Encryption**: TLS

### Files
- **Implementation**: `lib/gmail-smtp.ts`
- **Integration**: `lib/sendpulse.tsx`
- **Configuration**: `.env.local` or `.env`

### Fallback Logic
The fallback is triggered in two scenarios:
1. **SendPulse API returns failure** - When `response.ok && result.result` is false
2. **SendPulse throws an exception** - Network errors, authentication failures, etc.

Both scenarios automatically attempt Gmail SMTP delivery without user intervention.

## Support

For issues with:
- **Gmail SMTP**: Contact Google Support or check https://support.google.com/mail
- **SendPulse**: Contact SendPulse support or check https://sendpulse.com/support
- **BudgetBot application**: Check application logs and error messages

## Additional Resources

- [Google App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [SendPulse API Documentation](https://sendpulse.com/api)

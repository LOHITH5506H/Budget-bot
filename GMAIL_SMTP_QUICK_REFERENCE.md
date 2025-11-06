# Gmail SMTP Fallback - Quick Reference

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

### 2. Generate Gmail App Password
1. Visit: https://myaccount.google.com/apppasswords
2. Select: Mail → Other (BudgetBot) → Generate
3. Copy 16-character password

### 3. Configure Environment
Add to `.env.local`:
```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### 4. Done! ✅
Fallback activates automatically when SendPulse fails.

---

## 📁 Files Changed

| File | Purpose |
|------|---------|
| `lib/gmail-smtp.ts` | Gmail SMTP client implementation |
| `lib/sendpulse.tsx` | Modified `sendEmail()` with fallback logic |
| `.env.example` | Added `GMAIL_USER` and `GMAIL_APP_PASSWORD` |

---

## 🔄 How It Works

```
SendPulse API → ✅ Success → Email Sent
                ❌ Failure → Gmail SMTP → Email Sent
```

**Triggers:**
- SendPulse API error response
- SendPulse authentication failure
- SendPulse network timeout
- SendPulse rate limit exceeded

---

## 🧪 Test Fallback

### Option 1: Invalid SendPulse Credentials
```bash
# In .env.local
SENDPULSE_API_USER_ID=invalid
SENDPULSE_API_SECRET=invalid
```

### Option 2: Check Logs
```
SendPulse failed, attempting Gmail SMTP fallback...
✓ Gmail SMTP: Email sent successfully
```

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| "Authentication failed" | Regenerate App Password |
| "Invalid credentials" | Remove spaces from password |
| "Connection timeout" | Check firewall/network |
| Not receiving emails | Check spam folder |

---

## 🔒 Security Checklist

- ✅ App Password generated (not regular password)
- ✅ 2FA enabled on Google account
- ✅ Credentials in `.env.local` (not `.env.example`)
- ✅ `.env.local` in `.gitignore`
- ✅ Different passwords for dev/prod

---

## 📊 Rate Limits

| Account Type | Daily Limit |
|--------------|-------------|
| Personal Gmail | 500 emails/day |
| Google Workspace | 2,000 emails/day |

---

## 📚 Documentation

- **Full Setup**: `GMAIL_SMTP_SETUP.md`
- **Implementation Summary**: `GMAIL_SMTP_FALLBACK_SUMMARY.md`
- **Code**: `lib/gmail-smtp.ts`

---

## 🆘 Support Links

- [Google App Passwords](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Nodemailer Docs](https://nodemailer.com/about/)

---

## ✨ What's New

✅ Gmail SMTP fallback implementation
✅ Automatic failover when SendPulse fails
✅ No code changes needed in email sending logic
✅ Environment variable configuration
✅ Comprehensive documentation

# Weekly PDF Report Setup Guide

## 🎯 Overview

Your BudgetBot now has **automated weekly PDF reports** that are:
- 📊 **Generated automatically** every Sunday at 9 AM
- 📧 **Emailed to all users** with their expense data
- 📥 **Downloadable on-demand** from the dashboard
- 🔒 **Secure** with token-based authentication

---

## ✨ Features

### Manual Generation (Dashboard)
- Click "Generate Report" button on dashboard
- Instantly downloads a PDF with:
  - Last 7 days of expenses
  - Total spending breakdown (Needs vs Wants)
  - Category-wise analysis
  - Active savings goals with progress
  - Active subscriptions list
  - Beautiful charts and visualizations

### Automated Weekly Reports (EasyCron)
- Runs every **Sunday at 9:00 AM**
- Generates PDF for **all active users**
- Emails report as attachment
- Includes summary in email body

---

## 🚀 Quick Start - Dashboard Button

The "Generate Report" button is already added to your dashboard!

1. Go to **Dashboard** (`/dashboard`)
2. Look for the **"Weekly Report"** widget in the right column
3. Click **"Generate Report"** button
4. PDF downloads automatically

**No setup needed!** The button works immediately.

---

## 🔧 EasyCron Setup (Automated Weekly Reports)

### Step 1: Get Your API Token

Your EasyCron API token is already in `.env.local`:
```bash
EASYCRON_API_TOKEN=your_easycron_api_token_here
```

### Step 2: Create the Cron Job

#### Using EasyCron API:

```bash
curl -X POST "https://www.easycron.com/rest/add" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_EASYCRON_API_TOKEN",
    "cron_expression": "0 9 * * 0",
    "url": "https://your-domain.vercel.app/api/cron/weekly-report",
    "http_method": "POST",
    "http_headers": "Authorization: Bearer YOUR_EASYCRON_API_TOKEN",
    "cron_job_name": "BudgetBot Weekly Reports",
    "notify_email": "your-email@example.com",
    "notify_on_failure": 1
  }'
```

#### Using EasyCron Dashboard:

1. **Login to EasyCron**: https://www.easycron.com/user/login
2. **Click "Add Cron Job"**
3. **Fill in the details**:
   - **Cron Name**: `BudgetBot Weekly Reports`
   - **URL**: `https://your-domain.vercel.app/api/cron/weekly-report`
   - **Cron Expression**: `0 9 * * 0` (Every Sunday at 9 AM)
   - **HTTP Method**: `POST`
   - **HTTP Headers**:
     ```
     Authorization: Bearer YOUR_EASYCRON_API_TOKEN
     Content-Type: application/json
     ```
   - **Timezone**: Select your timezone
   - **Notify on Failure**: ✅ Enable
   - **Notification Email**: Your email

4. **Click "Create Cron Job"**

### Step 3: Test the Cron Job

#### Test via curl:
```bash
curl -X POST "https://your-domain.vercel.app/api/cron/weekly-report" \
  -H "Authorization: Bearer YOUR_EASYCRON_API_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "message": "Weekly reports processed",
  "total": 5,
  "success": 5,
  "failed": 0,
  "successEmails": ["user1@example.com", "user2@example.com"],
  "failedEmails": []
}
```

#### Test via EasyCron Dashboard:
1. Go to your cron job
2. Click **"Execute Now"**
3. Check the execution log

---

## 📋 API Endpoints

### 1. Manual Report Generation (Dashboard)

**Endpoint**: `POST /api/reports/generate-weekly`

**Authentication**: Requires user session (automatic)

**Response**: PDF file download

**Example**:
```javascript
const response = await fetch('/api/reports/generate-weekly', {
  method: 'POST'
});
const blob = await response.blob();
// Download the blob as PDF
```

---

### 2. Automated Report Generation (Cron)

**Endpoint**: `POST /api/cron/weekly-report`

**Authentication**: Bearer token (EasyCron API token)

**Headers**:
```
Authorization: Bearer YOUR_EASYCRON_API_TOKEN
Content-Type: application/json
```

**Response**:
```json
{
  "message": "Weekly reports processed",
  "total": 10,
  "success": 9,
  "failed": 1,
  "successEmails": ["user1@example.com", ...],
  "failedEmails": ["user10@example.com"]
}
```

---

## 🔒 Security

### Token Validation
- The cron endpoint validates the EasyCron token
- Only requests with correct token are processed
- Invalid tokens return 401 Unauthorized

### User Privacy
- Each user receives only their own data
- PDFs are generated per-user
- No data is shared between users

---

## 📊 Report Contents

Each PDF report includes:

### Summary Cards
- 💰 **Total Expenses** (last 7 days)
- ✅ **Needs** (essential spending)
- 🎁 **Wants** (non-essential spending)
- 📊 **Average per Transaction**

### Detailed Sections
1. **Recent Expenses Table**
   - Date, Description, Category, Type, Amount
   - Sorted by date (newest first)

2. **Category Breakdown**
   - Visual breakdown with percentages
   - Top spending categories highlighted

3. **Active Savings Goals**
   - Progress bars for each goal
   - Current vs target amounts
   - Percentage completion

4. **Active Subscriptions**
   - Service name, amount, billing cycle
   - Next due date

---

## 🐛 Troubleshooting

### Issue: No PDF is generated from dashboard

**Solution**:
1. Check browser console for errors
2. Verify you're logged in
3. Check that Puppeteer is installed: `pnpm list puppeteer`
4. Check server logs for error details

### Issue: Cron job fails with 401

**Solution**:
1. Verify `EASYCRON_API_TOKEN` in `.env.local`
2. Check Authorization header format: `Bearer YOUR_TOKEN`
3. Ensure token matches in both EasyCron and `.env.local`

### Issue: Emails not being sent

**Solution**:
1. Check SendPulse credentials in `.env.local`
2. Verify Gmail SMTP fallback is configured
3. Check server logs for email sending errors
4. Verify users have valid email addresses

### Issue: PDF generation is slow

**Solution**:
1. This is normal - Puppeteer takes 3-10 seconds
2. Add loading indicator (already implemented)
3. For cron jobs, increase timeout if needed

---

## 🎨 Customization

### Change Report Frequency

Edit the cron expression in EasyCron:

- **Daily**: `0 9 * * *` (Every day at 9 AM)
- **Weekly (Sunday)**: `0 9 * * 0` (Every Sunday at 9 AM)
- **Weekly (Monday)**: `0 9 * * 1` (Every Monday at 9 AM)
- **Monthly**: `0 9 1 * *` (1st of each month at 9 AM)

### Customize Email Template

Edit `app/api/cron/weekly-report/route.ts`:

```typescript
const emailBody = `
  <h2>Hi ${user.display_name}!</h2>
  <p>Your custom message here...</p>
`;
```

### Customize PDF Design

Edit `lib/pdf-generator.ts` in the `generateReportHTML()` method.

---

## 📈 Monitoring

### Check Cron Execution Logs

1. Login to EasyCron dashboard
2. Go to **"Cron Job Logs"**
3. View execution history, success/failure rates

### Check Application Logs

Look for these log messages:

```
✅ Success:
📊 [Weekly Report] Starting PDF generation...
✅ [Weekly Report] User authenticated: user@example.com
📄 [Weekly Report] Generating PDF for user: user-id
✅ [Weekly Report] PDF generated successfully (12345 bytes)

❌ Errors:
❌ [Weekly Report] Authentication failed
❌ [Weekly Report] Error generating PDF
❌ [Cron: Weekly Report] Failed for user@example.com
```

---

## 💡 Best Practices

1. **Test before deploying**: Use the manual button first
2. **Monitor initial runs**: Watch the first few cron executions
3. **Set up failure alerts**: Enable email notifications in EasyCron
4. **Keep tokens secure**: Never commit tokens to git
5. **Rate limiting**: Add delays between user processing (already implemented)

---

## 🚀 Production Deployment

### Environment Variables Required

```bash
# Required for PDF generation
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Required for cron authentication
EASYCRON_API_TOKEN=your_easycron_token

# Required for email delivery
SENDPULSE_API_USER_ID=your_sendpulse_user_id
SENDPULSE_API_SECRET=your_sendpulse_secret

# Optional: Email fallback
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### Vercel Configuration

Already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/schedule",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Note**: For the weekly report, use EasyCron instead of Vercel Cron (more reliable for long-running tasks).

---

## ✅ Success Checklist

- [ ] Dashboard button visible and working
- [ ] Manual PDF generation downloads successfully
- [ ] PDF contains accurate data (expenses, goals, subscriptions)
- [ ] EasyCron job created and scheduled
- [ ] Test cron execution successful
- [ ] Email delivery confirmed
- [ ] Email contains PDF attachment
- [ ] Failure notifications configured
- [ ] Monitoring set up

---

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Review server logs
3. Test manually via dashboard button
4. Check EasyCron execution logs
5. Verify all environment variables

---

## 🎉 You're All Set!

Your weekly PDF reports are now:
- ✅ Available on-demand from dashboard
- ✅ Automatically generated every Sunday
- ✅ Emailed to all users
- ✅ Secured with token authentication

Enjoy your automated expense tracking! 📊💪

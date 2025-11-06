# 🚀 Deploy Budget-bot to Vercel

## Prerequisites Checklist

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Vercel account (free - sign up at https://vercel.com)
- ✅ Code committed to GitHub repository
- ✅ All environment variables documented

---

## Step-by-Step Deployment Guide

### **Step 1: Install Vercel CLI** (Optional but recommended)

```powershell
npm install -g vercel
```

Then login:
```powershell
vercel login
```

---

### **Step 2A: Deploy via Vercel Dashboard (Easiest)**

1. **Go to**: https://vercel.com/new

2. **Import Git Repository**:
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose your GitHub account
   - Select: `LOHITH5506H/Budget-bot`

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

4. **Add Environment Variables** (CRITICAL):
   Click "Environment Variables" and add ALL of these:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://wxuczcavdforvdbqcrqo.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dWN6Y2F2ZGZvcnZkYnFjcnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTEwNDgsImV4cCI6MjA3MzI2NzA0OH0.V_uwml66W7aCtu1-5o2OK2WXFE5mOoduONd9gzvoR9k
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dWN6Y2F2ZGZvcnZkYnFjcnFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MTA0OCwiZXhwIjoyMDczMjY3MDQ4fQ.zEzXtXiCIGO3yD6hCQCZiWiPIPue-NM4s56e77pLlNo
   SUPABASE_URL=https://wxuczcavdforvdbqcrqo.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dWN6Y2F2ZGZvcnZkYnFjcnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTEwNDgsImV4cCI6MjA3MzI2NzA0OH0.V_uwml66W7aCtu1-5o2OK2WXFE5mOoduONd9gzvoR9k

   # Google Calendar (Optional - for old API, not needed anymore)
   GOOGLE_PROJECT_ID=budgetbot-471917
   GOOGLE_PRIVATE_KEY_ID=6b38080e509162c00008c8a44312da7a56298586
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCkdiKH2qzvGEq9\noUBTGtrNnnUxUUadgqCe0HQZLGDl4kbuk8NdCia3ow20A3caDfU7Fk3ZOFBQaLGe\n5JDtlbe6MMODQueUet72tN18aQVC6IfYgvvFE9x3v+gRbkIkphi+7lm9qH2FMrF5\nkHDSR0Cfiu79NiTRcteqn0TJk0EZ4gF+/bn4MPYvt4IwIkyAoki6VyrgUarSK1pC\nA7K5fnGwOimnM0lh88h5aNp7+KozvrZsLLvHdsT2U3fKl+nmiV06z+4HyE4F0YL1\nCNLkf2Hjpa5GhQiytvyRnGJsueI17XwjuwlBjX+eofTa9BMLJM90vy0K3QFzKEeW\nOLHbYQLLAgMBAAECggEATiH/yro1wYuxaoDy3eiavehDtg/udANsyravCYyfZmfH\nmi3iOVAKz+CrsHObAGpUMOOqTYInCeSLSjk9r1obRN5I7JH7EnwDdIK93Q7J3J07\neL3V3i3O5qdqGenfi6jLhd4YDXZAV+kbDu1z5DrMtV9cpji0ajtcwadUF04ZtjD5\nVpvGe+JLXXE9+0ADYTzpbV9W9aYr/xkmNXXLqcDppDu2oIYxyb1bw9e0cGzGHgBt\nJa01KzHCOoH7BbQd2aVXu7Qajl67rfLp74N/ujCMjHI6uJPWRVZIJD9qLU8tve3J\neoEDaEaKQ2TKdmHqsOg3WtPEuklQn8KasYIZw6AmPQKBgQDcy6pYWKkxqAwxlpiX\nZKwS5WvLSFuljx/CiNHMCnYdHy9uCMUKBI4dKkjZDD8RuHaswy/96Fnlp+PVVa39\nd56dR8cAg8EEzPJYKLVRya+Y5mvI47MOcYc333QZBxjMXtg6kRews1PDZ3fkQyx1\ndaDv02OCUrmjWCteabg5O8F5jQKBgQC+rwyc3L3lYSfnxIkbLkUhBfZToFrPbvuu\nKjEKd0xZRtJtzX7dsM0afbpwghAL/OLrugMrJgRSWBVArG2sqhcNNli98ElspUvQ\nt5YfQofNdC1vHMFBR7Ca6Szd9wBw5SzuuWnnG8DfrqKuM46gnYdCSHrgqxbbvjUk\ncCBcStZbtwKBgQCLSs13mM98rTisHAa+E9veu++qOkbfBpERyAEbCUqEisUAVPYB\noOgLDD8S9v/e7RGpYiYnt+rm0GkSkFAIxOtC7CJmd7hQj/8fkOb65xMpkcxT2xp+\nNS8KF6WFmI2TeQ5OvHRGnItujhr73Ujx/Th/tEtlz0yf+SK7GFUJfmJLjQKBgC0o\nBzSekdngSDL6t/1X18caQltLfjXhcnisRTDVT59UxkB6ibC2TdwYKi66nlI4cQSh\n6F4vgpZ9hYrrSo25OfxHAnz4imrQOkQTNdnxR3fAK4JErP9omsoUriticxhJLXrb\nLdktGV/fW2cljoE6zO1FfNP3sFIZmTwn0YIJtvnBAoGBAI+X88Wxyyk7cXIY7f8m\nOpWORbZ/kuc9MHONwVNGx2DA7T0nw+/kwOpfnxW9Kw5uCYAdhLC9ydJEh2xil6B8\nUvksLmtjWIs3PM7OMcM2tXf/LmptUQC8W/jlPq5PrJzEGEQAHE1o+o80gwxFAdlf\n5yYFDiOnsphuddzuJz3BYTZN\n-----END PRIVATE KEY-----\n
   GOOGLE_CLIENT_EMAIL=calender-sync-service@budgetbot-471917.iam.gserviceaccount.com
   GOOGLE_CLIENT_ID=102870043926361632664
   GOOGLE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/calender-sync-service%40budgetbot-471917.iam.gserviceaccount.com

   # SendPulse
   SENDPULSE_USER_ID=2ddf80913d1cc0a741ae6d58814ecfc5
   SENDPULSE_SECRET=a5d000d40019af863a62b48f2500ffc7

   # Gemini AI
   GEMINI_API_KEY=AIzaSyDHzetArhjBPBvQwpkZffwRLkMMz9LX-zE

   # Cron Security
   CRON_SECRET=fs3QCnhxv0igLzaYFAn8CWnPOUOgw8QWNutt0_cJZKI

   # EasyCron
   EASYCRON_API_TOKEN=e4a7f86c8d21c7ed743524ba55d73160

   # Logo.dev
   LOGO_DEV_API_KEY=pk_f8AWX4_wTpmKOKPcrBwljA

   # Pusher
   NEXT_PUBLIC_PUSHER_APP_KEY=e7854c132a2dc41c98d2
   PUSHER_APP_ID=2072344
   PUSHER_SECRET=14987a4d8b7218648cb7
   NEXT_PUBLIC_PUSHER_CLUSTER=ap2

   # Environment
   NODE_ENV=production
   ```

5. **Click "Deploy"**

---

### **Step 2B: Deploy via CLI** (Alternative)

```powershell
# Navigate to project
cd E:\PROJECTS\Budget-bot

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? budget-bot (or your choice)
# - Directory? ./
# - Override settings? No
```

Then add environment variables:
```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all env vars one by one
```

---

### **Step 3: Update Supabase Redirect URLs**

After deployment, you'll get a URL like: `https://budget-bot.vercel.app`

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `wxuczcavdforvdbqcrqo`
3. Go to **Authentication → URL Configuration**
4. Add to **Redirect URLs**:
   ```
   https://your-vercel-url.vercel.app/auth/callback
   https://your-vercel-url.vercel.app
   ```
5. Add to **Site URL**:
   ```
   https://your-vercel-url.vercel.app
   ```

---

### **Step 4: Verify Deployment**

1. Visit your Vercel URL
2. Check deployment logs in Vercel Dashboard
3. Test login functionality
4. Verify database connections work

---

## Important Notes

### **Puppeteer on Vercel**

Puppeteer (for PDF generation) has size limits on Vercel. You have two options:

#### Option 1: Use chrome-aws-lambda (Already installed)
This is lighter and works on Vercel. Your `package.json` already has it.

#### Option 2: Disable PDF generation temporarily
If PDF reports fail, they'll gracefully error without breaking the app.

---

### **Cron Jobs on Vercel**

Your `vercel.json` already configures:
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

This runs daily at 9 AM UTC.

**Note**: Cron jobs require **Vercel Pro plan** ($20/month) or use external service like EasyCron (you already have this configured).

---

## Post-Deployment Checklist

- [ ] Environment variables added to Vercel
- [ ] Supabase redirect URLs updated
- [ ] Site loads successfully
- [ ] Login/signup works
- [ ] Database queries work
- [ ] AI insights load
- [ ] Pusher real-time updates work
- [ ] Custom domain added (optional)

---

## Custom Domain (Optional)

1. Go to your Vercel project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Monitoring & Analytics

Vercel automatically provides:
- **Analytics**: Built-in web analytics
- **Logs**: Real-time function logs
- **Error tracking**: Runtime error reports
- **Performance metrics**: Core Web Vitals

Access via: https://vercel.com/dashboard → Your Project → Analytics

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies in `package.json`
- Verify environment variables are set

### Environment Variables Not Working
- Redeploy after adding env vars
- Use `NEXT_PUBLIC_` prefix for client-side vars
- Check variable names match exactly

### Database Connection Fails
- Verify Supabase keys are correct
- Check Supabase project is not paused
- Ensure Vercel IPs aren't blocked

### PDF Generation Fails
- Expected on free plan (function timeout)
- Consider upgrading or using external service
- Chrome-aws-lambda should help

---

## Cost Breakdown

### Vercel Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions
- ❌ No cron jobs
- ❌ Limited function execution time (10s)

### Vercel Pro ($20/month)
- ✅ Everything in Free
- ✅ Cron jobs
- ✅ 60s function timeout
- ✅ Advanced analytics
- ✅ Password protection

---

## Next Steps

1. **Deploy now** using Step 2A or 2B above
2. **Test thoroughly** after deployment
3. **Monitor** using Vercel dashboard
4. **Optimize** based on performance metrics

Your app is **ready to deploy**! 🚀

---

**Deployment Time**: ~5-10 minutes
**Status**: Ready ✅

Last Updated: November 6, 2025

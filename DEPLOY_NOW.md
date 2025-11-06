# 🚀 Quick Deploy to Vercel - Commands

## Step 1: Commit Your Changes to GitHub

```powershell
# Add all changes
git add .

# Commit with message
git commit -m "feat: performance optimizations and calendar integration updates"

# Push to GitHub
git push origin karthik
```

---

## Step 2: Deploy to Vercel (Choose One Method)

### **Method A: Via Vercel Website** (Easiest - Recommended)

1. Go to: **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select: **LOHITH5506H/Budget-bot**
4. Branch: **karthik**
5. Add all environment variables from `.env.local`
6. Click **"Deploy"**

✅ **Done!** Your site will be live in ~2 minutes

---

### **Method B: Via Vercel CLI** (For developers)

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
cd E:\PROJECTS\Budget-bot
vercel

# For production deployment
vercel --prod
```

---

## Step 3: Add Environment Variables

### **Via Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Copy ALL values from your `.env.local` file
5. Click **"Save"**
6. **Redeploy** if already deployed

### **Via CLI:**

```powershell
# Add each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GEMINI_API_KEY production
# ... continue for all vars
```

---

## Step 4: Update Supabase Settings

After deployment, update these URLs:

1. **Supabase Dashboard**: https://supabase.com/dashboard
2. Go to **Authentication → URL Configuration**
3. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## Complete Command Sequence

```powershell
# 1. Stage all changes
git add .

# 2. Commit
git commit -m "feat: add performance improvements and vercel deployment config"

# 3. Push to GitHub
git push origin karthik

# 4. Deploy to Vercel (if using CLI)
vercel --prod

# 5. Open browser to add env vars
start https://vercel.com/dashboard
```

---

## Environment Variables to Add

Copy these from your `.env.local` file:

**Required** (Must have):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Recommended** (For full features):
- `GEMINI_API_KEY` (AI insights)
- `SENDPULSE_USER_ID` (Email notifications)
- `SENDPULSE_SECRET`
- `NEXT_PUBLIC_PUSHER_APP_KEY` (Real-time updates)
- `PUSHER_APP_ID`
- `PUSHER_SECRET`
- `NEXT_PUBLIC_PUSHER_CLUSTER`
- `LOGO_DEV_API_KEY` (Logo fetching)

**Optional** (Can skip for now):
- Google Calendar variables (old API, not used anymore)
- `EASYCRON_API_TOKEN`
- `CRON_SECRET`
- `PUPPETEER_EXECUTABLE_PATH` (not needed on Vercel)

---

## Verify Deployment

After deployment:

1. ✅ Visit your Vercel URL
2. ✅ Test login/signup
3. ✅ Create a subscription
4. ✅ Check dashboard loads
5. ✅ Verify AI insights work

---

## Troubleshooting

### **Build Failed?**
```powershell
# Run build locally first
npm run build

# Fix any errors, then commit & redeploy
```

### **Environment Variables Missing?**
- Must start with `NEXT_PUBLIC_` for client-side vars
- Redeploy after adding env vars
- Check spelling matches exactly

### **Site Not Loading?**
- Check build logs in Vercel dashboard
- Verify Supabase connection
- Check browser console for errors

---

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repo**: https://github.com/LOHITH5506H/Budget-bot

---

## Time Estimate

- Commit & Push: **1 minute**
- Vercel Setup: **3 minutes**
- Add Env Vars: **5 minutes**
- First Deploy: **2-3 minutes**
- **Total**: ~10-15 minutes

---

**Ready to deploy?** Run the commands above! 🚀

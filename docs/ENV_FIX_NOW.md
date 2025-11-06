# FIX YOUR .ENV.LOCAL FILE

## 🚨 IMMEDIATE ACTION REQUIRED

Open your `.env.local` file and make this ONE critical change:

### Line 27 - WRONG:
```env
GOOGLE_CALENDAR_ID=https://calendar.google.com/calendar/embed?src=gurukarthikeya05%40gmail.com&ctz=UTC
```

### Line 27 - CORRECT:
```env
GOOGLE_CALENDAR_ID=gurukarthikeya05@gmail.com
```

## Then:
1. Save the file
2. Restart your server: `pnpm dev`
3. Share your calendar with: `calender-sync-service@budgetbot-471917.iam.gserviceaccount.com`

See `CALENDAR_NOT_SHOWING_FIX.md` for complete instructions!

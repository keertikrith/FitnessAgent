# 🚀 QUICK REFERENCE CARD

## Deployment in 30 Seconds

```
1. git add . && git commit -m "checkins" && git push
2. Go to vercel.com → auto-deploys → copy URL
3. Vercel dashboard → Settings → Add env vars (CHECKIN_USER_PHONE, etc)
4. GitHub → Settings → Secrets → Add CHECKIN_BASE_URL=https://your-url
5. GitHub → Actions → Run workflow → Check WhatsApp
```

## Daily Schedule

```
 9:00 AM  ┌─────────────────────────────┐
          │ Check-in: "What did you eat?"│
          └─────────────────────────────┘
          ↓ (You reply)
          AI parses → Logs to DB

12:00 PM  ┌─────────────────────────────┐
          │ Check-in: Midday checkpoint │
          └─────────────────────────────┘

 3:00 PM  ┌─────────────────────────────┐
          │ Check-in: Afternoon check   │
          └─────────────────────────────┘

 6:00 PM  ┌─────────────────────────────┐
          │ Check-in: Evening check     │
          └─────────────────────────────┘

 9:00 PM  ┌─────────────────────────────┐
          │ Check-in: Final check       │
          └─────────────────────────────┘

10:00 PM  ┌─────────────────────────────┐
          │ 📊 DAILY REPORT             │
          │ • 1800 cal eaten            │
          │ • 2500 cal burned           │
          │ • 700 cal deficit ✅        │
          │ • 1 workout, 2 reads        │
          │ • 3 meals logged            │
          │ • Keep crushing it! 💪      │
          └─────────────────────────────┘
```

## Environment Variables (Copy/Paste)

```
CHECKIN_USER_PHONE=whatsapp:+1234567890
CHECKIN_USER_ID=user-id-or-blank
CHECKIN_TIMEZONE=UTC
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM=whatsapp:+14155552671
WHATSAPP_TO=+1234567890
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=xxxxx
```

## Cron Schedule (UTC)

```
0 9  * * *   → 9am UTC
0 12 * * *   → 12pm UTC
0 15 * * *   → 3pm UTC
0 18 * * *   → 6pm UTC
0 21 * * *   → 9pm UTC
0 22 * * *   → 10pm UTC (report)
```

## Timezone Conversions

```
If you want 9am local time:

EST (UTC-5):    Set to America/New_York, GitHub sends at 2pm UTC
PST (UTC-8):    Set to America/Los_Angeles, GitHub sends at 5pm UTC
GMT (UTC+0):    Set to Europe/London, GitHub sends at 9am UTC
IST (UTC+5:30): Set to Asia/Kolkata, GitHub sends at 3:30am UTC
AEST (UTC+10):  Set to Australia/Sydney, GitHub sends at 11pm prev UTC
```

## Files Changed

```
✏️  app/api/whatsapp/checkin/route.ts
    └─ Now: 9, 12, 15, 18, 21 (was: every hour)

✨  app/api/whatsapp/checkin/report/route.ts (NEW)
    └─ Sends daily summary at 10pm

✏️  .github/workflows/send_checkins.yml
    └─ Now: 6 cron jobs (was: 1 hourly job)
```

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel auto-deployed (check dashboard)
- [ ] Env vars added to Vercel
- [ ] `CHECKIN_BASE_URL` secret added to GitHub
- [ ] Manual workflow trigger succeeds
- [ ] WhatsApp message received
- [ ] Supabase `ai_checkins` shows new records
- [ ] Reply on WhatsApp
- [ ] Dashboard shows updated data
- [ ] 10pm report arrives

## Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| "CHECKIN_BASE_URL secret not set" | Add secret to GitHub |
| Message not arriving | Check time is 9,12,15,18,21,22 UTC |
| Workflow runs but no WhatsApp | Check Twilio dashboard for errors |
| "not a check-in time" | Correct! Only sends at scheduled hours |
| Vercel env vars not working | Wait 30s, check is production env selected |
| Dashboard blank | Check userId matches in database |

## Cost

```
$0/month guaranteed

Breakdown:
├─ GitHub Actions: $0 (free for public repos)
├─ Vercel: $0 (free tier)
├─ Supabase: $0 (free tier)
├─ Twilio sandbox: $0 (free for testing)
└─ Google Generative AI: $0 (free tier)
```

## Test Commands

```bash
# Local test
npm run dev
curl -X POST http://localhost:3000/api/whatsapp/checkin -d '{}'

# Production test
curl -X POST https://your-vercel-app.vercel.app/api/whatsapp/checkin -d '{}'

# Check Supabase
SELECT * FROM ai_checkins ORDER BY created_at DESC LIMIT 5;
```

## Key Endpoints

| Endpoint | Method | Trigger |
|----------|--------|---------|
| `/api/whatsapp/checkin` | POST | 9am, 12pm, 3pm, 6pm, 9pm |
| `/api/whatsapp/checkin/report` | POST | 10pm only |
| `/api/whatsapp/webhook` | POST | User replies (Twilio hook) |
| `/api/whatsapp/checkin/summary` | GET | Dashboard queries |
| `/api/log/delete` | POST | Delete meals/habits |
| `/api/log/daily-burn` | POST | Log calories burned |

## Documentation Map

```
You are here
    ↓
CHECKIN-README.md (overview)
    ├─ QUICKSTART-CHECKIN.md (quick setup)
    ├─ CHECKIN-DEPLOYMENT.md (detailed steps)
    ├─ ARCHITECTURE.md (system design)
    ├─ IMPLEMENTATION-SUMMARY.md (technical)
    ├─ DEPLOY.sh (all commands)
    └─ THIS FILE (quick reference)
```

## One-Liner Deployment

```bash
git add . && git commit -m "Add 3hr checkins" && git push origin main
```

Then:
1. Vercel dashboard → copy URL
2. Vercel settings → add env vars
3. GitHub secrets → add CHECKIN_BASE_URL
4. GitHub Actions → run workflow
5. ✅ Done!

---

**Questions?** Check the detailed docs in the workspace or run `./DEPLOY.sh`

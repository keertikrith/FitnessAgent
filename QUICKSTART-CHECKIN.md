# 🚀 Quick Start: 3-Hour Check-In Schedule

## What's New

✅ **5 Daily Check-ins** sent at: 9am, 12pm, 3pm, 6pm, 9pm  
✅ **1 Daily Report** at: 10pm with full summary  
✅ **Free Scheduling** via GitHub Actions  
✅ **Free Hosting** via Vercel  
✅ **Total Cost**: $0/month

---

## Deployment (5 Steps, 10 mins)

### 1. Push Code
```bash
git add .
git commit -m "Add 3-hour check-in schedule"
git push origin main
```

### 2. Deploy to Vercel
- Go to https://vercel.com
- Connect your GitHub repo
- Vercel auto-deploys (you'll get a URL like `https://my-app.vercel.app`)
- Copy this URL

### 3. Set Vercel Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:
```
GEMINI_API_KEY=your-key
CHECKIN_USER_ID=user-id-or-leave-blank
CHECKIN_USER_PHONE=whatsapp:+1234567890
CHECKIN_TIMEZONE=UTC (or your timezone, e.g., Asia/Kolkata)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM=whatsapp:+sandbox-number
WHATSAPP_TO=+your-number
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### 4. Add GitHub Secret
- GitHub repo → Settings → Secrets → New secret
- Name: `CHECKIN_BASE_URL`
- Value: `https://my-app.vercel.app` (your Vercel URL)

### 5. Test
- GitHub → Actions → "Send Daily Checkins & Report" → Run workflow
- Should send check-in to WhatsApp
- Or wait for next scheduled time

---

## Testing Locally (Optional)

```bash
npm run dev

# In another terminal:
ngrok http 3000

# Test:
curl -X POST https://abc123.ngrok.io/api/whatsapp/checkin -H "Content-Type: application/json" -d '{}'
```

---

## How It Works

| Time | Action |
|------|--------|
| 9:00 AM | WhatsApp check-in: "Did you eat, workout, read?" |
| 12:00 PM | WhatsApp check-in |
| 3:00 PM | WhatsApp check-in |
| 6:00 PM | WhatsApp check-in |
| 9:00 PM | WhatsApp check-in |
| 10:00 PM | 📊 Daily Report with: calories consumed/burned, habits, deficit calc, motivation |

You reply naturally on WhatsApp → AI parses → logs to dashboard → report summarizes everything.

---

## Files Modified

- ✅ `app/api/whatsapp/checkin/route.ts` - Now only sends at 9, 12, 15, 18, 21
- ✅ `app/api/whatsapp/checkin/report/route.ts` - **NEW** - Sends report at 10pm
- ✅ `.github/workflows/send_checkins.yml` - **NEW** - 6 cron jobs for scheduling
- ✅ `CHECKIN-DEPLOYMENT.md` - Full deployment guide

---

## Timezone Adjustment

GitHub Actions runs on **UTC by default**. If you're in a different timezone:

Set `CHECKIN_TIMEZONE` env var in Vercel:
- `America/New_York` for EST
- `Europe/London` for GMT
- `Asia/Kolkata` for IST
- `America/Los_Angeles` for PST

The app will auto-convert times and only send during allowed hours.

---

## Pricing

| Service | Cost |
|---------|------|
| GitHub Actions | $0 |
| Vercel | $0 |
| Twilio (sandbox) | $0 |
| Google Gemini | Free tier (high usage ~$5-10/mo) |
| Supabase | $0 |
| **Total** | **$0** |

---

## Next: Deploy & Test!

See `CHECKIN-DEPLOYMENT.md` for detailed instructions.

Questions? Check the troubleshooting section in that file.

# Check-In Schedule & Deployment Guide

## Schedule Overview

Your app now sends **5 check-ins daily** at:
- **9:00 AM** - Morning check-in
- **12:00 PM** - Midday check-in
- **3:00 PM** - Afternoon check-in
- **6:00 PM** - Evening check-in
- **9:00 PM** - Night check-in

Plus one **10:00 PM final report** with:
- Total calories consumed & burned
- Daily deficit/surplus calculation
- All habits completed (with counts)
- All meals logged
- Motivational message

## Free Deployment Options

### Option 1: GitHub Actions + Vercel (Recommended, $0/month)

**Why this setup:**
- GitHub Actions: Free for public repos, unlimited compute minutes
- Vercel: Free tier supports Next.js with auto-deployments
- Combined: Completely free, reliable scheduling

**Setup Steps:**

#### 1. Deploy to Vercel (Free)

```bash
# Push your code to GitHub
git add .
git commit -m "Add 3-hour check-in schedule and daily report"
git push origin main

# Go to https://vercel.com and connect your GitHub repo
# Vercel will auto-deploy on every push
```

**Set Vercel Environment Variables:**
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables (visible to all environments):
   - `GEMINI_API_KEY`: Your Google Generative AI key
   - `CHECKIN_USER_ID`: User ID from your Supabase `users` table (or leave blank)
   - `CHECKIN_USER_PHONE`: WhatsApp phone number if not using user ID
   - `CHECKIN_TIMEZONE`: IANA timezone string (e.g., `America/New_York`, `Europe/London`, `Asia/Kolkata`)
   - `TWILIO_ACCOUNT_SID`: From your Twilio dashboard
   - `TWILIO_AUTH_TOKEN`: From your Twilio dashboard
   - `TWILIO_FROM`: Your Twilio WhatsApp number (e.g., `whatsapp:+14155552671`)
   - `WHATSAPP_TO`: Default recipient (can be overridden by `CHECKIN_USER_PHONE`)
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for server-side writes)

4. Click "Save"
5. Vercel will auto-redeploy with new env vars

**Copy your Vercel deployment URL** (shown on dashboard, e.g., `https://your-app.vercel.app`)

#### 2. Set Up GitHub Actions Secret

1. Go to your GitHub repo
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `CHECKIN_BASE_URL`
5. Value: `https://your-app.vercel.app` (your Vercel deployment URL)
6. Click "Add secret"

#### 3. Configure Timezone (Optional)

The workflow runs on **UTC times** by default:
- 9am UTC = 9:00
- 12pm UTC = 12:00
- 3pm UTC = 15:00
- 6pm UTC = 18:00
- 9pm UTC = 21:00
- 10pm UTC = 22:00

**To adjust for your timezone:**

Set `CHECKIN_TIMEZONE` env var in Vercel. Examples:
- `America/New_York` (EST/EDT) = UTC-5/-4
- `Europe/London` (GMT/BST) = UTC+0/+1
- `Asia/Kolkata` (IST) = UTC+5:30
- `America/Los_Angeles` (PST/PDT) = UTC-8/-7

The app will convert the UTC times to your timezone and only send if it matches the allowed hours: 9, 12, 15, 18, 21, 22.

#### 4. Test the Setup

```bash
# Trigger the workflow manually from GitHub
# Go to repo > Actions > "Send Daily Checkins & Report" > Run workflow
# Or use curl locally:

curl -X POST https://your-app.vercel.app/api/whatsapp/checkin \
  -H "Content-Type: application/json" \
  -d '{}'

# Should see check-in sent if current time is during allowed hours
# Adjust timezone or use `CHECKIN_USER_ID` in body to force
```

---

### Option 2: Local + ngrok (Development/Testing Only)

**Setup:**

```bash
# In one terminal: start your app
npm run dev

# In another terminal: expose with ngrok
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
```

**Test locally:**

```bash
curl -X POST https://abc123.ngrok.io/api/whatsapp/checkin \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id"}'
```

**Note:** ngrok URLs expire after 2 hours without Ngrok Pro ($5/month). Use Option 1 for continuous production scheduling.

---

## API Endpoints

### Check-In Endpoint

**POST** `/api/whatsapp/checkin`

Sends a check-in message only if current hour matches: 9, 12, 15, 18, or 21.

**Body (optional):**
```json
{
  "userId": "user-id-to-override-env"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 1,
  "message": "Check-in sent to 1 user"
}
```

**Or if outside allowed hours:**
```json
{
  "success": true,
  "sent": 0,
  "message": "Current hour 14 is not a check-in time. Allowed: 9, 12, 15, 18, 21"
}
```

### Report Endpoint

**POST** `/api/whatsapp/checkin/report`

Sends daily summary only if current hour is 22 (10pm).

**Response:**
```json
{
  "success": true,
  "sent": 1
}
```

---

## Testing Checklist

- [ ] Push code to GitHub
- [ ] Verify Vercel deployment auto-triggers and succeeds
- [ ] Set `CHECKIN_BASE_URL` GitHub secret
- [ ] Verify Vercel env vars are set (especially `CHECKIN_TIMEZONE`)
- [ ] Manually trigger workflow: GitHub > Actions > "Send Daily Checkins & Report" > Run workflow
- [ ] Check WhatsApp for incoming message
- [ ] Verify Supabase `ai_checkins` table has new records with status='sent'
- [ ] Test delete functionality on dashboard
- [ ] Confirm daily report arrives at 10pm

---

## Troubleshooting

### "CHECKIN_BASE_URL secret not set"
- Go to GitHub > Settings > Secrets and add `CHECKIN_BASE_URL` with your Vercel URL

### Check-in not arriving at scheduled time
- Verify `CHECKIN_TIMEZONE` env var is correct (e.g., `Asia/Kolkata`)
- Manually trigger workflow and check GitHub Actions logs
- Ensure `CHECKIN_USER_ID` or `CHECKIN_USER_PHONE` is set in Vercel env vars

### "Current hour X is not a check-in time"
- The app ran outside scheduled hours (9, 12, 15, 18, 21, 22 UTC)
- If you want to test outside these hours, use body param: `{"userId": "test-id"}`

### Workflow appears in GitHub but doesn't run
- Ensure workflow file is committed to repo: `.github/workflows/send_checkins.yml`
- GitHub Actions may have a 10-15 min delay before picking up new schedules
- Manually trigger via "Run workflow" button to test immediately

### WhatsApp message not arriving (but Supabase shows 'sent')
- Check Twilio dashboard for delivery logs
- Verify Twilio WhatsApp sandbox is active and phone is registered
- Ensure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` are correct

---

## Cost Summary

| Component | Cost |
|-----------|------|
| GitHub Actions (public repo) | $0 |
| Vercel free tier | $0 |
| Twilio WhatsApp (sandbox) | $0 (for testing) |
| Google Generative AI (Gemini) | Free tier includes generous limits; usage-based after |
| Supabase (free tier) | $0 |
| **Total** | **$0** (or ~$5-10/month for Gemini if heavy usage) |

---

## Next Steps

1. **Deploy**: Push code → Vercel auto-deploys
2. **Configure**: Set env vars in Vercel dashboard
3. **Activate**: Add GitHub secret `CHECKIN_BASE_URL`
4. **Test**: Manual trigger via GitHub Actions
5. **Monitor**: Check WhatsApp daily at 9am, 12pm, 3pm, 6pm, 9pm, 10pm

Your app is now ready for 24/7 automated check-ins and daily summaries! 🚀

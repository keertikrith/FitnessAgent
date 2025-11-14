# Hourly Check-ins (WhatsApp) — Setup & Run

This document explains how the hourly WhatsApp check-ins work and how to run them on Vercel.

Overview
- The project has an API endpoint at `/api/whatsapp/checkin` that sends a WhatsApp check-in to a user and inserts an `ai_checkins` record in Supabase.
- Only one user is targeted by default (your preference). The endpoint enforces allowed hours (09:00–20:00) in a configurable timezone.
- There's also a summary endpoint at `/api/whatsapp/checkin/summary` that aggregates today's check-ins, meals, and habits for the dashboard.

Environment variables (set these in Vercel Project > Settings > Environment Variables):
- `CHECKIN_USER_ID` = (optional) supabase `users.id` for your account (preferred)
- `CHECKIN_USER_PHONE` = (optional) full phone string for Twilio (e.g. `+1234567890`) — used if `CHECKIN_USER_ID` not provided
- `CHECKIN_TIMEZONE` = (optional) IANA timezone, e.g. `America/Los_Angeles` or `Asia/Kolkata` — default is `UTC`

Local testing
1. Start your Next.js app locally:
```bash
npm run dev
```
2. Run the included trigger script to POST to the checkin endpoint (defaults to `http://localhost:3000`):
```bash
./scripts/send_checkins.sh
# or with a deployed base URL
./scripts/send_checkins.sh https://your-deployment-url.vercel.app
```

Vercel scheduled job (recommended)
1. Deploy your app to Vercel.
2. In the Vercel dashboard, go to your Project > Settings > Cron Jobs (or Scheduled Functions) and create a new cron job.
   - URL: `https://<your-project>.vercel.app/api/whatsapp/checkin`
   - Method: `POST`
   - Schedule: Use an hourly cron expression but constrain to 09:00–20:00 in your timezone.
     Example (UTC): to run at minute 0 of hours 9..20 every day: `0 9-20 * * *`
     If you use a local timezone in Vercel's cron UI, select the project timezone or set `CHECKIN_TIMEZONE` appropriately.
3. Ensure the Vercel project environment variables above are set.

Notes
- The endpoint enforces the allowed hours based on `CHECKIN_TIMEZONE`. If the cron hits outside allowed hours, the endpoint returns `{sent:0}`.
- The endpoint accepts an optional JSON body with `{"userId":"<id>"}` to override the configured user for a one-off send.

Testing end-to-end
1. Use ngrok to expose your local dev server and configure Twilio webhook (if testing incoming messages locally).
2. Send the check-in through the endpoint and reply via Twilio sandbox; the webhook will parse and record parsed_json on the relevant `ai_checkins` entry.

Dashboard
- Use `GET /api/whatsapp/checkin/summary` to fetch a summary for today (respecting `CHECKIN_TIMEZONE`). The dashboard can poll this endpoint or fetch at load time.

If you want, I can add a small dashboard widget that calls `/api/whatsapp/checkin/summary` and displays the daily totals and a list of today's replies.

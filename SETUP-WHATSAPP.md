# 📱 WhatsApp Setup Guide

WhatsApp integration requires additional setup because you're running locally. Here's how to get it working:

## 🚨 Important: WhatsApp Won't Work Locally Without Extra Setup

Your Twilio WhatsApp sandbox can only send messages to **verified** phone numbers, and it needs a **public URL** to receive messages (webhooks).

## Option 1: Test Without WhatsApp (Recommended for Now)

You can use the app fully without WhatsApp! All features work in the web interface:

1. ✅ Dashboard - Log meals and habits
2. ✅ Chat - Talk to AI assistant
3. ✅ Goals - Set health goals
4. ✅ Insights - View progress

**Skip WhatsApp for now and come back to it when you deploy to production.**

## Option 2: Set Up WhatsApp for Local Testing (Advanced)

If you really want to test WhatsApp locally, follow these steps:

### Step 1: Join Twilio WhatsApp Sandbox

1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. You'll see a message like: "Send 'join <code>' to +1 415 523 8886"
3. Open WhatsApp on your phone
4. Send that exact message to the Twilio number
5. You should receive a confirmation message

### Step 2: Install ngrok (for local webhook)

```bash
# Install ngrok
npm install -g ngrok

# Or download from: https://ngrok.com/download
```

### Step 3: Start ngrok

In a NEW terminal window (keep your dev server running):

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 4: Configure Twilio Webhook

1. Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. Find "When a message comes in"
3. Paste your ngrok URL + `/api/whatsapp/webhook`
   - Example: `https://abc123.ngrok.io/api/whatsapp/webhook`
4. Method: POST
5. Click Save

### Step 5: Test WhatsApp

Send a message to the Twilio WhatsApp number:
```
Had breakfast
```

You should receive a reply with calorie count!

## 📱 WhatsApp Features

Once set up, you can:

### Log Meals
```
Had dosa and chai
```
Response: "✅ Logged dosa + chai (380 kcal). Total: 380/2000 kcal."

### Log Workouts
```
Worked out 30 mins
```
Response: "💪 Workout logged (30 min)! Great job! 🎉"

### Set Goals
```
I want to lose 3 kg in 4 weeks
```
Response: Goal confirmation with calorie targets

### Hourly Check-ins (Automatic)

Every hour, you'll receive:
```
⏰ Hey there! Quick check-in:
🍽️ Did you eat anything?
💪 Worked out?
📚 Read or studied?
🧘‍♀️ Meditated?
```

### Daily Summaries (Automatic at 9 PM)

You'll receive:
```
📊 Daily Summary

✅ Today's Highlights:
• Total Calories: 1450 kcal
• Habits Done: workout, reading
...
```

## 🚀 Production Setup (Easier!)

When you deploy to Vercel:

1. WhatsApp webhook will work automatically (no ngrok needed)
2. Cron jobs will send hourly check-ins and daily summaries
3. Just update Twilio webhook to: `https://your-app.vercel.app/api/whatsapp/webhook`

## 🐛 Troubleshooting

### Not receiving messages?

1. **Check you joined the sandbox**
   - Send "join <code>" to Twilio number
   - Wait for confirmation

2. **Check webhook is configured**
   - Go to Twilio console
   - Verify webhook URL is correct
   - Make sure it's HTTPS (ngrok provides this)

3. **Check ngrok is running**
   - Keep ngrok terminal open
   - If you restart ngrok, URL changes - update Twilio!

4. **Check server logs**
   - Look at your terminal running `npm run dev`
   - You should see webhook requests coming in

### Can't send messages?

1. **Check Twilio credentials in .env**
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_FROM (should be whatsapp:+14155238886)
   - WHATSAPP_TO (your number with whatsapp: prefix)

2. **Check Twilio account balance**
   - Trial accounts have limits
   - Verify your phone number in Twilio console

3. **Check phone number format**
   - Must include country code
   - Format: whatsapp:+919148112367
   - No spaces or dashes

## 💡 Recommendation

**For now, skip WhatsApp and use the web interface.** It's much easier and all features work perfectly!

When you're ready to deploy to production (Vercel), WhatsApp will be much simpler to set up.

See DEPLOYMENT.md for production deployment instructions.

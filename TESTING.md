# 🧪 Testing Guide

Complete guide to test all features of the AI Habit Tracker.

## 🏁 Quick Start Testing

### 1. Local Development Setup

```bash
# Install dependencies
npm install

# Create .env.local with your credentials
cp .env.local.example .env.local
# Edit .env.local with your actual keys

# Run development server
npm run dev
```

Visit: http://localhost:3000

## 🔐 Authentication Testing

### Email/Password Sign Up

1. Go to `/login`
2. Click "Sign Up" tab
3. Enter:
   - Email: `test@example.com`
   - Password: `Test123456!`
4. Click "Sign Up"
5. ✅ Should redirect to `/dashboard`

### Email/Password Login

1. Go to `/login`
2. Enter credentials from sign up
3. Click "Login"
4. ✅ Should redirect to `/dashboard`

### Google OAuth (if configured)

1. Click "Continue with Google"
2. Select Google account
3. ✅ Should redirect to `/dashboard`

### Logout

1. Click "Logout" in navigation
2. ✅ Should redirect to `/login`

## 📊 Dashboard Testing

### View Stats

1. Go to `/dashboard`
2. ✅ Should see 4 stat cards:
   - Calories Today
   - Habits Completed
   - Meals Logged
   - Goal Progress

### Quick Log - Meal

1. In "Quick Log" section, type:
   ```
   Had oats with banana and milk for breakfast
   ```
2. Press Enter or click "Send"
3. ✅ Should see:
   - Processing indicator
   - Meal appears in "Today's Meals"
   - Calorie count updates
   - Progress bar updates

### Quick Log - Workout

1. Type:
   ```
   Worked out for 30 minutes
   ```
2. ✅ Should see:
   - Workout habit marked complete
   - Duration shows "30 minutes"

### Quick Log - Multiple Items

1. Type:
   ```
   Had lunch with dal rice and salad, then read for 20 mins
   ```
2. ✅ Should see:
   - Meal logged with calories
   - Reading habit marked complete

### Manual Habit Toggle

1. Click on any habit icon (💪, 📚, 📖, 🧘‍♀️)
2. ✅ Should:
   - Show duration input
   - Turn green when completed
3. Enter duration (e.g., "25")
4. Click "Save"
5. ✅ Duration should display

## 🎯 Goals Testing

### AI Goal Creation

1. Go to `/goals`
2. Ensure "AI Goal Setting" tab is selected
3. Type:
   ```
   I want to lose 3 kg in 4 weeks by eating 1600 calories per day and working out 30 minutes daily
   ```
4. Click "Generate Goal with AI"
5. ✅ Should see:
   - Processing indicator
   - New goal appears in "Previous Goals"
   - Goal details correctly parsed

### Manual Goal Creation

1. Click "Manual Entry" tab
2. Fill in:
   - Goal Type: Weight Loss
   - Target Change: 3
   - Target Weeks: 4
   - Daily Calorie Target: 1600
   - Protein Target: 100
   - Workout: 30
3. Click "Create Goal"
4. ✅ Goal should appear in list

### View Goals

1. Check "Previous Goals" section
2. ✅ Should display:
   - Goal type
   - Start date
   - All targets
   - Notes (if any)

## 💬 Chat Testing

### Basic Meal Logging

1. Go to `/chat`
2. Type: `Had dosa and chai`
3. ✅ Should receive:
   ```
   ✅ Logged: dosa and chai (380 kcal)
   📊 Total today: 380 kcal
   ```

### Workout Logging

1. Type: `Worked out 45 mins`
2. ✅ Should receive:
   ```
   💪 Workout logged (45 min)! Great job! 🎉
   ```

### Multiple Habits

1. Type: `Read for 30 minutes and meditated for 15`
2. ✅ Should receive confirmation for both

### Goal Setting

1. Type: `I want to gain 2 kg in 8 weeks`
2. ✅ Should receive:
   ```
   🎯 Goal set successfully!
   Target: 2kg in 8 weeks
   Daily Calories: 2500 kcal
   ...
   ```

### Conversation Flow

1. Send multiple messages
2. ✅ Should see:
   - Messages appear in chat
   - User messages on right (blue)
   - AI responses on left (white)
   - Timestamps on each message

## 📈 Insights Testing

### View Charts

1. Go to `/insights`
2. ✅ Should see:
   - Calorie tracking chart (line chart)
   - Habit tracking chart (bar chart)
   - Last 7 days of data

### Daily Summaries

1. Check "Daily Summaries" section
2. ✅ Should display:
   - Date
   - Today's highlights
   - Goal progress
   - Tomorrow's plan
   - Motivation snippet

### No Data State

1. With fresh account (no data)
2. ✅ Should see:
   ```
   No insights yet. Daily summaries are generated automatically at 9 PM.
   ```

## 📱 WhatsApp Testing

### Setup Webhook (Local Testing)

For local testing, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
# Update Twilio webhook to: https://abc123.ngrok.io/api/whatsapp/webhook
```

### Send Test Messages

1. Send WhatsApp to Twilio number:
   ```
   Had breakfast
   ```
2. ✅ Should receive:
   ```
   ✅ Logged: breakfast (350 kcal)
   📊 Total today: 350/2000 kcal
   ```

3. Send:
   ```
   Worked out 30 mins
   ```
4. ✅ Should receive:
   ```
   💪 Workout logged (30 min)! Great job! 🎉
   ```

5. Send:
   ```
   I want to lose 2 kg in 3 weeks
   ```
6. ✅ Should receive goal confirmation

### Test Webhook Endpoint

```bash
# Test with curl
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Body=Had lunch&From=whatsapp:+1234567890"
```

## ⏰ Cron Jobs Testing

### Manual Check-in Trigger

```bash
# Local
curl http://localhost:3000/api/checkin

# Production
curl https://your-app.vercel.app/api/checkin
```

✅ Should:
- Return success JSON
- Send WhatsApp check-in message

### Manual Summary Trigger

```bash
# Local
curl http://localhost:3000/api/summary

# Production
curl https://your-app.vercel.app/api/summary
```

✅ Should:
- Return success JSON with summary
- Send WhatsApp summary message

### Verify Cron Schedule

In Vercel:
1. Go to project > Cron Jobs
2. ✅ Should see:
   - `/api/checkin` - Every hour (0 * * * *)
   - `/api/summary` - Daily at 9 PM (0 21 * * *)

## 🔧 API Endpoints Testing

### Log Meal

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "message": "Had pizza for lunch"
  }'
```

✅ Response should include parsed meal and calories

### Create Goal

```bash
curl -X POST http://localhost:3000/api/goal \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "message": "I want to lose 3 kg in 4 weeks"
  }'
```

✅ Response should include created goal

### Get Meals

```bash
curl "http://localhost:3000/api/log?userId=user-uuid&type=meals&date=2024-01-15"
```

✅ Response should include meals array

### Get Habits

```bash
curl "http://localhost:3000/api/log?userId=user-uuid&type=habits&date=2024-01-15"
```

✅ Response should include habits array

## 🎨 UI/UX Testing

### Responsive Design

Test on different screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

✅ All pages should be responsive

### Navigation

1. Click through all nav links
2. ✅ Should navigate correctly:
   - Dashboard → Goals → Insights → Chat

### Loading States

1. Observe loading indicators
2. ✅ Should show:
   - "Loading..." on page load
   - Processing indicator during AI calls
   - Disabled buttons during submission

### Error Handling

1. Try invalid inputs
2. ✅ Should show error messages:
   - Invalid login credentials
   - Network errors
   - API failures

## 🐛 Common Issues & Solutions

### Issue: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Supabase connection failed"
- Check environment variables
- Verify Supabase project is active
- Check API keys are correct

### Issue: "Gemini API error"
- Verify API key is valid
- Check API quota
- Ensure internet connection

### Issue: "WhatsApp not working"
- Verify Twilio credentials
- Check webhook URL
- Ensure sandbox is active

### Issue: "Cron jobs not running"
- Check `vercel.json` exists
- Verify cron syntax
- Check Vercel logs

## ✅ Testing Checklist

Before deployment, verify:

- [ ] Authentication (sign up, login, logout)
- [ ] Dashboard displays correctly
- [ ] Meal logging works (AI and manual)
- [ ] Habit tracking works
- [ ] Goal creation works (AI and manual)
- [ ] Chat interface works
- [ ] Insights display correctly
- [ ] Charts render properly
- [ ] WhatsApp integration works
- [ ] Cron jobs trigger correctly
- [ ] Responsive on mobile
- [ ] Error handling works
- [ ] Loading states display
- [ ] Navigation works

## 📊 Performance Testing

### Load Time

1. Open DevTools > Network
2. Reload pages
3. ✅ Should load in < 3 seconds

### API Response Time

1. Check Network tab
2. ✅ API calls should respond in < 2 seconds

### Database Queries

1. Check Supabase logs
2. ✅ Queries should execute in < 500ms

## 🔒 Security Testing

### Authentication

- [ ] Can't access dashboard without login
- [ ] Logout clears session
- [ ] Can't access other users' data

### API Security

- [ ] API routes validate user ID
- [ ] Service key not exposed to client
- [ ] RLS policies enforced

### Environment Variables

- [ ] No secrets in client-side code
- [ ] .env.local in .gitignore
- [ ] Production keys different from dev

---

All tests passing? You're ready to deploy! 🚀

# 🔧 Troubleshooting Guide

## Current Issues You're Facing

### ❌ Issue 1: "Could not find the table 'public.meal_logs' in the schema cache"

**Problem:** Database tables haven't been created yet.

**Solution:** 
1. Open `SETUP-DATABASE.md` and follow the instructions
2. Go to Supabase dashboard → SQL Editor
3. Run the SQL schema from `supabase-schema.sql`
4. Verify tables are created in Table Editor

### ❌ Issue 2: "models/gemini-1.5-pro is not found"

**Problem:** Wrong Gemini model name.

**Solution:** ✅ Already fixed! I updated the code to use `gemini-1.5-flash` instead.

### ❌ Issue 3: WhatsApp messages not working

**Problem:** WhatsApp requires public URL (webhook) which doesn't work on localhost.

**Solution:** 
- **Option A (Recommended):** Skip WhatsApp for now, use web interface
- **Option B:** Set up ngrok - see `SETUP-WHATSAPP.md`

## Quick Fix Checklist

Run through this checklist:

- [ ] **Database tables created?**
  - Go to Supabase → Table Editor
  - Should see: users, goals, meal_logs, habit_logs, daily_insights
  - If not, run SQL from `SETUP-DATABASE.md`

- [ ] **Environment variables set?**
  - Check `.env` file exists
  - All keys have values (not empty)
  - No extra spaces or quotes

- [ ] **Dev server restarted?**
  - Stop server (Ctrl+C)
  - Run `npm run dev` again

- [ ] **Browser cache cleared?**
  - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
  - Or open in incognito/private window

## Common Errors & Solutions

### 1. Authentication Errors

**Error:** "Invalid login credentials"

**Solutions:**
- Make sure you signed up first (not just trying to login)
- Check email is correct
- Password must be at least 6 characters
- Try signing up with a different email

**Error:** "User not found"

**Solutions:**
- Sign up first before logging in
- Check Supabase → Authentication → Users to see if user exists

### 2. Database Errors

**Error:** "relation does not exist" or "table not found"

**Solutions:**
- Run the SQL schema in Supabase (see SETUP-DATABASE.md)
- Check you're using the correct Supabase project
- Verify SUPABASE_URL in .env matches your project

**Error:** "permission denied for table"

**Solutions:**
- Check RLS policies are created (they're in the SQL schema)
- Make sure you're logged in
- Verify user_id matches authenticated user

### 3. API Errors

**Error:** "Failed to process AI request"

**Solutions:**
- Check GEMINI_API_KEY is correct
- Verify API key has quota remaining
- Check internet connection
- Model name should be `gemini-1.5-flash` (already fixed)

**Error:** "Twilio error" or WhatsApp not working

**Solutions:**
- See SETUP-WHATSAPP.md for complete setup
- For local testing, you need ngrok
- Or skip WhatsApp and use web interface

### 4. Build/Runtime Errors

**Error:** "Module not found"

**Solutions:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error:** "Port 3000 already in use"

**Solutions:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**Error:** TypeScript errors

**Solutions:**
- Make sure all dependencies installed: `npm install`
- Check tsconfig.json exists
- Restart VS Code/editor

## Step-by-Step Recovery

If nothing works, start fresh:

### 1. Stop Everything
```bash
# Stop dev server (Ctrl+C in terminal)
# Stop ngrok if running (Ctrl+C)
```

### 2. Clean Install
```bash
rm -rf node_modules package-lock.json .next
npm install
```

### 3. Verify Environment
```bash
# Check .env file exists and has all keys
cat .env
```

### 4. Set Up Database
- Follow SETUP-DATABASE.md
- Run SQL schema in Supabase
- Verify tables created

### 5. Restart Server
```bash
npm run dev
```

### 6. Test in Browser
- Open http://localhost:3000
- Sign up with new email
- Try logging a meal in dashboard

## Verification Steps

### Test 1: Can you access the login page?
- Go to http://localhost:3000
- Should see login/signup form
- ✅ If yes, server is running correctly

### Test 2: Can you sign up?
- Click "Sign Up"
- Enter email and password
- Click "Sign Up"
- ✅ If redirected to dashboard, auth works

### Test 3: Can you see the dashboard?
- Should see 4 stat cards
- Should see "Quick Log" section
- Should see "Today's Meals" and "Today's Habits"
- ✅ If yes, database connection works

### Test 4: Can you log a meal?
- Type in Quick Log: "Had breakfast"
- Press Enter
- ✅ Should see meal appear in "Today's Meals"

### Test 5: Can you toggle a habit?
- Click on a habit icon (💪, 📚, etc.)
- Enter duration
- Click Save
- ✅ Should turn green and show duration

## Still Having Issues?

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Share the error message for help

### Check Server Logs
1. Look at terminal running `npm run dev`
2. Check for error messages
3. Look for stack traces

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Check for errors

### Environment Variables Debug
```bash
# Print environment variables (be careful not to share these!)
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log(process.env.GEMINI_API_KEY?.substring(0, 10))"
```

## What Should Work Right Now

Even without WhatsApp, these features work perfectly:

✅ **Authentication**
- Sign up with email
- Login with email
- Google OAuth (if configured)

✅ **Dashboard**
- View stats
- Log meals with AI
- Toggle habits
- See today's summary

✅ **Chat**
- Natural language conversation
- AI parses meals and habits
- Set goals via chat

✅ **Goals**
- Create goals with AI
- Manual goal entry
- View goal history

✅ **Insights**
- View progress charts
- See daily summaries (after 9 PM)

## What Needs Extra Setup

⚠️ **WhatsApp Integration**
- Requires ngrok for local testing
- Or deploy to production
- See SETUP-WHATSAPP.md

⚠️ **Cron Jobs**
- Only work in production (Vercel)
- Hourly check-ins
- Daily summaries

## Next Steps

1. ✅ Fix database (SETUP-DATABASE.md)
2. ✅ Test web interface (should work now!)
3. ⏭️ Skip WhatsApp for now
4. 🚀 Deploy to production when ready (DEPLOYMENT.md)

---

Need more help? Check the other documentation files:
- README.md - Complete overview
- QUICKSTART.md - Getting started guide
- SETUP-DATABASE.md - Database setup
- SETUP-WHATSAPP.md - WhatsApp setup
- DEPLOYMENT.md - Production deployment

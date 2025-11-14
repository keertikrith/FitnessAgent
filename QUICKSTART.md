# 🚀 Quick Start Guide

## ✅ Step 1: Database Setup (REQUIRED)

Before you can use the app, you need to create the database tables in Supabase.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/nydzjkesavmcfkrnbsoy

2. Click on **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy the entire contents of `supabase-schema.sql` file

5. Paste it into the SQL editor

6. Click **Run** (or press Cmd/Ctrl + Enter)

7. ✅ You should see "Success. No rows returned" - this means all tables were created!

### Verify Tables Created

1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - users
   - goals
   - meal_logs
   - habit_logs
   - daily_insights

## ✅ Step 2: Open the App

1. Your app is already running at: **http://localhost:3000**

2. You'll see the login page

3. Click **Sign Up** and create an account with:
   - Email: your-email@example.com
   - Password: (at least 6 characters)

4. After signing up, you'll be redirected to the dashboard

## ✅ Step 3: Test the Features

### Test Meal Logging

In the dashboard, in the "Quick Log" section, type:
```
Had oats with banana and milk for breakfast
```

Press Enter. You should see:
- The meal appears in "Today's Meals"
- Calorie count updates
- Progress bar updates

### Test Habit Logging

Type:
```
Worked out for 30 minutes
```

You should see:
- Workout habit marked as complete
- Duration shows "30 minutes"

### Test Combined Logging

Type:
```
Had lunch with dal rice and salad, then read for 20 mins
```

Both meal and reading habit should be logged!

### Test Goal Setting

1. Go to **Goals** page (click in navigation)
2. Type in the AI Goal Setting box:
```
I want to lose 3 kg in 4 weeks by eating 1600 calories per day
```
3. Click "Generate Goal with AI"
4. Your goal should be created and displayed!

## 🎉 You're All Set!

Your AI Habit Tracker is now fully functional. Explore all the features:

- **Dashboard** - Track daily meals and habits
- **Goals** - Set and manage health goals
- **Chat** - Have natural conversations with the AI
- **Insights** - View progress charts and AI summaries

## 🐛 Troubleshooting

### "No tables found" error
- Make sure you ran the SQL schema in Supabase
- Check that all tables are visible in Table Editor

### "Authentication error"
- Clear browser cache and cookies
- Try signing up with a different email
- Check Supabase Auth settings

### "AI not responding"
- Verify GEMINI_API_KEY is correct in .env
- Check your internet connection
- Look at browser console for errors

### Still having issues?
Check the browser console (F12) for error messages and refer to TESTING.md for detailed troubleshooting.

---

**Next Steps:**
- Check out TESTING.md for comprehensive testing guide
- See DEPLOYMENT.md when ready to deploy to production
- Read README.md for complete documentation

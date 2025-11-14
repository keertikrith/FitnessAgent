#!/bin/bash

# DEPLOYMENT SCRIPT
# This file contains all the commands you need to deploy the 3-hour check-in system
# Copy and paste each section into your terminal as needed

echo "🚀 3-Hour Check-In Deployment Guide"
echo "===================================="
echo ""

# Step 1: Commit and push code
echo "STEP 1: Push code to GitHub"
echo "============================"
echo ""
echo "Run these commands in your project directory:"
echo ""
cat << 'EOF'
git add .
git commit -m "Add 3-hour check-in schedule and daily report"
git push origin main
EOF
echo ""
echo "After this, Vercel will auto-deploy (watch https://vercel.com dashboard)"
echo ""

# Step 2: Instructions for Vercel env vars
echo "STEP 2: Set Environment Variables in Vercel"
echo "============================================"
echo ""
echo "Go to: https://vercel.com"
echo "1. Select your project"
echo "2. Click 'Settings' in the top menu"
echo "3. Click 'Environment Variables' in the left sidebar"
echo "4. Add each of these (make sure 'All' is selected for production):"
echo ""
cat << 'EOF'

GEMINI_API_KEY=sk-xxxxxxxxxxxx
(Get from: https://ai.google.dev)

CHECKIN_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
(Get from Supabase users table, or leave blank and use CHECKIN_USER_PHONE)

CHECKIN_USER_PHONE=whatsapp:+1234567890
(WhatsApp number including country code)

CHECKIN_TIMEZONE=UTC
(Or: America/New_York, Europe/London, Asia/Kolkata, etc.)

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
(From: https://console.twilio.com)

TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
(From: https://console.twilio.com)

TWILIO_FROM=whatsapp:+14155552671
(Your Twilio WhatsApp number)

WHATSAPP_TO=+1234567890
(Backup default recipient)

SUPABASE_URL=https://xxxxx.supabase.co
(From: https://supabase.com project settings)

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(From Supabase: Settings > API > service_role key (NOT anon key))

EOF

echo "5. After adding all, scroll down and click 'Save'"
echo "6. Wait 30 seconds for Vercel to redeploy"
echo ""

# Step 3: Get Vercel URL
echo "STEP 3: Get Your Vercel Deployment URL"
echo "======================================="
echo ""
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click on your project"
echo "3. Copy the URL shown (e.g., https://my-app.vercel.app)"
echo "4. Save it for the next step"
echo ""

# Step 4: Add GitHub secret
echo "STEP 4: Add GitHub Secret"
echo "========================="
echo ""
echo "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO"
echo "2. Click 'Settings' (top right)"
echo "3. Click 'Secrets and variables' > 'Actions' (left sidebar)"
echo "4. Click 'New repository secret' (green button)"
echo "5. Fill in:"
echo "   Name:  CHECKIN_BASE_URL"
echo "   Value: https://your-vercel-url.vercel.app"
echo "6. Click 'Add secret'"
echo ""

# Step 5: Test
echo "STEP 5: Test the Setup"
echo "======================"
echo ""
echo "Option A: Manual trigger via GitHub"
echo "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO"
echo "2. Click 'Actions' tab"
echo "3. Click 'Send Daily Checkins & Report' workflow"
echo "4. Click 'Run workflow' dropdown"
echo "5. Select 'main' branch"
echo "6. Click 'Run workflow' button"
echo "7. Watch the logs to see if it succeeds"
echo ""
echo "Option B: Wait for scheduled time"
echo "Next check-in will send at:"
cat << 'EOF'
- Next scheduled hour: 9am, 12pm, 3pm, 6pm, 9pm (or 10pm for report)
- Times are in UTC by default (adjust CHECKIN_TIMEZONE if needed)
EOF
echo ""

# Step 6: Verify in Supabase
echo "STEP 6: Verify in Supabase"
echo "=========================="
echo ""
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Click 'SQL Editor' (left sidebar)"
echo "4. Run this query:"
echo ""
cat << 'EOF'
SELECT * FROM ai_checkins 
ORDER BY created_at DESC 
LIMIT 10;
EOF
echo ""
echo "You should see records with:"
echo "  status: 'sent'"
echo "  sent_at: recent timestamp"
echo "  checkin_type: 'checkin' or 'report'"
echo ""

# Final summary
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "Your 3-hour check-in system is now live!"
echo ""
echo "Schedule:"
echo "  • 9:00 AM  - Check-in message"
echo "  • 12:00 PM - Check-in message"
echo "  • 3:00 PM  - Check-in message"
echo "  • 6:00 PM  - Check-in message"
echo "  • 9:00 PM  - Check-in message"
echo "  • 10:00 PM - Daily report summary"
echo ""
echo "Costs: $0/month (completely free)"
echo ""
echo "Next steps:"
echo "1. Wait for first scheduled message (or manually trigger workflow)"
echo "2. Reply on WhatsApp"
echo "3. Check dashboard anytime to see progress"
echo "4. Daily report arrives at 10pm"
echo ""
echo "Questions?"
echo "- Check CHECKIN-DEPLOYMENT.md for detailed guide"
echo "- Check ARCHITECTURE.md for system diagrams"
echo "- Check IMPLEMENTATION-SUMMARY.md for full overview"
echo ""

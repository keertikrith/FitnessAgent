# 🏃‍♀️ AI Habit & Health Tracking Agent

A complete full-stack AI-powered habit and health tracking application built with Next.js 15, Supabase, Gemini AI, and Twilio WhatsApp integration.

## ✨ Features

- 🤖 **AI-Powered Tracking**: Natural language processing for meal and habit logging
- 💬 **WhatsApp Integration**: 24/7 check-ins and daily summaries via WhatsApp
- 📊 **Smart Dashboard**: Real-time tracking of calories, habits, and goals
- 🎯 **Goal Setting**: AI-assisted goal creation with automatic calorie calculations
- 📈 **Insights & Analytics**: Daily AI-generated summaries and progress charts
- ⏰ **Automated Check-ins**: Hourly reminders and nightly summaries via Vercel Cron
- 🔐 **Secure Authentication**: Supabase Auth with email and Google OAuth

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Gemini 1.5 Pro API |
| Messaging | Twilio WhatsApp API |
| Background Tasks | Vercel Cron Jobs |
| Charts | Recharts |
| Deployment | Vercel |

## 📁 Project Structure

```
/app
├── /api
│   ├── /whatsapp
│   │   ├── /send/route.ts       # Send WhatsApp messages
│   │   └── /webhook/route.ts    # Receive WhatsApp messages
│   ├── /checkin/route.ts        # Hourly check-in cron
│   ├── /summary/route.ts        # Daily summary cron
│   ├── /goal/route.ts           # Goal management
│   └── /log/route.ts            # Meal & habit logging
├── /dashboard/page.tsx          # Main dashboard
├── /goals/page.tsx              # Goal management page
├── /insights/page.tsx           # Analytics & insights
├── /chat/page.tsx               # AI chat interface
├── /login/page.tsx              # Authentication
├── layout.tsx
└── globals.css

/lib
├── /supabaseClient.ts           # Supabase client & types
├── /gemini.ts                   # Gemini AI integration
└── /twilio.ts                   # Twilio WhatsApp helpers

/components
├── /DashboardCard.tsx           # Stat cards
├── /Charts.tsx                  # Data visualization
├── /GoalForm.tsx                # Goal creation form
├── /ChatInput.tsx               # Chat input component
├── /InsightCard.tsx             # Daily summary cards
└── /HabitToggle.tsx             # Habit tracking toggle
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Google AI Studio account (for Gemini API)
- Twilio account with WhatsApp sandbox

### 1. Clone and Install

```bash
git clone <your-repo>
cd ai-habit-tracker
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Enable Google OAuth in Authentication > Providers (optional)
4. Copy your project URL and keys

### 3. Set Up Gemini AI

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Copy the API key

### 4. Set Up Twilio WhatsApp

1. Create account at [twilio.com](https://www.twilio.com)
2. Go to Messaging > Try it out > Send a WhatsApp message
3. Follow sandbox setup instructions
4. Copy Account SID, Auth Token, and WhatsApp numbers

### 5. Configure Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_FROM=whatsapp:+14155238886
WHATSAPP_TO=whatsapp:+91XXXXXXXXXX

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 WhatsApp Integration

### Setting Up Webhook

1. Deploy to Vercel (see deployment section)
2. Copy your webhook URL: `https://your-app.vercel.app/api/whatsapp/webhook`
3. In Twilio Console > Messaging > Settings > WhatsApp Sandbox Settings
4. Paste webhook URL in "When a message comes in" field
5. Save

### Testing WhatsApp

Send messages to your Twilio WhatsApp number:
- "Had dosa and chai" → Logs meal with calorie estimate
- "Worked out 30 mins" → Logs workout habit
- "I want to lose 3 kg in 4 weeks" → Creates goal

## ⏰ Automated Features

### Hourly Check-ins (via Vercel Cron)

Sends WhatsApp message every hour:
```
⏰ Hey there! Quick check-in:
🍽️ Did you eat anything?
💪 Worked out?
📚 Read or studied?
🧘‍♀️ Meditated?
```

### Daily Summaries (9 PM IST)

AI-generated summary with:
- Total calories consumed
- Habits completed/missed
- Goal progress analysis
- Tomorrow's meal and habit plan
- Motivational message

## 🎯 Usage Examples

### Natural Language Logging

The AI understands various formats:

**Meals:**
- "Had oats and banana for breakfast"
- "Lunch was dal rice and salad"
- "Ate 2 chapatis with paneer curry"

**Workouts:**
- "Worked out for 45 minutes"
- "Did yoga for half an hour"
- "Ran 5k today"

**Other Habits:**
- "Read for 20 minutes"
- "Studied 2 hours"
- "Meditated 15 mins"

**Goals:**
- "I want to lose 3 kg in 4 weeks"
- "Goal: gain 2kg in 8 weeks with 2500 calories daily"
- "Maintain weight at 1800 calories per day"

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy

### Configure Cron Jobs

Vercel automatically reads `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/checkin",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/summary",
      "schedule": "0 21 * * *"
    }
  ]
}
```

### Update Twilio Webhook

After deployment, update Twilio webhook URL to:
```
https://your-app.vercel.app/api/whatsapp/webhook
```

## 🔒 Security

- Row Level Security (RLS) enabled on all Supabase tables
- Service role key used only in API routes (server-side)
- Environment variables never exposed to client
- Secure authentication with Supabase Auth

## 📊 Database Schema

### Tables

- **users**: User profiles (extends Supabase auth)
- **goals**: Health and fitness goals
- **meal_logs**: Food intake tracking
- **habit_logs**: Daily habit completion
- **daily_insights**: AI-generated summaries

See `supabase-schema.sql` for complete schema.

## 🤖 AI Behavior

The Gemini AI handles:

1. **Meal Parsing**: Extracts food items and estimates calories
2. **Habit Detection**: Identifies workout, reading, study, meditation
3. **Goal Parsing**: Converts natural language to structured goals
4. **Daily Summaries**: Generates insights and tomorrow's plan

## 🎨 UI Components

- **DashboardCard**: Displays stats with progress bars
- **HabitToggle**: Interactive habit completion toggle
- **ChatInput**: Natural language input field
- **InsightCard**: AI-generated daily summaries
- **GoalForm**: AI or manual goal creation
- **Charts**: Calorie and habit tracking visualizations

## 🐛 Troubleshooting

### WhatsApp messages not received
- Check Twilio webhook URL is correct
- Verify environment variables are set
- Check Twilio console for error logs

### Cron jobs not running
- Verify `vercel.json` is in root directory
- Check Vercel dashboard > Settings > Cron Jobs
- Ensure API routes return 200 status

### AI not parsing correctly
- Check Gemini API key is valid
- Verify API quota not exceeded
- Check console logs for errors

## 📝 License

MIT

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for backend infrastructure
- Google for Gemini AI
- Twilio for WhatsApp API
- Vercel for hosting and cron jobs

---

Built with ❤️ using Next.js 15, Supabase, Gemini AI, and Twilio

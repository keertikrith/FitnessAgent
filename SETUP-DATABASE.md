# 🗄️ Database Setup - REQUIRED STEP

## You MUST complete this before using the app!

The error `"Could not find the table 'public.meal_logs' in the schema cache"` means your database tables haven't been created yet.

## 📋 Step-by-Step Instructions

### 1. Open Supabase Dashboard

Click this link (it will open your project):
👉 **https://supabase.com/dashboard/project/nydzjkesavmcfkrnbsoy**

### 2. Go to SQL Editor

- Look at the left sidebar
- Click on **"SQL Editor"** (it has a database icon)

### 3. Create New Query

- Click the **"New Query"** button (top right)
- You'll see an empty SQL editor

### 4. Copy the Schema

Open the file `supabase-schema.sql` in your project and copy ALL the content (Cmd+A, Cmd+C)

Or copy this directly:

```sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'weight_gain', 'maintenance', 'fitness')),
  target_change_kg DECIMAL(5,2),
  target_weeks INTEGER,
  daily_calorie_target INTEGER NOT NULL,
  protein_target_g INTEGER,
  workout_minutes INTEGER,
  steps_target INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_logs table
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  estimated_calories INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_name TEXT NOT NULL CHECK (habit_name IN ('workout', 'reading', 'study', 'meditation')),
  completed BOOLEAN NOT NULL DEFAULT false,
  duration_minutes INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, habit_name, date)
);

-- Create daily_insights table
CREATE TABLE IF NOT EXISTS public.daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary_json JSONB NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON public.meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_timestamp ON public.meal_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_id ON public.daily_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON public.daily_insights(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read/update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- Meal logs policies
CREATE POLICY "Users can view own meal logs" ON public.meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs" ON public.meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs" ON public.meal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Habit logs policies
CREATE POLICY "Users can view own habit logs" ON public.habit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs" ON public.habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs" ON public.habit_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs" ON public.habit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Daily insights policies
CREATE POLICY "Users can view own insights" ON public.daily_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON public.daily_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Paste and Run

- Paste the SQL into the editor (Cmd+V)
- Click **"Run"** button (or press Cmd+Enter)
- Wait a few seconds

### 6. Verify Success

You should see:
- ✅ "Success. No rows returned" message
- This is GOOD! It means all tables were created

### 7. Check Tables Were Created

- Click on **"Table Editor"** in the left sidebar
- You should now see these tables:
  - ✅ users
  - ✅ goals
  - ✅ meal_logs
  - ✅ habit_logs
  - ✅ daily_insights

## 🎉 Done!

Now refresh your app at http://localhost:3000 and it should work!

## 🐛 If You See Errors

### "relation already exists"
- This is OK! It means some tables were already created
- The script will skip them and continue

### "permission denied"
- Make sure you're logged into the correct Supabase project
- Check you're using the project: nydzjkesavmcfkrnbsoy

### Still having issues?
- Try running the SQL again
- Check the Supabase logs for detailed error messages
- Make sure your Supabase project is active (not paused)

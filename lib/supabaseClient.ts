import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
// Only create this on the server side
export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY)
  : supabase; // Fallback to regular client on client-side (won't be used)

// Database types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: 'weight_loss' | 'weight_gain' | 'maintenance' | 'fitness';
  target_change_kg?: number;
  target_weeks?: number;
  daily_calorie_target: number;
  protein_target_g?: number;
  workout_minutes?: number;
  steps_target?: number;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  description: string;
  estimated_calories: number;
  timestamp: string;
  created_at?: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_name: 'workout' | 'reading' | 'study' | 'meditation';
  completed: boolean;
  duration_minutes?: number;
  date: string;
  created_at?: string;
}

export interface DailyInsight {
  id: string;
  user_id: string;
  date: string;
  summary_json: any;
  summary_text: string;
  created_at?: string;
}

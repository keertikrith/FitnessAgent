import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

// GET: /api/whatsapp/checkin/summary?userId=<user_id>
// Returns an aggregated summary for today's checkins, parsed meal/habit logs for the specified user.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tz = process.env.CHECKIN_TIMEZONE || 'UTC';

    // helper: get local date string for a timestamp in specified timezone
    function localDateStr(iso: string) {
      try {
        const d = new Date(iso);
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d as any);
        const year = parts.find((p) => p.type === 'year')?.value;
        const month = parts.find((p) => p.type === 'month')?.value;
        const day = parts.find((p) => p.type === 'day')?.value;
        return `${year}-${month}-${day}`;
      } catch (e) {
        return new Date(iso).toISOString().slice(0, 10);
      }
    }

    const now = new Date();
    const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now as any);
    const todayStr = `${todayParts.find((p) => p.type === 'year')?.value}-${todayParts.find((p) => p.type === 'month')?.value}-${todayParts.find((p) => p.type === 'day')?.value}`;

    // Fetch recent checkins (last 48h) and filter by local date and user
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    let checkinsQuery = supabaseAdmin.from('ai_checkins').select('*').gte('scheduled_at', since);
    if (userId) checkinsQuery = checkinsQuery.eq('user_id', userId);
    const { data: checkinsData } = await checkinsQuery;
    const checkins = checkinsData || [];

    const todaysCheckins = checkins.filter((c: any) => localDateStr(c.scheduled_at || c.created_at) === todayStr);

    // Fetch meal_logs & habit_logs for last 48h and filter similarly
    let mealsQuery = supabaseAdmin.from('meal_logs').select('*').gte('created_at', since);
    if (userId) mealsQuery = mealsQuery.eq('user_id', userId);
    const { data: mealsData } = await mealsQuery;
    const mealLogs = mealsData || [];
    const todaysMeals = mealLogs.filter((m: any) => localDateStr(m.created_at) === todayStr);

    let habitsQuery = supabaseAdmin.from('habit_logs').select('*').gte('created_at', since);
    if (userId) habitsQuery = habitsQuery.eq('user_id', userId);
    const { data: habitsData } = await habitsQuery;
    const habitLogs = habitsData || [];
    const todaysHabits = habitLogs.filter((h: any) => localDateStr(h.created_at) === todayStr);

    // Aggregate summary
    const totalCheckins = todaysCheckins.length;
    const responded = todaysCheckins.filter((c: any) => c.status === 'responded' || c.responded_at).length;

    // Meals: sum calories if present (assumes parsed JSON stored on meal_logs or parsed_json)
    let totalCalories = 0;
    for (const m of todaysMeals) {
      if (m.calories) totalCalories += Number(m.calories) || 0;
      else if (m.parsed_json && m.parsed_json.calories) totalCalories += Number(m.parsed_json.calories) || 0;
    }

    // Aggregate durations for habits (workout, reading, sleep)
    const workoutMinutes = todaysHabits
      .filter((h: any) => (h.habit_name || '').toLowerCase() === 'workout')
      .reduce((sum: number, h: any) => sum + (h.duration_minutes || 0), 0);

    const readingMinutes = todaysHabits
      .filter((h: any) => (h.habit_name || '').toLowerCase() === 'reading')
      .reduce((sum: number, h: any) => sum + (h.duration_minutes || 0), 0);

    const sleepMinutes = todaysHabits
      .filter((h: any) => (h.habit_name || '').toLowerCase() === 'sleep')
      .reduce((sum: number, h: any) => sum + (h.duration_minutes || 0), 0);

    // Get today's manual calories burned (from daily_burns)
    let burnsQuery = supabaseAdmin.from('daily_burns').select('*').eq('date', todayStr);
    if (userId) burnsQuery = burnsQuery.eq('user_id', userId);
    const { data: burnsData } = await burnsQuery;
    const burns = burnsData || [];
    const caloriesBurned = burns?.[0]?.calories_burned || 0;

    const summary = {
      date: todayStr,
      totalCheckins,
      responded,
      totalCalories,
      workoutMinutes,
      readingMinutes,
      sleepMinutes,
      caloriesBurned,
      meals: todaysMeals,
      habits: todaysHabits,
    };

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    console.error('Error building checkin summary:', err);
    return NextResponse.json({ success: false, error: 'Failed to build summary' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { parseMealAndHabit } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { userId, message, type, data } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // If message provided, parse it with AI
    if (message) {
      const parsed = await parseMealAndHabit(message);
      const results: any = {};

      // Log meal
      if (parsed.meal) {
        const { data: mealData, error } = await supabaseAdmin
          .from('meal_logs')
          .insert({
            user_id: userId,
            description: parsed.meal.description,
            estimated_calories: parsed.meal.estimated_calories,
            timestamp: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error) results.meal = mealData;
      }

      // Log habits
      for (const [habitName, habitData] of Object.entries(parsed)) {
        if (habitName !== 'meal' && habitData) {
          const { data: habitLogData, error } = await supabaseAdmin
            .from('habit_logs')
            .insert({
              user_id: userId,
              habit_name: habitName,
              completed: (habitData as any).completed,
              duration_minutes: (habitData as any).duration_minutes || 0,
              date: today,
            })
            .select()
            .single();

          if (!error) results[habitName] = habitLogData;
        }
      }

      return NextResponse.json({ 
        success: true, 
        parsed,
        results 
      });
    }

    // Manual logging
    if (type === 'meal' && data) {
      const { data: mealData, error } = await supabaseAdmin
        .from('meal_logs')
        .insert({
          user_id: userId,
          description: data.description,
          estimated_calories: data.calories,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        meal: mealData 
      });
    }

    if (type === 'habit' && data) {
      const { data: habitData, error } = await supabaseAdmin
        .from('habit_logs')
        .insert({
          user_id: userId,
          habit_name: data.habitName,
          completed: data.completed,
          duration_minutes: data.duration || 0,
          date: today,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        habit: habitData 
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Log error:', error);
    return NextResponse.json({ 
      error: 'Failed to log data' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (type === 'meals') {
      const { data, error } = await supabaseAdmin
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', `${date}T00:00:00`)
        .lte('timestamp', `${date}T23:59:59`)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ meals: data });
    }

    if (type === 'habits') {
      const { data, error } = await supabaseAdmin
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date);

      if (error) throw error;
      return NextResponse.json({ habits: data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data' 
    }, { status: 500 });
  }
}

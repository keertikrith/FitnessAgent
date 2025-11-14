import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { parseGoal } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { userId, message, goalData } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let parsedGoal;

    // If message provided, parse it with AI
    if (message) {
      parsedGoal = await parseGoal(message);
    } else if (goalData) {
      parsedGoal = goalData;
    } else {
      return NextResponse.json({ error: 'Message or goal data required' }, { status: 400 });
    }

    // Insert goal into database
    const { data, error } = await supabaseAdmin
      .from('goals')
      .insert({
        user_id: userId,
        goal_type: parsedGoal.goal_type,
        target_change_kg: parsedGoal.target_change_kg,
        target_weeks: parsedGoal.target_weeks,
        daily_calorie_target: parsedGoal.daily_calorie_target,
        protein_target_g: parsedGoal.protein_target_g,
        workout_minutes: parsedGoal.workout_minutes,
        steps_target: parsedGoal.steps_target,
        start_date: new Date().toISOString().split('T')[0],
        notes: parsedGoal.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      goal: data 
    });
  } catch (error) {
    console.error('Goal creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create goal' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ goals: data });
  } catch (error) {
    console.error('Goal fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch goals' 
    }, { status: 500 });
  }
}

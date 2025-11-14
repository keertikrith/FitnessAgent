import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

// POST: /api/log/daily-burn
// Body: { userId: string, caloriesBurned: number, date?: 'YYYY-MM-DD' }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, caloriesBurned, date } = body || {};
    if (!userId || typeof caloriesBurned !== 'number') {
      return NextResponse.json({ error: 'userId and caloriesBurned are required' }, { status: 400 });
    }

    const day = date || new Date().toISOString().split('T')[0];

    const { error } = await supabaseAdmin.from('daily_burns').upsert({
      user_id: userId,
      date: day,
      calories_burned: caloriesBurned,
    }, { onConflict: 'user_id,date' });

    if (error) {
      console.error('Failed to upsert daily_burn:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('daily-burn error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

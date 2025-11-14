import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

// DELETE: /api/log/delete
// Body: { type: 'meal' | 'habit' | 'burn', id: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type, id } = body || {};

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    let table = '';
    if (type === 'meal') table = 'meal_logs';
    else if (type === 'habit') table = 'habit_logs';
    else if (type === 'burn') table = 'daily_burns';
    else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);

    if (error) {
      console.error(`Failed to delete ${type}:`, error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('delete error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

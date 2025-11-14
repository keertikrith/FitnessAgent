import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      users: [],
    };

    // Test each table
    const tables = ['users', 'goals', 'meal_logs', 'habit_logs', 'daily_insights'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results.tables[table] = { status: 'error', error: error.message };
        } else {
          results.tables[table] = { status: 'ok', count: data?.length || 0 };
        }
      } catch (err: any) {
        results.tables[table] = { status: 'error', error: err.message };
      }
    }

    // Get all users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, created_at');
    
    results.users = users || [];
    results.userCount = users?.length || 0;

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed',
      message: error.message 
    }, { status: 500 });
  }
}

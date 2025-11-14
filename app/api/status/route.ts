import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  const status: any = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing',
      geminiApiKey: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
    },
    database: {
      connection: '❌ Not tested',
      tables: {},
    },
    services: {
      gemini: '❌ Not tested',
      twilio: '❌ Not tested',
    },
  };

  // Test database connection
  try {
    const tables = ['users', 'goals', 'meal_logs', 'habit_logs', 'daily_insights'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          status.database.tables[table] = `❌ ${error.message}`;
        } else {
          status.database.tables[table] = '✅ OK';
        }
      } catch (err: any) {
        status.database.tables[table] = `❌ ${err.message}`;
      }
    }
    
    status.database.connection = '✅ Connected';
  } catch (error: any) {
    status.database.connection = `❌ ${error.message}`;
  }

  // Check if all tables are OK
  const allTablesOk = Object.values(status.database.tables).every(v => v === '✅ OK');
  
  return NextResponse.json({
    ...status,
    overall: allTablesOk && 
             status.environment.supabaseUrl === '✅ Set' &&
             status.environment.geminiApiKey === '✅ Set'
      ? '✅ System Ready'
      : '⚠️ Configuration Issues',
  });
}

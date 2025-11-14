import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { generateDailySummary } from '@/lib/gemini';
import { sendWhatsAppMessage, formatDailySummary } from '@/lib/twilio';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*');

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found' });
    }

    const summaries = [];

    for (const user of users) {
      // Get today's meals
      const { data: meals } = await supabaseAdmin
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: true });

      // Get today's habits
      const { data: habits } = await supabaseAdmin
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      // Get user's current goal
      const { data: goals } = await supabaseAdmin
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const goal = goals?.[0] || { 
        daily_calorie_target: 2000, 
        goal_type: 'maintenance' 
      };

      // Prepare data for Gemini
      const summaryData = {
        meals: meals?.map(m => ({
          description: m.description,
          calories: m.estimated_calories,
          time: new Date(m.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
        })) || [],
        habits: [
          { name: 'workout', completed: habits?.some(h => h.habit_name === 'workout' && h.completed) || false, duration: habits?.find(h => h.habit_name === 'workout')?.duration_minutes },
          { name: 'reading', completed: habits?.some(h => h.habit_name === 'reading' && h.completed) || false, duration: habits?.find(h => h.habit_name === 'reading')?.duration_minutes },
          { name: 'study', completed: habits?.some(h => h.habit_name === 'study' && h.completed) || false, duration: habits?.find(h => h.habit_name === 'study')?.duration_minutes },
          { name: 'meditation', completed: habits?.some(h => h.habit_name === 'meditation' && h.completed) || false, duration: habits?.find(h => h.habit_name === 'meditation')?.duration_minutes },
        ],
        goal: {
          calorie_target: goal.daily_calorie_target,
          goal_type: goal.goal_type,
        },
      };

      // Generate AI summary
      const aiSummary = await generateDailySummary(summaryData);

      // Store summary in database
      await supabaseAdmin
        .from('daily_insights')
        .insert({
          user_id: user.id,
          date: today,
          summary_json: aiSummary,
          summary_text: formatDailySummary(aiSummary),
        });

      // Send WhatsApp summary
      const message = formatDailySummary(aiSummary);
      await sendWhatsAppMessage(message);

      summaries.push({
        user: user.name,
        summary: aiSummary,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Daily summaries generated for ${summaries.length} users`,
      summaries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate summaries' 
    }, { status: 500 });
  }
}

// Allow POST for manual triggers
export async function POST() {
  return GET();
}

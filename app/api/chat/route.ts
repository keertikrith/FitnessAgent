import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { generateText } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { userId, message } = await request.json();

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's data for context
    const today = new Date().toISOString().split('T')[0];

    // Get today's meals
    const { data: meals } = await supabaseAdmin
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`)
      .order('timestamp', { ascending: true });

    // Get today's habits
    const { data: habits } = await supabaseAdmin
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    // Get user's current goal
    const { data: goals } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Get last 7 days of meals for better context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentMeals } = await supabaseAdmin
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    // Calculate totals
    const totalCaloriesToday = meals?.reduce((sum, m) => sum + m.estimated_calories, 0) || 0;
    const calorieTarget = goals?.[0]?.daily_calorie_target || 2000;
    const habitsCompleted = habits?.filter(h => h.completed) || [];
    const habitsMissed = ['workout', 'reading', 'study', 'meditation'].filter(
      h => !habits?.some(habit => habit.habit_name === h && habit.completed)
    );

    // Build context for Gemini
    const contextPrompt = `You are a helpful AI health assistant. You have access to the user's health data.

USER'S CURRENT DATA:
- Today's Date: ${today}
- Total Calories Today: ${totalCaloriesToday} kcal
- Calorie Target: ${calorieTarget} kcal
- Calories Remaining: ${calorieTarget - totalCaloriesToday} kcal

TODAY'S MEALS:
${meals && meals.length > 0 ? meals.map(m => `- ${m.description} (${m.estimated_calories} kcal) at ${new Date(m.timestamp).toLocaleTimeString()}`).join('\n') : '- No meals logged yet'}

TODAY'S HABITS:
- Completed: ${habitsCompleted.length > 0 ? habitsCompleted.map(h => `${h.habit_name} (${h.duration_minutes} min)`).join(', ') : 'None'}
- Not completed yet: ${habitsMissed.join(', ')}

CURRENT GOAL:
${goals && goals.length > 0 ? `- Type: ${goals[0].goal_type}
- Target: ${goals[0].target_change_kg ? `${goals[0].target_change_kg}kg in ${goals[0].target_weeks} weeks` : 'Not specified'}
- Daily Calorie Target: ${goals[0].daily_calorie_target} kcal
- Protein Target: ${goals[0].protein_target_g || 'Not set'}g
- Workout Target: ${goals[0].workout_minutes || 'Not set'} min/day` : '- No goal set yet'}

RECENT MEAL HISTORY (Last 7 days):
${recentMeals && recentMeals.length > 0 ? recentMeals.slice(0, 10).map(m => `- ${m.description} (${m.estimated_calories} kcal)`).join('\n') : '- No recent meals'}

USER'S QUESTION: "${message}"

INSTRUCTIONS:
- Answer the user's question based on their actual data above
- Be conversational, friendly, and encouraging
- Use emojis appropriately
- If they ask about calories, meals, habits, or goals, use the specific data provided
- If they're asking for advice, give personalized suggestions based on their data
- Keep responses concise but informative (2-4 sentences usually)
- If the question is not related to their health data, still answer helpfully

Provide a natural, conversational response:`;

    // Call Gemini via shared helper to generate conversational text
    const aiResponse = await generateText(contextPrompt);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      context: {
        totalCaloriesToday,
        calorieTarget,
        mealsCount: meals?.length || 0,
        habitsCompleted: habitsCompleted.length,
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: 'Failed to process chat',
      details: error.message,
    }, { status: 500 });
  }
}

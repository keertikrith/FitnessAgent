import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { generateDailySummary } from '@/lib/gemini';

function getHourInTimezone(tz = 'UTC') {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      hour: '2-digit',
    }).formatToParts(now as any);
    const hourPart = parts.find((p) => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : now.getUTCHours();
  } catch (e) {
    return new Date().getUTCHours();
  }
}

// POST: Generate and send daily summary report at 10pm
export async function POST(request: NextRequest) {
  try {
    // Optional: verify cron secret when set. Twilio webhook won't set this header,
    // so keep it optional (only enforced if CRON_SECRET is configured in Vercel/GitHub).
    const cronSecret = process.env.CRON_SECRET;
    const incomingToken = request.headers.get('x-cron-token');
    if (cronSecret && incomingToken !== cronSecret) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId: bodyUserId } = body || {};

    const envUserId = process.env.CHECKIN_USER_ID;
    const envUserPhone = process.env.CHECKIN_USER_PHONE;
    const tz = process.env.CHECKIN_TIMEZONE || 'UTC';

    // Only allow sends at 10pm (22:00)
    const hour = getHourInTimezone(tz);
    if (hour !== 22) {
      return NextResponse.json({ success: true, sent: 0, message: `Current hour ${hour} is not report time. Report sends at 22:00 (10pm)` });
    }

    // Determine the target user
    let usersQuery = supabaseAdmin.from('users').select('*').not('phone', 'is', null);
    if (bodyUserId) {
      usersQuery = supabaseAdmin.from('users').select('*').eq('id', bodyUserId).not('phone', 'is', null).limit(1);
    } else if (envUserId) {
      usersQuery = supabaseAdmin.from('users').select('*').eq('id', envUserId).not('phone', 'is', null).limit(1);
    } else if (envUserPhone) {
      usersQuery = supabaseAdmin.from('users').select('*').eq('phone', envUserPhone).limit(1);
    }

    const { data: users, error: usersError } = await usersQuery;
    if (usersError) {
      console.error('Error fetching users for report:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const today = new Date().toISOString().split('T')[0];
    let sentCount = 0;

    for (const user of users) {
      try {
        // Fetch today's data
        const [mealsRes, habitsRes, burnsRes] = await Promise.all([
          supabaseAdmin
            .from('meal_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`),
          supabaseAdmin
            .from('habit_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`),
          supabaseAdmin
            .from('daily_burns')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single(),
        ]);

        const meals = mealsRes.data || [];
        const habits = habitsRes.data || [];
        const burn = burnsRes.data;

        // Calculate totals
        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const caloriesBurned = burn?.calories_burned || 0;
        const deficit = caloriesBurned - totalCalories;

        // Build summary message
        let reportMessage = `📊 *Daily Report - ${new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}*\n\n`;

        // Calories
        reportMessage += `🍽️ *Nutrition:*\n`;
        reportMessage += `  Consumed: ${totalCalories} kcal\n`;
        reportMessage += `  Burned: ${caloriesBurned} kcal\n`;
        reportMessage += `  Balance: ${deficit > 0 ? '✅ -' + deficit + ' kcal (deficit)' : '⚠️ +' + Math.abs(deficit) + ' kcal (surplus)'}\n\n`;

        // Habits
        if (habits.length > 0) {
          reportMessage += `💪 *Habits Completed:*\n`;
          const habitCounts: { [key: string]: number } = {};
          habits.forEach(h => {
            habitCounts[h.habit_name] = (habitCounts[h.habit_name] || 0) + 1;
          });
          Object.entries(habitCounts).forEach(([name, count]) => {
            const emoji = { workout: '🏋️', reading: '📚', sleep: '😴', study: '📖', meditation: '🧘' }[name] || '✓';
            reportMessage += `  ${emoji} ${name}: ${count}x\n`;
          });
          reportMessage += '\n';
        }

        // Meals
        if (meals.length > 0) {
          reportMessage += `🍴 *Meals Logged:*\n`;
          meals.forEach(meal => {
            reportMessage += `  • ${meal.meal_name} (${meal.calories} kcal)\n`;
          });
        }

        reportMessage += `\n🎯 Keep crushing your goals tomorrow! 💪`;

        const result = await sendWhatsAppMessage(reportMessage, user.phone);

        // Record report as ai_checkin with type 'report'
        const { error: insertError } = await supabaseAdmin.from('ai_checkins').insert({
          user_id: user.id,
          scheduled_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          status: 'sent',
          message_sid: result?.sid,
          checkin_type: 'report',
        });

        if (insertError) console.error('Error inserting report record:', insertError);
        sentCount++;
      } catch (err) {
        console.error('Error sending report to', user.email || user.id, err);
        // record failed attempt
        try {
          await supabaseAdmin.from('ai_checkins').insert({
            user_id: user.id,
            scheduled_at: new Date().toISOString(),
            status: 'failed',
            checkin_type: 'report',
          });
        } catch (e) {
          console.error('Failed to record failed report:', e);
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Report send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Report endpoint active', timestamp: new Date().toISOString() });
}

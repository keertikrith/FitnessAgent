import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { parseMealAndHabit, parseGoal, generateText } from '@/lib/gemini';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  let from = '';
  
  try {
    const formData = await request.formData();
    const body = formData.get('Body')?.toString() || '';
    from = formData.get('From')?.toString() || '';
    
    console.log('WhatsApp webhook received:', { body, from });

    // Get user by phone number or use most recent user
    let user;
    
    // Try to find user by phone
    const { data: usersByPhone } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', from)
      .limit(1);
    
    if (usersByPhone && usersByPhone.length > 0) {
      user = usersByPhone[0];
      console.log('Found user by phone:', user.email);
    } else {
      // Fallback: get the most recent user (for testing)
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!allUsers || allUsers.length === 0) {
        console.log('No users found in database');
        await sendWhatsAppMessage(
          '❌ No user account found. Please sign up at ' + process.env.NEXT_PUBLIC_BASE_URL,
          from
        );
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      user = allUsers[0];
      console.log('Using most recent user:', user.email);
      
      // Update user's phone number for future messages
      await supabaseAdmin
        .from('users')
        .update({ phone: from })
        .eq('id', user.id);
      
      console.log('Updated user phone number');
    }

    const message = body.toLowerCase();

    // Check if it's a goal-setting message
    if (message.includes('goal') || message.includes('lose') || message.includes('gain') || message.includes('kg')) {
      console.log('Processing as goal message');
      const goalData = await parseGoal(body);
      
      // Insert goal into database
      const { error } = await supabaseAdmin
        .from('goals')
        .insert({
          user_id: user.id,
          goal_type: goalData.goal_type,
          target_change_kg: goalData.target_change_kg,
          target_weeks: goalData.target_weeks,
          daily_calorie_target: goalData.daily_calorie_target,
          protein_target_g: goalData.protein_target_g,
          workout_minutes: goalData.workout_minutes,
          steps_target: goalData.steps_target,
          start_date: new Date().toISOString().split('T')[0],
          notes: goalData.notes,
        });

      if (error) {
        console.error('Goal insert error:', error);
        throw error;
      }

      // Build a prompt for Gemini to generate a user-friendly goal confirmation
      const goalPrompt = `You are a friendly health coach. A user just set this goal:\n${JSON.stringify(goalData, null, 2)}\n\nRespond with a short confirmation message summarizing the goal, daily targets, and one encouraging sentence. Keep it concise (1-2 sentences).`;
      try {
        const aiReply = await generateText(goalPrompt);
        await sendWhatsAppMessage(aiReply, from);
      } catch (e) {
        console.error('Failed to generate goal confirmation via Gemini:', e);
        const fallback = `🎯 Goal set successfully! Target: ${goalData.target_change_kg ? `${goalData.target_change_kg}kg in ${goalData.target_weeks} weeks` : goalData.goal_type}. Daily Calories: ${goalData.daily_calorie_target} kcal. I'll help you track your progress!`;
        await sendWhatsAppMessage(fallback, from);
      }

      return NextResponse.json({ success: true });
    }

    // Parse meal and habit message
    console.log('Processing as meal/habit message');
    const parsed = await parseMealAndHabit(body);
    console.log('Parsed result:', parsed);
    if ((parsed as any)._error) {
      console.warn('AI parsing returned error:', (parsed as any)._error);
      // Notify user that AI parsing wasn't available but we logged the message
      // We'll still attempt to mark the checkin and store raw text in parsed_json fallback
      try {
        const { error: rawInsertError } = await supabaseAdmin.from('ai_checkins').insert({
          user_id: user.id,
          scheduled_at: new Date().toISOString(),
          sent_at: null,
          status: 'responded',
          parsed_json: { fallback_raw: body, note: 'AI unavailable' }
        });
        if (rawInsertError) console.error('Failed to insert fallback ai_checkin:', rawInsertError);
      } catch (e) {
        console.error('Error inserting fallback ai_checkin:', e);
      }
      await sendWhatsAppMessage('I couldn\'t analyze that with AI right now — I saved your reply and will process it shortly.', from);
    }
    // Mark related checkin (if any) as responded and attach parsed JSON
    try {
      const recentWindow = new Date();
      recentWindow.setHours(recentWindow.getHours() - 12);
      const { error: updateError } = await supabaseAdmin
        .from('ai_checkins')
        .update({ responded_at: new Date().toISOString(), status: 'responded', parsed_json: parsed })
        .eq('user_id', user.id)
        .eq('status', 'sent')
        .gte('scheduled_at', recentWindow.toISOString())
        .limit(1);

      if (updateError) console.error('Failed to update ai_checkin on response:', updateError);
    } catch (e) {
      console.error('Error updating ai_checkins record:', e);
    }
    
    const today = new Date().toISOString().split('T')[0];
    let responseMessages: string[] = [];

    // Log meal if present
    if (parsed.meal) {
      console.log('Logging meal:', parsed.meal);
      const { error } = await supabaseAdmin
        .from('meal_logs')
        .insert({
          user_id: user.id,
          description: parsed.meal.description,
          estimated_calories: parsed.meal.estimated_calories,
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Meal insert error:', error);
      } else {
        // Get today's total calories
        const { data: todayMeals } = await supabaseAdmin
          .from('meal_logs')
          .select('estimated_calories')
          .eq('user_id', user.id)
          .gte('timestamp', `${today}T00:00:00`)
          .lte('timestamp', `${today}T23:59:59`);

        const totalCalories = todayMeals?.reduce((sum, m) => sum + m.estimated_calories, 0) || 0;

        // Get user's calorie target
        const { data: goals } = await supabaseAdmin
          .from('goals')
          .select('daily_calorie_target')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const target = goals?.[0]?.daily_calorie_target || 2000;

        responseMessages.push(`✅ Logged: ${parsed.meal.description} (${parsed.meal.estimated_calories} kcal)\n📊 Total today: ${totalCalories}/${target} kcal`);
      }
    }

    // Log habits
    const habitMap = {
      workout: '💪 Workout',
      reading: '📚 Reading',
      study: '📖 Study',
      meditation: '🧘‍♀️ Meditation',
    };

    for (const [habitName, habitData] of Object.entries(parsed)) {
      if (habitName === 'meal') continue;
      if (!habitData) continue;

      console.log(`Logging habit: ${habitName}`, habitData);

      try {
        if (habitName === 'sleep') {
          // handle sleep specially: prefer duration if present, otherwise compute from start/end
          let duration = (habitData as any).duration_minutes || 0;
          if (!duration && (habitData as any).start_time && (habitData as any).end_time) {
            try {
              const start = new Date((habitData as any).start_time);
              const end = new Date((habitData as any).end_time);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                duration = Math.round((end.getTime() - start.getTime()) / 60000);
              }
            } catch (e) {
              // ignore parsing errors
            }
          }

          const { error } = await supabaseAdmin.from('habit_logs').upsert({
            user_id: user.id,
            habit_name: 'sleep',
            completed: true,
            duration_minutes: duration,
            date: today,
          }, { onConflict: 'user_id,habit_name,date' });

          if (error) console.error('Sleep insert error:', error);
          else responseMessages.push(`😴 Sleep logged (${duration} min).`);
          continue;
        }

        // Upsert other habits
        const { error } = await supabaseAdmin
          .from('habit_logs')
          .upsert({
            user_id: user.id,
            habit_name: habitName,
            completed: (habitData as any).completed,
            duration_minutes: (habitData as any).duration_minutes || 0,
            date: today,
          }, {
            onConflict: 'user_id,habit_name,date'
          });

        if (error) {
          console.error(`Habit insert error for ${habitName}:`, error);
        } else if ((habitData as any).completed) {
          const duration = (habitData as any).duration_minutes ? ` (${(habitData as any).duration_minutes} min)` : '';
          responseMessages.push(`${habitMap[habitName as keyof typeof habitMap] || habitName} logged${duration}! Great job! 🎉`);
        }
      } catch (e) {
        console.error('Error handling habit:', habitName, e);
      }
    }

    // Compose a prompt for Gemini to generate a user-facing reply based on parsed content
    let replySent = false;
    try {
      const summaryForAI: any = {
        parsed,
        messages: responseMessages,
      };

      // add today's totals and target for context
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMeals } = await supabaseAdmin
        .from('meal_logs')
        .select('description,estimated_calories')
        .eq('user_id', user.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);

      const totalCalories = (todayMeals || []).reduce((sum: number, m: any) => sum + (m.estimated_calories || 0), 0);
      const { data: goals } = await supabaseAdmin
        .from('goals')
        .select('daily_calorie_target')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const target = goals?.[0]?.daily_calorie_target || 2000;

      const replyPrompt = `You are a concise friendly health assistant communicating via WhatsApp. A user message was: "${body}".\n\nParsed data: ${JSON.stringify(parsed)}\n\nToday's total calories: ${totalCalories}/${target} kcal.\n\nSystem notes: ${JSON.stringify(summaryForAI)}\n\nGenerate a clear helpful WhatsApp-style reply that: 1) Acknowledges what was logged (meals/habits) if any; 2) Provides the updated totals where relevant; 3) Suggests one quick tip or encouragement. Keep it under 2 short paragraphs and include relevant emojis.`;

      const aiReply = await generateText(replyPrompt);
      if (aiReply) {
        await sendWhatsAppMessage(aiReply, from);
        replySent = true;
      }
    } catch (e) {
      console.error('Failed to generate reply via Gemini:', e);
    }

    if (!replySent) {
      const fallbackReply = responseMessages.length > 0 ? responseMessages.join('\n\n') : "Got it! Keep up the great work! 💪";
      console.log('Sending fallback reply:', fallbackReply);
      await sendWhatsAppMessage(fallbackReply, from);
    }

    return NextResponse.json({ success: true, parsed });
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Try to send error message to user (from is already captured above)
    if (from) {
      try {
        await sendWhatsAppMessage(
          '❌ Sorry, I encountered an error processing your message. Please try again or use the web app.',
          from
        );
      } catch (sendError) {
        console.error('Error sending error message:', sendError);
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Twilio requires GET endpoint for webhook validation
export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}

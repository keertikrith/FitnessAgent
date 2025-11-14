import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioFrom = process.env.TWILIO_FROM!;
const whatsappTo = process.env.WHATSAPP_TO!;

const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(message: string, to?: string) {
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioFrom,
      to: to || whatsappTo,
    });
    
    console.log('WhatsApp message sent:', result.sid);
    return result;
  } catch (error) {
    console.error('Twilio error:', error);
    throw new Error('Failed to send WhatsApp message');
  }
}

export function formatCheckInMessage(userName: string = 'there'): string {
  return `⏰ Hey ${userName}! Quick check-in:

🍽️ Did you eat anything?
💪 Worked out?
📚 Read or studied?
🧘‍♀️ Meditated?

Just reply naturally and I'll log it for you!`;
}

export function formatDailySummary(summary: any): string {
  const { day_summary, goal_gap_analysis, tomorrow_plan, motivation_snippet } = summary;
  
  return `📊 Daily Summary

✅ Today's Highlights:
• Total Calories: ${day_summary.total_calories} kcal
• Habits Done: ${day_summary.habits_done.join(', ') || 'None'}
• ${day_summary.highlights}

📈 Goal Progress:
${goal_gap_analysis.notes}
(${goal_gap_analysis.calorie_delta > 0 ? '+' : ''}${goal_gap_analysis.calorie_delta} kcal from target)

🗓 Tomorrow's Plan:
Meals: ${tomorrow_plan.meals.join(' | ')}
Focus: ${tomorrow_plan.focus}

💪 ${motivation_snippet}`;
}

/*
  scripts/send_report.js
  - Runs in GitHub Actions or locally with env vars set
  - Generates daily report and posts via Twilio
*/

const twilio = require('twilio');
// Use native fetch (available in Node 18+)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM;
const CHECKIN_USER_ID = process.env.CHECKIN_USER_ID;
const CHECKIN_USER_PHONE = process.env.CHECKIN_USER_PHONE;
const TZ = process.env.CHECKIN_TIMEZONE || 'UTC';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
  console.error('Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)');
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

function getHourInTimezone(tz = 'UTC') {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      hour: '2-digit',
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : now.getUTCHours();
  } catch (e) {
    return new Date().getUTCHours();
  }
}

async function fetchTodayData(userId) {
  const today = new Date().toISOString().split('T')[0];
  const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
  const [mealsRes, habitsRes, burnsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/meal_logs?user_id=eq.${userId}&created_at=gte.${today}T00:00:00&created_at=lte.${today}T23:59:59`, { headers }).then(r => r.json()),
    fetch(`${SUPABASE_URL}/rest/v1/habit_logs?user_id=eq.${userId}&created_at=gte.${today}T00:00:00&created_at=lte.${today}T23:59:59`, { headers }).then(r => r.json()),
    fetch(`${SUPABASE_URL}/rest/v1/daily_burns?user_id=eq.${userId}&date=eq.${today}`, { headers }).then(r => r.json())
  ]);
  return { meals: mealsRes || [], habits: habitsRes || [], burns: burnsRes && burnsRes[0] ? burnsRes[0] : null };
}

function formatReportMessage(summary, dateLabel) {
  const { meals, habits, burns } = summary;
  const totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const caloriesBurned = burns ? (burns.calories_burned || 0) : 0;
  const deficit = caloriesBurned - totalCalories;
  let msg = `📊 Daily Summary - ${dateLabel}\n\n`;
  msg += `🍽️ Nutrition:\n  Consumed: ${totalCalories} kcal\n  Burned: ${caloriesBurned} kcal\n  Balance: ${deficit > 0 ? '-' + deficit + ' kcal (deficit) ✅' : '+' + Math.abs(deficit) + ' kcal (surplus) ⚠️'}\n\n`;
  if (habits.length) {
    msg += `💪 Habits:\n`;
    const counts = {};
    habits.forEach(h => { counts[h.habit_name] = (counts[h.habit_name]||0)+1; });
    for (const [k,v] of Object.entries(counts)) {
      msg += ` • ${k}: ${v}x\n`;
    }
    msg += '\n';
  }
  if (meals.length) {
    msg += `🍴 Meals:\n`;
    meals.forEach(m => { msg += ` • ${m.meal_name || 'Meal'} (${m.calories || 0} kcal)\n`; });
    msg += '\n';
  }
  msg += `🎯 Keep crushing your goals tomorrow! 💪`;
  return msg;
}

async function fetchUsers() {
  let url = `${SUPABASE_URL}/rest/v1/users?select=*`;
  if (CHECKIN_USER_ID) url = `${SUPABASE_URL}/rest/v1/users?id=eq.${CHECKIN_USER_ID}`;
  else if (CHECKIN_USER_PHONE) url = `${SUPABASE_URL}/rest/v1/users?phone=eq.${encodeURIComponent(CHECKIN_USER_PHONE)}`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

async function insertAiCheckin(userId, status, sid) {
  const url = `${SUPABASE_URL}/rest/v1/ai_checkins`;
  const body = [{ user_id: userId, scheduled_at: new Date().toISOString(), sent_at: new Date().toISOString(), status, message_sid: sid || null, checkin_type: 'report' }];
  await fetch(url, { method: 'POST', headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(body)});
}

(async () => {
  try {
    const hour = getHourInTimezone(TZ);
    if (hour !== 22) {
      console.log(`Hour ${hour} is not report time; exiting.`);
      process.exit(0);
    }

    const users = await fetchUsers();
    if (!users || users.length === 0) { console.log('No users found'); process.exit(0); }

    const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'});

    for (const user of users) {
      try {
        const summary = await fetchTodayData(user.id);
        const msg = formatReportMessage(summary, todayLabel);
        const to = user.phone || CHECKIN_USER_PHONE;
        const res = await client.messages.create({ body: msg, from: TWILIO_FROM, to });
        console.log('Report sent to', to, 'sid=', res.sid);
        await insertAiCheckin(user.id, 'sent', res.sid);
      } catch (err) {
        console.error('Error sending report to', user.id, err);
        try { await insertAiCheckin(user.id, 'failed', null); } catch(e){console.error('failed to record',e)}
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Fatal report error', err);
    process.exit(1);
  }
})();

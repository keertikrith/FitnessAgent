/*
  scripts/send_checkins.js
  - Runs in GitHub Actions or locally with env vars set
  - Sends check-in messages to configured user(s) and records ai_checkins in Supabase
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

function formatCheckInMessage(userName = 'there') {
  return `⏰ Hey ${userName}! Quick check-in:\n\n🍽️ Did you eat anything?\n💪 Worked out?\n📚 Read or studied?\n🧘‍♀️ Meditated?\n\nJust reply naturally and I'll log it for you!`;
}

async function fetchUsers() {
  // If CHECKIN_USER_ID specified, fetch that user; if CHECKIN_USER_PHONE, use that; else fetch all users with phone
  let url = `${SUPABASE_URL}/rest/v1/users?select=*`;
  if (CHECKIN_USER_ID) {
    url = `${SUPABASE_URL}/rest/v1/users?id=eq.${CHECKIN_USER_ID}`;
  } else if (CHECKIN_USER_PHONE) {
    url = `${SUPABASE_URL}/rest/v1/users?phone=eq.${encodeURIComponent(CHECKIN_USER_PHONE)}`;
  }
  // supabase REST requires anon or service role key; use service role key in header
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch users: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data;
}

async function insertAiCheckin(userId, status, messageSid, checkinType = 'checkin') {
  const url = `${SUPABASE_URL}/rest/v1/ai_checkins`;
  const body = [{ user_id: userId, scheduled_at: new Date().toISOString(), sent_at: new Date().toISOString(), status, message_sid: messageSid || null, checkin_type: checkinType }];
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Failed to insert ai_checkin:', res.status, text);
  }
}

async function sendMessage(body, to) {
  const result = await client.messages.create({ body, from: TWILIO_FROM, to });
  return result;
}

(async () => {
  try {
    const hour = getHourInTimezone(TZ);
    const allowedHours = [9, 12, 15, 18, 21];
    if (!allowedHours.includes(hour)) {
      console.log(`Hour ${hour} is not a check-in time; exiting.`);
      process.exit(0);
    }

    const users = await fetchUsers();
    if (!users || users.length === 0) {
      console.log('No users found for check-ins');
      process.exit(0);
    }

    for (const user of users) {
      try {
        const message = formatCheckInMessage(user.name || 'there');
        const to = user.phone || CHECKIN_USER_PHONE;
        const res = await sendMessage(message, to);
        console.log('Sent to', to, 'sid=', res.sid);
        await insertAiCheckin(user.id, 'sent', res.sid, 'checkin');
      } catch (err) {
        console.error('Error sending to user', user.id, err);
        try { await insertAiCheckin(user.id, 'failed', null, 'checkin'); } catch(e){console.error('failed insert',e)}
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
})();

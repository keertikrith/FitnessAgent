import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendWhatsAppMessage, formatCheckInMessage } from '@/lib/twilio';

// Environment variables (set these in Vercel project settings):
// - CHECKIN_USER_ID (optional): prefer user by id
// - CHECKIN_USER_PHONE (optional): fallback to phone if id not set
// - CHECKIN_TIMEZONE (optional): IANA timezone string (default: 'UTC')

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

// POST: trigger check-ins at 9am, 12pm, 3pm, 6pm, 9pm (5 checkins)
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

    // Only allow sends at specific check-in hours: 9, 12, 15, 18, 21 (3-hour intervals from 9am to 9pm)
    const hour = getHourInTimezone(tz);
    const allowedHours = [9, 12, 15, 18, 21];
    if (!allowedHours.includes(hour)) {
      return NextResponse.json({ success: true, sent: 0, message: `Current hour ${hour} is not a check-in time. Allowed: 9, 12, 15, 18, 21` });
    }

    // Determine the target user: body userId -> env user id -> env phone -> all users
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
      console.error('Error fetching users for checkin:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const scheduledAt = new Date().toISOString();
    let sentCount = 0;

    for (const user of users) {
      try {
        const message = formatCheckInMessage(user.name || 'there');

        const result = await sendWhatsAppMessage(message, user.phone);

        // Insert checkin record
        const { error: insertError } = await supabaseAdmin.from('ai_checkins').insert({
          user_id: user.id,
          scheduled_at: scheduledAt,
          sent_at: new Date().toISOString(),
          status: 'sent',
          message_sid: result?.sid,
        });

        if (insertError) console.error('Error inserting ai_checkin:', insertError);
        sentCount++;
      } catch (err) {
        console.error('Error sending checkin to', user.email || user.id, err);
        // record failed attempt
        try {
          await supabaseAdmin.from('ai_checkins').insert({
            user_id: user.id,
            scheduled_at: scheduledAt,
            status: 'failed',
          });
        } catch (e) {
          console.error('Failed to record failed checkin:', e);
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Checkin send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Checkin endpoint active', timestamp: new Date().toISOString() });
}

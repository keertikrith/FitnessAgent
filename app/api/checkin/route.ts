import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendWhatsAppMessage, formatCheckInMessage } from '@/lib/twilio';

export async function GET() {
  try {
    // Get all active users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) throw error;

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found' });
    }

    // Send check-in message to each user
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const message = formatCheckInMessage(user.name);
        return await sendWhatsAppMessage(message);
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Check-in sent to ${successful} users (${failed} failed)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ 
      error: 'Failed to send check-ins' 
    }, { status: 500 });
  }
}

// Allow POST for manual triggers
export async function POST() {
  return GET();
}

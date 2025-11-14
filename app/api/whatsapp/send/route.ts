import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { message, to } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(message, to);

    return NextResponse.json({ 
      success: true, 
      messageSid: result.sid 
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    return NextResponse.json({ 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}

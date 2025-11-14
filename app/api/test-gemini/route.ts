import { NextResponse } from 'next/server';
import { parseMealAndHabit } from '@/lib/gemini';

export async function GET() {
  try {
    const testMessage = "Had dosa and chai for breakfast";
    
    console.log('Testing Gemini API with message:', testMessage);
    
    const result = await parseMealAndHabit(testMessage);
    
    return NextResponse.json({
      success: true,
      testMessage,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

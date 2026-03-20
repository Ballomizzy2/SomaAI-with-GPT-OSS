import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { exerciseId, exerciseTitle, completed, duration } = await request.json();

    const exerciseLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      exerciseId,
      exerciseTitle,
      completed: completed !== false, // default to true
      duration
    };

    return NextResponse.json({
      success: true,
      exerciseLog
    });
  } catch (error) {
    console.error('Error logging exercise:', error);
    return NextResponse.json(
      { error: 'Failed to log exercise' },
      { status: 500 }
    );
  }
}

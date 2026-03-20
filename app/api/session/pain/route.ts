import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { region, quality, severity, days_since_onset, notes } = await request.json();

    // In a client-side app, we'd return instructions to store in localStorage
    // Since this is server-side, we'll return the log structure for the client to store
    const painLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      region,
      quality,
      severity,
      days_since_onset,
      notes
    };

    return NextResponse.json({
      success: true,
      painLog
    });
  } catch (error) {
    console.error('Error logging pain:', error);
    return NextResponse.json(
      { error: 'Failed to log pain report' },
      { status: 500 }
    );
  }
}

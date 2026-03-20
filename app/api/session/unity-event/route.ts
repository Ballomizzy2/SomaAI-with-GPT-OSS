import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, payload, ts } = body ?? {};

    if (!eventName || typeof eventName !== 'string') {
      return NextResponse.json({ error: 'Missing eventName' }, { status: 400 });
    }

    // Backend-loop placeholder: today we just acknowledge receipt.
    // Later you can swap this to FastAPI/DB without touching Unity or the client listener.
    return NextResponse.json({
      success: true,
      received: { eventName, payload: payload ?? null, ts: ts ?? Date.now() },
    });
  } catch (error) {
    console.error('Error logging unity event:', error);
    return NextResponse.json({ error: 'Failed to log unity event' }, { status: 500 });
  }
}


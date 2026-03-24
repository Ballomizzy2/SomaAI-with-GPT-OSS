import { NextResponse } from 'next/server';

function normalizeConnectionPreference(
  value: string | undefined
): 'websocket' | 'webrtc' {
  const normalized = (value || '').trim().toLowerCase();
  return normalized === 'webrtc' ? 'webrtc' : 'websocket';
}

async function fetchConversationToken(apiKey: string, agentId: string): Promise<string> {
  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/token');
  url.searchParams.set('agent_id', agentId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token endpoint failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  const token = typeof data?.token === 'string' ? data.token : '';
  if (!token) {
    throw new Error('Token endpoint returned no token');
  }
  return token;
}

async function fetchSignedUrl(apiKey: string, agentId: string): Promise<string> {
  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');
  url.searchParams.set('agent_id', agentId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Signed-url endpoint failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  const signedUrl = typeof data?.signed_url === 'string' ? data.signed_url : '';
  if (!signedUrl) {
    throw new Error('Signed-url endpoint returned no signed_url');
  }
  return signedUrl;
}

export async function POST(request: Request) {
  try {
    const { painContext } = await request.json();

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY?.trim();
    const AGENT_ID = process.env.ELEVENLABS_AGENT_ID?.trim();

    if (!ELEVENLABS_API_KEY || !AGENT_ID) {
      const missing: string[] = [];
      if (!ELEVENLABS_API_KEY) missing.push('ELEVENLABS_API_KEY');
      if (!AGENT_ID) missing.push('ELEVENLABS_AGENT_ID');
      console.error('[ElevenLabs] Missing env:', missing.join(', '));
      return NextResponse.json(
        {
          error: 'ElevenLabs configuration missing',
          missingKeys: missing,
          hint:
            'Add ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID to .env or .env.local, then restart the dev server. See .env.example.',
        },
        { status: 500 }
      );
    }

    // Build the first message based on pain context (passed back to the client)
    const firstMessage = painContext?.region
      ? `I understand you're noticing ${painContext.quality || 'a sensation'} in your ${painContext.region}${typeof painContext.severity === 'number' ? ` (intensity ${painContext.severity}/10)` : ''}. Let's talk about what you're feeling and help your nervous system feel safe.`
      : "Hi, I'm your Soma AI coach. How are you feeling today?";
    const preferredConnection = normalizeConnectionPreference(
      process.env.ELEVENLABS_CONNECTION_TYPE
    );

    // Default to websocket for stable browser behavior.
    let conversationToken: string | null = null;
    let signedUrl: string | null = null;
    let connectionType: 'webrtc' | 'websocket' = preferredConnection;

    if (preferredConnection === 'websocket') {
      try {
        signedUrl = await fetchSignedUrl(ELEVENLABS_API_KEY, AGENT_ID);
        connectionType = 'websocket';
      } catch (signedUrlError) {
        console.warn('ElevenLabs signed-url endpoint failed; falling back to token:', signedUrlError);
        try {
          conversationToken = await fetchConversationToken(ELEVENLABS_API_KEY, AGENT_ID);
          connectionType = 'webrtc';
        } catch (tokenError) {
          console.error('ElevenLabs both signed-url and token endpoints failed:', {
            signedUrlError,
            tokenError,
          });
          return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 502 }
          );
        }
      }
    } else {
      try {
        conversationToken = await fetchConversationToken(ELEVENLABS_API_KEY, AGENT_ID);
        connectionType = 'webrtc';
      } catch (tokenError) {
        console.warn('ElevenLabs token endpoint failed; falling back to signed URL:', tokenError);
        try {
          signedUrl = await fetchSignedUrl(ELEVENLABS_API_KEY, AGENT_ID);
          connectionType = 'websocket';
        } catch (signedUrlError) {
          console.error('ElevenLabs both token and signed-url endpoints failed:', {
            tokenError,
            signedUrlError,
          });
          return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 502 }
          );
        }
      }
    }

    return NextResponse.json({
      connectionType,
      conversationToken,
      signedUrl,
      firstMessage,
    });

  } catch (error) {
    console.error('Error creating signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

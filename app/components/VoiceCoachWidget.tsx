'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Conversation } from '@elevenlabs/client';
import { logConversation } from '../lib/sessionStorage';

interface PainContext {
  region?: string;
  quality?: string;
  severity?: number;
  days_since_onset?: string | number;
  notes?: string;
}

interface VoiceCoachWidgetProps {
  painContext?: PainContext;
  embedded?: boolean;
  persistent?: boolean;
}

type SessionStatus = 'idle' | 'connecting' | 'connected';
type VoiceMode = 'idle' | 'listening' | 'speaking';

type ElevenConfig = {
  connectionType?: 'websocket' | 'webrtc';
  signedUrl?: string | null;
  conversationToken?: string | null;
};

export default function VoiceCoachWidget({
  painContext,
  embedded,
  persistent = false,
}: VoiceCoachWidgetProps) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [mode, setMode] = useState<VoiceMode>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const statusRef = useRef<SessionStatus>('idle');
  const modeRef = useRef<VoiceMode>('idle');
  const inFlightStartRef = useRef(false);
  const lastStartAtRef = useRef(0);
  const startTimerRef = useRef<number | null>(null);
  const contextRef = useRef<PainContext | null>(painContext || null);
  const orbRef = useRef<HTMLDivElement>(null);
  const orbFrameRef = useRef<number>(0);
  const smoothedVolumeRef = useRef(0);

  const setStatusSafe = useCallback((next: SessionStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const setModeSafe = useCallback((next: VoiceMode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  const buildContextSummary = useCallback((ctx: PainContext): string => {
    const parts: string[] = [];
    if (ctx.region) parts.push(`region=${ctx.region}`);
    if (ctx.quality) parts.push(`quality=${ctx.quality}`);
    if (typeof ctx.severity === 'number') parts.push(`severity=${ctx.severity}`);
    if (ctx.days_since_onset != null) parts.push(`days_since_onset=${ctx.days_since_onset}`);
    if (ctx.notes) parts.push(`notes=${ctx.notes}`);
    return parts.join('; ');
  }, []);

  const sanitizeForContextUpdate = useCallback((value: string): string => {
    return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260);
  }, []);

  const getSessionError = useCallback((details?: any) => {
    const reason = String(details?.closeReason || details?.message || '').toLowerCase();
    if (Number(details?.closeCode) === 1002 && reason.includes('text to speech')) {
      return 'ElevenLabs TTS failed for this agent/environment. Verify voice config in ElevenLabs dashboard.';
    }
    const bits: string[] = [];
    if (details?.reason) bits.push(`reason=${details.reason}`);
    if (details?.closeCode) bits.push(`code=${details.closeCode}`);
    if (details?.closeReason) bits.push(`closeReason=${details.closeReason}`);
    if (details?.message) bits.push(`message=${details.message}`);
    return bits.length ? `Voice session disconnected (${bits.join(', ')}).` : 'Voice session disconnected.';
  }, []);

  const cleanupSession = useCallback(() => {
    sessionRef.current = null;
    inFlightStartRef.current = false;
    setStatusSafe('idle');
    setModeSafe('idle');
    smoothedVolumeRef.current = 0;
    window.postMessage({ type: 'VOICE_CALL_ENDED' }, '*');
  }, [setModeSafe, setStatusSafe]);

  const requestSessionConfig = useCallback(async (ctx: PainContext | null): Promise<ElevenConfig> => {
    const response = await fetch('/api/elevenlabs/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ painContext: ctx || undefined }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(body || `Failed to initialize voice (${response.status})`);
    }
    return response.json();
  }, []);

  const startConversation = useCallback(async (ctx?: PainContext, source?: string) => {
    const now = Date.now();
    const debounceMs = 1200;
    if (inFlightStartRef.current) return;
    if (statusRef.current !== 'idle') return;
    if (sessionRef.current) return;
    if (now - lastStartAtRef.current < debounceMs) return;

    inFlightStartRef.current = true;
    lastStartAtRef.current = now;
    setLastError(null);
    setStatusSafe('connecting');
    setModeSafe('idle');

    const contextToUse = ctx || contextRef.current || null;
    contextRef.current = contextToUse;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = await requestSessionConfig(contextToUse);
      const startConfig: any = {
        onConnect: () => {
          setStatusSafe('connected');
          setModeSafe('listening');
          inFlightStartRef.current = false;
          logConversation('voice', undefined, `Voice call started${source ? ` (${source})` : ''}`);
        },
        onDisconnect: (details: any) => {
          setLastError(getSessionError(details));
          logConversation('voice', undefined, 'Voice call ended');
          cleanupSession();
        },
        onError: (error: any, details: any) => {
          const msg =
            (typeof error?.message === 'string' && error.message) ||
            (typeof details?.message === 'string' && details.message) ||
            'Voice session error.';
          setLastError(msg);
          cleanupSession();
        },
        onModeChange: (modeData: any) => {
          if (modeData?.mode === 'speaking') setModeSafe('speaking');
          else if (statusRef.current === 'connected') setModeSafe('listening');
        },
      };

      if (
        config.connectionType === 'webrtc' &&
        typeof config.conversationToken === 'string' &&
        config.conversationToken
      ) {
        startConfig.connectionType = 'webrtc';
        startConfig.conversationToken = config.conversationToken;
      } else if (typeof config.signedUrl === 'string' && config.signedUrl) {
        startConfig.connectionType = 'websocket';
        startConfig.signedUrl = config.signedUrl;
      } else {
        throw new Error('No valid ElevenLabs connection config received.');
      }

      const session = await Conversation.startSession(startConfig);
      sessionRef.current = session;

      // Delay contextual update to avoid colliding with initial TTS bootstrapping.
      const rawSummary = contextToUse ? buildContextSummary(contextToUse) : '';
      const summary = rawSummary ? sanitizeForContextUpdate(rawSummary) : '';
      if (summary) {
        window.setTimeout(() => {
          if (!sessionRef.current) return;
          try {
            sessionRef.current.sendContextualUpdate(summary);
          } catch {
            // Non-fatal; session can continue without context update.
          }
        }, 900);
      }
    } catch (error) {
      const msg =
        (error instanceof Error && error.message) ||
        (typeof error === 'string' && error) ||
        'Failed to start voice session.';
      setLastError(msg);
      cleanupSession();
    } finally {
      inFlightStartRef.current = false;
    }
  }, [
    buildContextSummary,
    cleanupSession,
    getSessionError,
    requestSessionConfig,
    sanitizeForContextUpdate,
    setModeSafe,
    setStatusSafe,
  ]);

  const endConversation = useCallback(async () => {
    const active = sessionRef.current;
    if (!active) {
      cleanupSession();
      return;
    }
    try {
      await active.endSession();
    } catch {
      // Ignore teardown errors; always hard-clean local state.
    } finally {
      cleanupSession();
    }
  }, [cleanupSession]);

  useEffect(() => {
    const animate = () => {
      const session = sessionRef.current;
      const orb = orbRef.current;
      if (!session || !orb) {
        orbFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      let volume = 0;
      try {
        volume = modeRef.current === 'speaking' ? session.getOutputVolume?.() ?? 0 : session.getInputVolume?.() ?? 0;
      } catch {
        volume = 0;
      }
      const smooth = smoothedVolumeRef.current * 0.82 + volume * 0.18;
      smoothedVolumeRef.current = smooth;

      const scale = 1 + smooth * 0.45;
      const r1 = 50 + smooth * 18;
      const r2 = 50 - smooth * 12;
      const r3 = 50 + smooth * 10;
      const r4 = 50 - smooth * 15;
      orb.style.transform = `scale(${scale})`;
      orb.style.borderRadius = `${r1}% ${100 - r1}% ${r2}% ${100 - r2}% / ${r3}% ${r4}% ${100 - r4}% ${100 - r3}%`;

      orbFrameRef.current = requestAnimationFrame(animate);
    };

    if (status === 'connected') {
      orbFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (orbFrameRef.current) cancelAnimationFrame(orbFrameRef.current);
    };
  }, [status]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAIN_CONTEXT_UPDATE') {
        if (event.data?.painContext && typeof event.data.painContext === 'object') {
          contextRef.current = event.data.painContext;
        }
        return;
      }

      if (event.data?.type !== 'START_VOICE_CONVERSATION') return;
      const incoming = event.data?.painContext && typeof event.data.painContext === 'object'
        ? event.data.painContext
        : undefined;
      if (incoming) contextRef.current = incoming;

      if (startTimerRef.current !== null) {
        window.clearTimeout(startTimerRef.current);
      }
      startTimerRef.current = window.setTimeout(() => {
        startTimerRef.current = null;
        void startConversation(incoming, 'unity');
      }, 75);
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (startTimerRef.current !== null) {
        window.clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
      if (sessionRef.current) {
        void endConversation();
      }
    };
  }, [endConversation, startConversation]);

  if (status === 'idle' && !persistent) return null;

  const modeLabel =
    status === 'connecting'
      ? 'Connecting...'
      : mode === 'speaking'
        ? 'Coach is speaking...'
        : status === 'connected'
          ? 'Listening...'
          : 'Ready when you are.';
  const statusLabel =
    status === 'connected' ? 'Live session' : status === 'connecting' ? 'Connecting' : 'Standby';
  const statusClass =
    status === 'connected' ? 'voice-status-live' : status === 'connecting' ? 'voice-status-connecting' : 'voice-status-idle';

  if (persistent) {
    return (
      <div className={`voice-coach-panel ${embedded ? 'voice-coach-panel-embedded' : ''}`}>
        <header className="voice-coach-header">
          <h3 className="voice-coach-title">Voice Coach</h3>
          <p className="voice-coach-subtitle">Live guidance based on your check-in context.</p>
        </header>
        <div className={`voice-status-pill ${statusClass}`}>{statusLabel}</div>

        <div className="voice-orb-container voice-orb-container-panel">
          <div className="voice-orb-glow" />
          <div
            ref={orbRef}
            className={`voice-orb ${status === 'connecting' ? 'voice-orb-connecting' : ''} ${mode === 'speaking' ? 'voice-orb-speaking' : 'voice-orb-listening'}`}
          />
          <p className="voice-mode-label">{modeLabel}</p>
          <p className="voice-coach-helper">
            {status === 'idle'
              ? 'Start when you are ready. Your latest check-in context will be included.'
              : 'Keep speaking naturally. The coach adapts in real time.'}
          </p>
          {lastError && (
            <p className="voice-coach-helper" style={{ color: '#e68a8a' }}>
              {lastError}
            </p>
          )}
        </div>

        <div className="voice-coach-actions">
          {status === 'idle' && (
            <button type="button" className="voice-start-btn" onClick={() => void startConversation(undefined, 'manual')}>
              Start Voice Coach
            </button>
          )}
          {status === 'connecting' && (
            <button type="button" className="voice-start-btn" disabled>
              Connecting...
            </button>
          )}
          {status === 'connected' && (
            <button type="button" className="voice-end-btn" onClick={() => void endConversation()}>
              End Call
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="voice-overlay">
      <div className="voice-orb-container">
        <div className="voice-orb-glow" />
        <div
          ref={orbRef}
          className={`voice-orb ${status === 'connecting' ? 'voice-orb-connecting' : ''} ${mode === 'speaking' ? 'voice-orb-speaking' : 'voice-orb-listening'}`}
        />
        <p className="voice-mode-label">{modeLabel}</p>
        {status === 'connected' && (
          <button type="button" className="voice-end-btn" onClick={() => void endConversation()}>
            End Call
          </button>
        )}
      </div>
    </div>
  );
}

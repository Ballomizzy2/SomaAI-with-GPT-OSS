'use client';

import { useEffect, useRef, useState } from 'react';
import { sendUnityMessage } from '../lib/unityControl';

const UNITY_IFRAME_SRC = '/unity/index.html';

// How long to show the "still loading" nudge before assuming something went wrong.
const SLOW_LOAD_MS = 18_000;
const TIMEOUT_MS   = 90_000;

function getUnityIframe(): HTMLIFrameElement | null {
  if (typeof window === 'undefined') return null;
  return document.getElementById('unity-iframe') as HTMLIFrameElement | null;
}

function requestUnityBlur() {
  const iframe = getUnityIframe();
  if (!iframe) return;
  iframe.contentWindow?.postMessage({ type: 'UNITY_HOST_BLUR' }, '*');
  if (document.activeElement === iframe) iframe.blur();
}

type LoadState = 'loading' | 'slow' | 'ready' | 'error';

export default function UnityWebGLPlayer() {
  const [loadState, setLoadState]   = useState<LoadState>('loading');
  const [errorMsg,  setErrorMsg]    = useState<string | null>(null);
  const slowTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Start timers — Unity WASM compilation alone can take 15-30 s.
    slowTimerRef.current    = setTimeout(() => setLoadState(s => s === 'loading' ? 'slow' : s), SLOW_LOAD_MS);
    timeoutTimerRef.current = setTimeout(() => {
      setLoadState(s => {
        if (s === 'loading' || s === 'slow') {
          setErrorMsg('Unity took too long to load. Try refreshing.');
          return 'error';
        }
        return s;
      });
    }, TIMEOUT_MS);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'VOICE_CALL_ENDED') {
        sendUnityMessage('OnVoiceCallEnded', '');
      }
      if (event.data?.type === 'PAIN_CONTEXT_UPDATE') {
        requestUnityBlur();
      }
      if (event.data?.type === 'UNITY_IFRAME_READY') {
        clearTimeout(slowTimerRef.current!);
        clearTimeout(timeoutTimerRef.current!);
        setLoadState('ready');
      }
      if (event.data?.type === 'UNITY_IFRAME_ERROR') {
        clearTimeout(slowTimerRef.current!);
        clearTimeout(timeoutTimerRef.current!);
        setErrorMsg(typeof event.data.message === 'string' ? event.data.message : 'Unity runtime error.');
        setLoadState('error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(slowTimerRef.current!);
      clearTimeout(timeoutTimerRef.current!);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        id="unity-iframe"
        src={UNITY_IFRAME_SRC}
        title="Unity Body Map"
        tabIndex={-1}
        allow="autoplay; microphone; clipboard-read; clipboard-write"
        loading="eager"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#0F1923',
        }}
      />

      {/* Loading overlay — stays until UNITY_IFRAME_READY or error */}
      {(loadState === 'loading' || loadState === 'slow') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: '280px',
              maxWidth: '80vw',
              background: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '20px 18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              textAlign: 'center',
            }}
          >
            {/* Spinner */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <svg
                width="32" height="32" viewBox="0 0 32 32"
                style={{ animation: 'unity-spin 1s linear infinite' }}
              >
                <style>{`@keyframes unity-spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="16" cy="16" r="12" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <path d="M16 4a12 12 0 0 1 12 12" fill="none" stroke="#0369A1" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Loading 3D Body Map
            </p>

            {loadState === 'slow' ? (
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5 }}>
                Compiling WebAssembly — this takes about 20–30 s on first load.<br />
                Subsequent loads use the browser cache.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Downloading Unity runtime…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {loadState === 'error' && errorMsg && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            zIndex: 30,
            background: 'rgba(255,241,241,0.96)',
            border: '1px solid rgba(220,80,80,0.5)',
            color: '#8c2727',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <strong>Unity failed to load</strong><br />
          {errorMsg}
        </div>
      )}
    </div>
  );
}

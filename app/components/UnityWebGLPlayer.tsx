'use client';

import { useEffect, useState } from 'react';
import { sendUnityMessage } from '../lib/unityControl';

const UNITY_IFRAME_SRC = '/unity/index.html';

function getUnityIframe(): HTMLIFrameElement | null {
  if (typeof window === 'undefined') return null;
  return document.getElementById('unity-iframe') as HTMLIFrameElement | null;
}

function requestUnityBlur() {
  const iframe = getUnityIframe();
  if (!iframe) return;
  iframe.contentWindow?.postMessage({ type: 'UNITY_HOST_BLUR' }, '*');
  if (document.activeElement === iframe) {
    iframe.blur();
  }
}

export default function UnityWebGLPlayer() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'VOICE_CALL_ENDED') {
        sendUnityMessage('OnVoiceCallEnded', '');
      }

      if (event.data?.type === 'PAIN_CONTEXT_UPDATE') {
        // After selecting a region in Unity, release iframe focus so form typing is immediate.
        requestUnityBlur();
      }

      if (event.data?.type === 'UNITY_IFRAME_READY') {
        setIsLoaded(true);
      }

      if (event.data?.type === 'UNITY_IFRAME_ERROR') {
        setError(typeof event.data.message === 'string' ? event.data.message : 'Unity runtime error.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <iframe
        id="unity-iframe"
        src={UNITY_IFRAME_SRC}
        title="Unity Body Map"
        tabIndex={-1}
        allow="autoplay; microphone; clipboard-read; clipboard-write"
        loading="eager"
        onLoad={() => {
          // Fallback in case ready event is blocked; real readiness is posted by Unity index.
          window.setTimeout(() => setIsLoaded(true), 200);
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#000',
        }}
      />

      {!isLoaded && !error && (
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
              width: '260px',
              maxWidth: '80vw',
              background: 'rgba(255, 255, 255, 0.78)',
              border: '1px solid rgba(255, 255, 255, 0.88)',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 10px 28px rgba(51, 101, 130, 0.2)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              fontSize: '12px',
              color: '#24475c',
            }}
          >
            Loading Unity...
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            zIndex: 1200,
            background: 'rgba(255, 241, 241, 0.92)',
            border: '1px solid rgba(232, 106, 106, 0.7)',
            color: '#8c2727',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

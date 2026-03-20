'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import PainCheckInTracker from './PainCheckInTracker';
import ProgressDashboard from './ProgressDashboard';
import VoiceCoachWidget from './VoiceCoachWidget';
import { logConversation } from '../lib/sessionStorage';
import { setUnityViewMode } from '../lib/unityControl';

const DEFAULT_X = 16;
const DEFAULT_Y = 16;

export default function FloatingOverlayPane() {
  const [pos, setPos] = useState({ x: DEFAULT_X, y: DEFAULT_Y });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const [unityMode, setUnityMode] = useState<'safety' | 'alarm'>('safety');

  // Backend-loop: listen for Unity telemetry, store locally, and POST to API.
  // (Server route is a stub today; later can be swapped to FastAPI/DB.)
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== 'UNITY_EVENT') return;
      const { eventName, payload, ts } = event.data ?? {};
      if (typeof eventName !== 'string') return;

      try {
        logConversation('text', undefined, `[Unity] ${eventName} ${payload ? JSON.stringify(payload) : ''}`);
      } catch {
        // ignore
      }

      try {
        await fetch('/api/session/unity-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventName, payload, ts }),
        });
      } catch {
        // ignore (offline/dev)
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Manual + keyboard toggle for testing: Alt+1 = safety, Alt+2 = alarm
  useEffect(() => {
    const applyMode = async (mode: 'safety' | 'alarm', source: 'button' | 'keyboard') => {
      setUnityMode(mode);
      setUnityViewMode(mode);
      try {
        logConversation('text', undefined, `[Unity] set_view_mode=${mode} (${source})`);
      } catch {
        // ignore
      }
      try {
        await fetch('/api/session/unity-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventName: 'set_view_mode', payload: { mode, source }, ts: Date.now() }),
        });
      } catch {
        // ignore
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === '1') void applyMode('safety', 'keyboard');
      if (e.key === '2') void applyMode('alarm', 'keyboard');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.x,
      startTop: pos.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos.x, pos.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: Math.max(0, dragRef.current.startLeft + dx),
      y: Math.max(0, dragRef.current.startTop + dy)
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.isDragging) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      dragRef.current.isDragging = false;
    }
  }, []);

  return (
    <div className="floating-pane" style={{ left: pos.x, top: pos.y }}>
      <header
        className="floating-pane-header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="presentation"
      >
        <span className="floating-pane-grip" aria-hidden>⋮⋮</span>
        <Link href="/unity/index.html" target="_blank" className="floating-pane-link">
          Open in new tab
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setUnityMode('safety');
              setUnityViewMode('safety');
              void fetch('/api/session/unity-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventName: 'set_view_mode', payload: { mode: 'safety', source: 'button' }, ts: Date.now() }),
              });
            }}
            style={{
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.25)',
              background: unityMode === 'safety' ? 'rgba(53,183,217,0.28)' : 'rgba(0,0,0,0.25)',
              color: 'white',
            }}
            title="Safe attention mode (Alt+1)"
          >
            Safety
          </button>
          <button
            type="button"
            onClick={() => {
              setUnityMode('alarm');
              setUnityViewMode('alarm');
              void fetch('/api/session/unity-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventName: 'set_view_mode', payload: { mode: 'alarm', source: 'button' }, ts: Date.now() }),
              });
            }}
            style={{
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.25)',
              background: unityMode === 'alarm' ? 'rgba(255,120,120,0.28)' : 'rgba(0,0,0,0.25)',
              color: 'white',
            }}
            title="Alarm framing mode (Alt+2)"
          >
            Alarm
          </button>
        </div>
      </header>
      <div className="floating-pane-body">
        <PainCheckInTracker embedded />
        <ProgressDashboard embedded />
        <VoiceCoachWidget embedded />
      </div>
    </div>
  );
}

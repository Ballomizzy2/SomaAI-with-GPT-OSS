'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logPainReport } from '../lib/sessionStorage';

type PainContext = {
  region?: string;
  quality?: string;
  severity?: number;
  days_since_onset?: number;
  notes?: string;
};

const QUALITY_OPTIONS = [
  'tightness',
  'pressure',
  'ache',
  'burning',
  'sharp',
  'throbbing',
  'tingling',
  'numbness',
  'other',
] as const;

interface PainCheckInTrackerProps {
  embedded?: boolean;
  persistent?: boolean;
}

export default function PainCheckInTracker({ embedded, persistent = false }: PainCheckInTrackerProps) {
  const [isOpen, setIsOpen] = useState(persistent);
  const [region, setRegion] = useState('');
  const [quality, setQuality] = useState<(typeof QUALITY_OPTIONS)[number]>('tightness');
  const [severity, setSeverity] = useState(3);
  const [daysSinceOnset, setDaysSinceOnset] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const regionInputRef = useRef<HTMLInputElement | null>(null);

  const painContext: PainContext = useMemo(
    () => ({
      region: region || undefined,
      quality: quality || undefined,
      severity,
      days_since_onset: typeof daysSinceOnset === 'number' ? daysSinceOnset : undefined,
      notes: notes || undefined,
    }),
    [daysSinceOnset, notes, quality, region, severity]
  );

  const normalizeRegion = useCallback((raw: string) => {
    const cleaned = raw
      .replace(/\(Clone\)/g, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return '';

    // Title-case for display ("lower back" -> "Lower Back")
    return cleaned
      .split(' ')
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  }, []);

  useEffect(() => {
    if (persistent) {
      setIsOpen(true);
    }
  }, [persistent]);

  const releaseUnityKeyboardCapture = useCallback(() => {
    const win = window as any;
    const unity = win.__unityInstance as any;
    const iframe = document.getElementById('unity-iframe') as HTMLIFrameElement | null;

    // Unity defaults can capture keyboard events globally. Force browser form input behavior.
    if (win?.WebGLInput && typeof win.WebGLInput === 'object') {
      win.WebGLInput.captureAllKeyboardInput = false;
    }

    if (unity?.Module?.WebGLInput && typeof unity.Module.WebGLInput === 'object') {
      unity.Module.WebGLInput.captureAllKeyboardInput = false;
    }

    const canvas = document.getElementById('unity-canvas') as HTMLCanvasElement | null;
    if (canvas && document.activeElement === canvas) {
      canvas.blur();
    }

    if (iframe) {
      // For iframe-isolated Unity, ask the child runtime to drop pointer lock/focus.
      iframe.contentWindow?.postMessage({ type: 'UNITY_HOST_BLUR' }, '*');
      if (document.activeElement === iframe) {
        iframe.blur();
      }
    }
  }, []);

  const handoffFocusFromUnity = useCallback(() => {
    releaseUnityKeyboardCapture();
    window.setTimeout(() => {
      const input = regionInputRef.current;
      if (!input) return;
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    }, 0);
  }, [releaseUnityKeyboardCapture]);

  useEffect(() => {
    const handleUnityMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAIN_CONTEXT_UPDATE' && event.data?.painContext) {
        const nextRegion = event.data.painContext.region;
        if (typeof nextRegion === 'string' && nextRegion.trim()) {
          setRegion(normalizeRegion(nextRegion));
          // Nudge open if the user is mid-flow and Unity provides the missing piece.
          if (!isOpen) setIsOpen(true);

          const active = document.activeElement;
          const iframe = document.getElementById('unity-iframe');
          if (active === iframe || active === document.body || !active) {
            handoffFocusFromUnity();
          }
        }
      }
    };

    window.addEventListener('message', handleUnityMessage);
    return () => window.removeEventListener('message', handleUnityMessage);
  }, [handoffFocusFromUnity, isOpen, normalizeRegion]);

  const startVoiceCoach = useCallback((ctx: PainContext) => {
    window.postMessage({ type: 'START_VOICE_CONVERSATION', painContext: ctx }, '*');
  }, []);

  const submitCheckIn = useCallback(async () => {
    setError(null);

    if (!region.trim()) {
      setError('Select a body region in the 3D model first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pain/checkin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...painContext,
          timestamp: Date.now(),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to submit (${res.status})`);
      }

      const data = await res.json();
      const checkin = data?.checkin as PainContext | undefined;

      const ctxToLog = checkin?.region ? checkin : painContext;
      logPainReport(
        ctxToLog.region || region,
        ctxToLog.quality || quality,
        typeof ctxToLog.severity === 'number' ? ctxToLog.severity : severity,
        typeof ctxToLog.days_since_onset === 'number' ? ctxToLog.days_since_onset : undefined,
        ctxToLog.notes || undefined
      );

      window.dispatchEvent(new CustomEvent('soma_session_updated'));
      startVoiceCoach(ctxToLog);
      if (!persistent) {
        setIsOpen(false);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to submit check-in.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [painContext, persistent, quality, region, severity, startVoiceCoach]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`checkin-trigger ${embedded ? 'checkin-trigger-embedded' : ''}`}
        title="Log a pain check-in"
      >
        New Check-in
      </button>
    );
  }

  return (
    <div className={`checkin-panel ${embedded ? 'checkin-panel-embedded' : ''}`}>
      <header className="checkin-header">
        <div>
          <h3 className="checkin-title">Pain Check-in</h3>
          <p className="checkin-subtitle">Pick a region on the 3D body, then log the details.</p>
        </div>
        {!persistent && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="checkin-close"
            aria-label="Close"
            disabled={isSubmitting}
          >
            ×
          </button>
        )}
      </header>

      <div
        className="checkin-body"
        onFocusCapture={releaseUnityKeyboardCapture}
        onPointerDownCapture={releaseUnityKeyboardCapture}
      >
        {error && <div className="checkin-error">{error}</div>}

        <div className="checkin-row">
          <label className="checkin-label">
            Region
            <input
              ref={regionInputRef}
              className="checkin-input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Click a body area in the 3D model"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="checkin-grid">
          <label className="checkin-label">
            Quality
            <select
              className="checkin-input"
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              disabled={isSubmitting}
            >
              {QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q} style={{ color: 'black' }}>
                  {q}
                </option>
              ))}
            </select>
          </label>

          <label className="checkin-label">
            Days since onset
            <input
              className="checkin-input"
              type="number"
              min={0}
              max={3650}
              value={daysSinceOnset}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  setDaysSinceOnset('');
                  return;
                }

                const parsed = Number.parseInt(v, 10);
                if (Number.isNaN(parsed)) {
                  return;
                }

                setDaysSinceOnset(Math.max(0, Math.min(3650, parsed)));
              }}
              placeholder="0"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="checkin-row">
          <label className="checkin-label">
            Intensity (0–10): <span className="checkin-pill">{severity}</span>
            <input
              className="checkin-range"
              type="range"
              min={0}
              max={10}
              step={1}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="checkin-row">
          <label className="checkin-label">
            Notes (optional)
            <textarea
              className="checkin-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What are you noticing? (e.g., tightness when sitting, eased after breathing)"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="checkin-actions">
          <button
            type="button"
            className="checkin-secondary"
            onClick={() => startVoiceCoach(painContext)}
            disabled={isSubmitting || !region.trim()}
            title={!region.trim() ? 'Select a region first' : 'Start coaching without logging'}
          >
            Coach me now
          </button>
          <button
            type="button"
            className="checkin-primary"
            onClick={submitCheckIn}
            disabled={isSubmitting || !region.trim()}
          >
            {isSubmitting ? 'Saving…' : 'Save + Start coach'}
          </button>
        </div>
      </div>
    </div>
  );
}


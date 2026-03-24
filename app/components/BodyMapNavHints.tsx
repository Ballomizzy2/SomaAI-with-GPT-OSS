'use client';

import { resetUnityCameraView } from '../lib/unityControl';

/**
 * Next.js overlay for 3D body map controls (matches Unity `CameraOrbiter` behavior).
 * Reset calls `CameraOrbiter.ResetView` on the Main Camera via SendMessage.
 */
export default function BodyMapNavHints() {
  return (
    <div className="body-map-nav-hints" role="region" aria-label="How to navigate the 3D view">
      <p className="body-map-nav-hints-title">Navigate</p>
      <ul className="body-map-nav-hints-list">
        <li className="body-map-nav-hints-item">
          <span className="body-map-nav-hints-icon" aria-hidden>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6v6M20 28v6M6 20h6M28 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M20 8l-2.5 2.5M20 8l2.5 2.5M20 32l-2.5-2.5M20 32l2.5-2.5M8 20l2.5-2.5M8 20l2.5 2.5M32 20l-2.5-2.5M32 20l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="20" cy="20" r="3" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          </span>
          <span className="body-map-nav-hints-text">
            <strong>Rotate</strong>
            <span className="body-map-nav-hints-sub">Arrow keys</span>
          </span>
        </li>
        <li className="body-map-nav-hints-item">
          <span className="body-map-nav-hints-icon" aria-hidden>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="8" width="16" height="22" rx="3" stroke="currentColor" strokeWidth="1.35" />
              <rect x="17" y="12" width="6" height="5" rx="1" fill="currentColor" opacity="0.4" />
              <path d="M6 22h5M8 19l-3 3 3 3M34 22h-5M32 19l3 3-3 3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="body-map-nav-hints-text">
            <strong>Pan</strong>
            <span className="body-map-nav-hints-sub">Middle mouse · drag</span>
          </span>
        </li>
        <li className="body-map-nav-hints-item">
          <span className="body-map-nav-hints-icon" aria-hidden>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="13" y="10" width="14" height="22" rx="2.5" stroke="currentColor" strokeWidth="1.35" />
              <line x1="20" y1="14" x2="20" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M17 9l3-3 3 3M17 31l3 3 3-3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="body-map-nav-hints-text">
            <strong>Zoom</strong>
            <span className="body-map-nav-hints-sub">Scroll wheel</span>
          </span>
        </li>
      </ul>
      <div className="body-map-nav-hints-actions">
        <button
          type="button"
          className="body-map-nav-hints-reset"
          onClick={() => resetUnityCameraView()}
        >
          Reset 3D view
        </button>
      </div>
    </div>
  );
}

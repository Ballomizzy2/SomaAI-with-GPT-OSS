'use client';

import Link from 'next/link';
import Script from 'next/script';
import PainCheckInTracker from './PainCheckInTracker';
import OnboardingOverlay from './OnboardingOverlay';
import ProgressDashboard from './ProgressDashboard';
import UnityWebGLPlayer from './UnityWebGLPlayer';
import VoiceCoachWidget from './VoiceCoachWidget';

export default function HomeExperience() {
  return (
    <main className="experience-shell">
      <header className="experience-topbar">
        <div className="experience-topbar-left">
          <span className="experience-wordmark">SomaAI</span>
          <div className="experience-divider" />
          <span className="experience-session-label">Session workspace</span>
        </div>

        <div className="experience-steps">
          <div className="experience-step">
            <div className="experience-step-num active">1</div>
            <span>Select region</span>
          </div>
          <span className="experience-step-arrow">›</span>
          <div className="experience-step">
            <div className="experience-step-num">2</div>
            <span>Check in</span>
          </div>
          <span className="experience-step-arrow">›</span>
          <div className="experience-step">
            <div className="experience-step-num">3</div>
            <span>Review</span>
          </div>
        </div>

        <div className="experience-topbar-right">
          <div className="experience-breath-indicator">
            <div className="experience-breath-dot" />
            <span>Live session</span>
          </div>
          <Link href="/unity/index.html" target="_blank" className="experience-open-link">
            Fullscreen map
          </Link>
        </div>
      </header>

      <section className="experience-grid">

        {/* LEFT — Check-in */}
        <div className="experience-card experience-card-checkin">
          <div className="experience-panel-header">
            <p className="experience-panel-label">Step 2</p>
            <h2 className="experience-panel-title">Pain check-in</h2>
            <div className="experience-accent-rule" />
          </div>
          <PainCheckInTracker embedded persistent />
        </div>

        {/* CENTER — Body Map */}
        <section className="experience-stage-wrap">
          <div className="experience-stage-bg" />
          <div className="experience-stage-header">
            <div>
              <p className="experience-panel-label">Step 1</p>
              <h2 className="experience-stage-title">3D Body Map</h2>
            </div>
            <p className="experience-stage-hint">Click a region to begin</p>
          </div>
          <div className="experience-stage">
            <UnityWebGLPlayer />
          </div>
        </section>

        {/* RIGHT — Progress + Voice */}
        <aside className="experience-insights">
          <div className="experience-card experience-card-progress">
            <div className="experience-panel-header">
              <p className="experience-panel-label">Step 3</p>
              <h2 className="experience-panel-title">Progress</h2>
              <div className="experience-accent-rule amber" />
            </div>
            <ProgressDashboard embedded persistent />
          </div>
          <div className="experience-card experience-card-voice">
            <div className="experience-panel-header">
              <p className="experience-panel-label">Support</p>
              <h2 className="experience-panel-title">Voice coach</h2>
              <div className="experience-accent-rule amber" />
            </div>
            <VoiceCoachWidget embedded persistent />
          </div>
        </aside>

      </section>

      <Script src="/unity-bridge.js" strategy="afterInteractive" />
      <OnboardingOverlay onDone={() => {}} />
    </main>
  );
}
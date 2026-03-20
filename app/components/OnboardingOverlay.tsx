'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'soma_onboarding_completed_v1';

type Step = 0 | 1 | 2;

export default function OnboardingOverlay({ onDone }: { onDone: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    try {
      const completed = window.localStorage.getItem(STORAGE_KEY) === '1';
      if (completed) {
        setIsOpen(false);
        onDone();
        return;
      }
      setIsOpen(true);
    } catch {
      setIsOpen(true);
    }
  }, [onDone]);

  const content = useMemo(() => {
    if (step === 0) {
      return {
        title: 'Welcome to SomaAI',
        body: (
          <>
            <p>
              This is a short, guided way to practice <strong>body awareness</strong>—learning to
              notice sensations with more safety and less alarm.
            </p>
            <p className="onboard-muted">
              This isn’t a diagnosis tool and it’s not a substitute for medical care. It’s a gentle
              practice to help your nervous system recalibrate.
            </p>
          </>
        ),
      };
    }

    if (step === 1) {
      return {
        title: 'A different relationship with sensation',
        body: (
          <>
            <p>
              Chronic symptoms often get amplified when the nervous system is stuck viewing sensations
              through a <strong>lens of danger</strong>. A core skill is building a stronger{' '}
              <strong>foundation of safety</strong>.
            </p>
            <div className="onboard-callout">
              <div className="onboard-callout-title">Try this now (10 seconds)</div>
              <div className="onboard-callout-body">
                Let your attention settle somewhere neutral—palms, feet, or the breath. See if you can
                find <em>even a tiny bit</em> of pleasant or okay sensation. No fireworks required.
              </div>
            </div>
          </>
        ),
      };
    }

    return {
      title: 'How today’s check-in works',
      body: (
        <>
          <p>
            You’ll use the 3D body map to choose where you feel the most attention or sensation. Then
            you’ll log a quick check-in (quality, intensity, notes) and start a short voice coaching
            session.
          </p>
          <div className="onboard-callout">
            <div className="onboard-callout-title">Gentle rule</div>
            <div className="onboard-callout-body">
              We aim for <strong>curiosity + kindness</strong> toward your nervous system. If your mind
              goes into fix-it mode, that’s okay—notice it, acknowledge it, and return to the moment.
            </div>
          </div>
        </>
      ),
    };
  }, [step]);

  if (!isOpen) return null;

  const nextLabel = step === 2 ? 'Enter body map' : 'Continue';

  return (
    <div className="onboard-overlay" role="dialog" aria-modal="true" aria-label="Onboarding">
      <div className="onboard-card">
        <div className="onboard-top">
          <div className="onboard-step">Step {step + 1} of 3</div>
          <button
            type="button"
            className="onboard-skip"
            onClick={() => {
              if (dontShowAgain) {
                try {
                  window.localStorage.setItem(STORAGE_KEY, '1');
                } catch {}
              }
              setIsOpen(false);
              onDone();
            }}
          >
            Skip
          </button>
        </div>

        <h2 className="onboard-title">{content.title}</h2>
        <div className="onboard-body">{content.body}</div>

        <label className="onboard-checkbox">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Don’t show this again
        </label>

        <div className="onboard-actions">
          <button
            type="button"
            className="onboard-secondary"
            onClick={() => setStep((s) => (s === 0 ? 0 : ((s - 1) as Step)))}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="onboard-primary"
            onClick={() => {
              if (step < 2) {
                setStep((s) => ((s + 1) as Step));
                return;
              }
              if (dontShowAgain) {
                try {
                  window.localStorage.setItem(STORAGE_KEY, '1');
                } catch {}
              }
              setIsOpen(false);
              onDone();
            }}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


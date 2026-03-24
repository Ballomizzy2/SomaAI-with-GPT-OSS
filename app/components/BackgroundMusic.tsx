'use client';

import { useEffect, useRef } from 'react';

/** Served from `public/audio/SomaWAV.wav` (copy of Unity `Assets/Music/SomaWAV.wav`). */
const TRACK_SRC = '/audio/SomaWAV.wav';

/** Calm bed level — adjust 0–1 if you want it louder/quieter. */
const BACKGROUND_VOLUME = 0.22;

/**
 * Loops ambient music. Browsers often block autoplay with sound until a user gesture;
 * we retry on first pointerdown anywhere.
 */
export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.loop = true;
    el.volume = BACKGROUND_VOLUME;

    const removeUnlockListeners = () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };

    const unlock = () => {
      void el.play().then(removeUnlockListeners).catch(() => {
        /* still blocked; keep listening */
      });
    };

    void el.play().then(removeUnlockListeners).catch(() => {
      document.addEventListener('pointerdown', unlock, { capture: true });
      document.addEventListener('keydown', unlock, { capture: true });
    });

    return () => {
      removeUnlockListeners();
      el.pause();
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src={TRACK_SRC}
      preload="auto"
      playsInline
      aria-hidden
    />
  );
}

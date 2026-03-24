/**
 * Very soft UI “click” using Web Audio (no asset files).
 * Browsers may start AudioContext suspended until a user gesture; we resume on first play.
 */

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

/**
 * Three calm starting pitches (Hz), cycled each click: low → mid-high → mid (gentle up / down feel).
 * Small random jitter on the sweep keeps clicks from feeling identical.
 */
const CALM_PITCHES_HZ = [460, 620, 520] as const;

let pitchStep = 0;

function nextPitchHz(): number {
  const hz = CALM_PITCHES_HZ[pitchStep % CALM_PITCHES_HZ.length]!;
  pitchStep += 1;
  return hz;
}

/** Single gentle tick — low volume, short decay; pitch varies per click. */
export function playCalmUiClick(): void {
  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const t0 = ctx.currentTime;
  const duration = 0.09;

  const startHz = nextPitchHz();
  const endHz = Math.max(220, startHz * (0.7 + Math.random() * 0.1));

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.06, t0 + 0.004);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  master.connect(ctx.destination);

  // Soft body tone (new pitch + sweep each time)
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startHz, t0);
  osc.frequency.exponentialRampToValueAtTime(endHz, t0 + 0.045);
  osc.connect(master);
  osc.start(t0);
  osc.stop(t0 + duration);

  // Tiny breath of noise for “texture” (very quiet)
  const bufferSize = ctx.sampleRate * 0.04;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.012, t0 + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035);
  noise.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(t0);
  noise.stop(t0 + 0.04);
}

// ============================================================================
// POCKETSWAP — COZY GAME AUDIO SYNTHESIZER & MOBILE HAPTICS ENGINE
// Uses native Web Audio API (0 KB external audio files, 0ms network latency)
// and navigator.vibrate() for tactile mobile feedback.
// ============================================================================

export type CozySoundType =
  | 'tap'
  | 'like'
  | 'trade'
  | 'chat'
  | 'fanfare'
  | 'coins';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return localStorage.getItem('pocketswap_sound_muted') !== 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem('pocketswap_sound_muted', enabled ? 'false' : 'true');
}

export function triggerHaptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore on desktop browsers that don't support vibrate
  }
}

function playNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  peakGain = 0.08
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playCozySound(sound: CozySoundType): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (sound) {
    case 'tap': {
      triggerHaptic(8);
      playNote(ctx, 520, now, 0.055, 'sine', 0.05);
      break;
    }
    case 'like': {
      triggerHaptic([10, 25, 15]);
      playNote(ctx, 587.33, now, 0.08, 'triangle', 0.07); // D5
      playNote(ctx, 880, now + 0.055, 0.12, 'triangle', 0.08); // A5
      break;
    }
    case 'chat': {
      triggerHaptic(10);
      playNote(ctx, 659.25, now, 0.07, 'sine', 0.06); // E5
      playNote(ctx, 783.99, now + 0.05, 0.09, 'sine', 0.06); // G5
      break;
    }
    case 'trade': {
      triggerHaptic([15, 30, 25]);
      playNote(ctx, 523.25, now, 0.09, 'triangle', 0.08); // C5
      playNote(ctx, 659.25, now + 0.07, 0.09, 'triangle', 0.08); // E5
      playNote(ctx, 783.99, now + 0.14, 0.16, 'triangle', 0.09); // G5
      break;
    }
    case 'coins': {
      triggerHaptic([12, 20, 12]);
      playNote(ctx, 987.77, now, 0.07, 'sine', 0.07); // B5
      playNote(ctx, 1318.51, now + 0.06, 0.18, 'sine', 0.08); // E6
      break;
    }
    case 'fanfare': {
      triggerHaptic([20, 40, 20, 40, 50]);
      playNote(ctx, 523.25, now, 0.11, 'triangle', 0.09); // C5
      playNote(ctx, 659.25, now + 0.09, 0.11, 'triangle', 0.09); // E5
      playNote(ctx, 783.99, now + 0.18, 0.11, 'triangle', 0.09); // G5
      playNote(ctx, 1046.5, now + 0.27, 0.28, 'triangle', 0.11); // C6
      break;
    }
  }
}

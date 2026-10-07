// Web Audio & TTS audio management for Nature Go Screen-Free Outdoor Experience

let audioCtx: AudioContext | null = null;
let currentAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Sound Effects via Web Audio API (zero external assets needed, works 100% reliably)
export function playQuestAcceptSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.32);
}

export function playShutterSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Click burst
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

export function playChimeSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Triad arpeggio: C5 -> E5 -> G5 -> C6 (joyful nature discovery chime)
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.1);

    gain.gain.setValueAtTime(0.001, now + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.1);
    osc.stop(now + idx * 0.1 + 0.65);
  });
}

export function playChimeReject() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Minor tone drop warning (soft anti-spoof rejection)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(329.63, now); // E4
  osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.25); // C4

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.45);
}

// Ranger Voice Narration Player using Web SpeechSynthesis API
// Provides instant, unlimited, latency-free voice narration for screen-free outdoor exploration
export async function narrateText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: Error) => void
): Promise<() => void> {
  stopNarration();

  let cancelled = false;

  const cancel = () => {
    cancelled = true;
    stopNarration();
  };

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return cancel;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1.05;

    // Helper to pick the best natural voice
    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;

      // Prefer English natural voices
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Karen') ||
            v.name.includes('Serena'))
      );

      return preferred || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    };

    const voice = selectBestVoice();
    if (voice) {
      utterance.voice = voice;
    } else {
      // If voices are not yet loaded, listen once
      window.speechSynthesis.onvoiceschanged = () => {
        const v = selectBestVoice();
        if (v) utterance.voice = v;
      };
    }

    utterance.onstart = () => {
      if (!cancelled) {
        onStart?.();
      }
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      // If cancelled or interrupted, do not treat as error
      if (e.error === 'canceled' || e.error === 'interrupted') {
        onEnd?.();
        return;
      }
      console.warn('Speech synthesis notice:', e.error);
      onError?.(new Error(`Speech synthesis: ${e.error}`));
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    onError?.(err as Error);
    onEnd?.();
  }

  return cancel;
}

export function stopNarration() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

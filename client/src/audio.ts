// Lightweight WebAudio-based SFX + ambient music system.
//
// Sounds are synthesized on the fly so the game has audio without
// requiring any asset files. A later pass can replace these with real
// samples by swapping playSound implementations per sound name.
//
// The AudioContext is locked until the user's first interaction per
// browser autoplay policies, so we resume it lazily on the first
// pointerdown/keydown/touchstart.

export type SoundName =
  | "shoot"
  | "bulletHit"
  | "explosion"
  | "heartPickup"
  | "ammoPickup"
  | "playerHit"
  | "playerDeath"
  | "goalReached"
  | "victory"
  | "defeat"
  | "menuClick"
  | "menuConfirm"
  | "countdownTick"
  | "countdownGo";

interface ThrottleEntry {
  minIntervalMs: number;
  lastPlayedAt: number;
}

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let unlockAttached = false;
let audioEnabled = false;

const throttles: Partial<Record<SoundName, ThrottleEntry>> = {
  shoot: { minIntervalMs: 70, lastPlayedAt: 0 },
  bulletHit: { minIntervalMs: 35, lastPlayedAt: 0 },
  explosion: { minIntervalMs: 60, lastPlayedAt: 0 },
  playerHit: { minIntervalMs: 120, lastPlayedAt: 0 },
  heartPickup: { minIntervalMs: 80, lastPlayedAt: 0 },
  ammoPickup: { minIntervalMs: 80, lastPlayedAt: 0 },
};

const getCtx = (): AudioContext | null => {
  if (audioContext !== null) {
    return audioContext;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  try {
    audioContext = new Ctor();
  } catch (_error) {
    audioContext = null;
    return null;
  }

  masterGain = audioContext.createGain();
  masterGain.gain.value = audioEnabled ? 1 : 0;
  masterGain.connect(audioContext.destination);

  sfxGain = audioContext.createGain();
  sfxGain.gain.value = 0.7;
  sfxGain.connect(masterGain);

  return audioContext;
};

const now = () => (audioContext ? audioContext.currentTime : 0);

const tryResume = () => {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {
      // Autoplay still blocked; ignore and wait for next interaction.
    });
  }
};

const handleUnlock = () => {
  const ctx = getCtx();
  if (!ctx) return;
  tryResume();
};

export const initAudio = (initiallyEnabled: boolean) => {
  audioEnabled = initiallyEnabled;
  if (unlockAttached) {
    return;
  }
  unlockAttached = true;
  const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
  const unlockOnce = () => {
    handleUnlock();
  };
  for (const evt of events) {
    window.addEventListener(evt, unlockOnce, { passive: true });
  }
};

export const setAudioEnabled = (enabled: boolean) => {
  audioEnabled = enabled;
  const ctx = getCtx();
  if (!ctx || !masterGain) {
    return;
  }
  const target = enabled ? 1 : 0;
  masterGain.gain.cancelScheduledValues(now());
  masterGain.gain.setTargetAtTime(target, now(), 0.02);
  if (enabled) {
    tryResume();
  }
};

const playTone = (opts: {
  freq: number;
  type?: OscillatorType;
  duration: number;
  attack?: number;
  release?: number;
  volume?: number;
  freqEnd?: number;
  detune?: number;
}) => {
  const ctx = getCtx();
  if (!ctx || !sfxGain) return;
  const {
    freq,
    type = "square",
    duration,
    attack = 0.005,
    release = 0.08,
    volume = 0.3,
    freqEnd,
    detune = 0,
  } = opts;
  const t = now();
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 0.01), t + duration);
  }
  if (detune !== 0) {
    osc.detune.setValueAtTime(detune, t);
  }
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.setValueAtTime(volume, t + Math.max(attack, duration - release));
  gain.gain.linearRampToValueAtTime(0, t + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + duration + 0.02);
};

const playNoiseBurst = (opts: {
  duration: number;
  volume?: number;
  filterFreq?: number;
  filterFreqEnd?: number;
}) => {
  const ctx = getCtx();
  if (!ctx || !sfxGain) return;
  const { duration, volume = 0.25, filterFreq = 1200, filterFreqEnd } = opts;
  const t = now();
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq, t);
  if (filterFreqEnd !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(filterFreqEnd, 40), t + duration);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  source.start(t);
  source.stop(t + duration + 0.02);
};

const canPlay = (name: SoundName): boolean => {
  const throttle = throttles[name];
  if (!throttle) return true;
  const nowMs = performance.now();
  if (nowMs - throttle.lastPlayedAt < throttle.minIntervalMs) {
    return false;
  }
  throttle.lastPlayedAt = nowMs;
  return true;
};

export const playSound = (name: SoundName) => {
  if (!audioEnabled) return;
  const ctx = getCtx();
  if (!ctx || ctx.state !== "running") {
    // Not unlocked yet; silently drop.
    return;
  }
  if (!canPlay(name)) return;

  switch (name) {
    case "shoot":
      playTone({
        freq: 880,
        freqEnd: 180,
        type: "square",
        duration: 0.09,
        volume: 0.14,
        attack: 0.002,
        release: 0.05,
      });
      return;
    case "bulletHit":
      playNoiseBurst({
        duration: 0.08,
        volume: 0.2,
        filterFreq: 2400,
        filterFreqEnd: 500,
      });
      playTone({
        freq: 520,
        freqEnd: 160,
        type: "triangle",
        duration: 0.1,
        volume: 0.12,
      });
      return;
    case "explosion":
      playNoiseBurst({
        duration: 0.45,
        volume: 0.32,
        filterFreq: 1600,
        filterFreqEnd: 80,
      });
      playTone({
        freq: 160,
        freqEnd: 40,
        type: "sawtooth",
        duration: 0.35,
        volume: 0.16,
      });
      return;
    case "heartPickup":
      playTone({
        freq: 660,
        type: "triangle",
        duration: 0.1,
        volume: 0.2,
      });
      setTimeout(() => {
        playTone({
          freq: 990,
          type: "triangle",
          duration: 0.12,
          volume: 0.2,
        });
      }, 70);
      return;
    case "ammoPickup":
      playTone({
        freq: 440,
        freqEnd: 740,
        type: "square",
        duration: 0.12,
        volume: 0.18,
      });
      return;
    case "playerHit":
      playNoiseBurst({
        duration: 0.14,
        volume: 0.28,
        filterFreq: 900,
        filterFreqEnd: 200,
      });
      playTone({
        freq: 220,
        freqEnd: 90,
        type: "sawtooth",
        duration: 0.18,
        volume: 0.2,
      });
      return;
    case "playerDeath":
      playNoiseBurst({
        duration: 0.8,
        volume: 0.38,
        filterFreq: 1400,
        filterFreqEnd: 60,
      });
      playTone({
        freq: 180,
        freqEnd: 40,
        type: "sawtooth",
        duration: 0.7,
        volume: 0.22,
      });
      return;
    case "goalReached":
      playTone({
        freq: 520,
        type: "triangle",
        duration: 0.12,
        volume: 0.2,
      });
      setTimeout(() => {
        playTone({
          freq: 780,
          type: "triangle",
          duration: 0.14,
          volume: 0.2,
        });
      }, 90);
      return;
    case "victory": {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((note, i) => {
        setTimeout(() => {
          playTone({
            freq: note,
            type: "triangle",
            duration: 0.22,
            volume: 0.22,
          });
        }, i * 120);
      });
      return;
    }
    case "defeat": {
      const notes = [440, 392, 349.23, 261.63];
      notes.forEach((note, i) => {
        setTimeout(() => {
          playTone({
            freq: note,
            type: "sawtooth",
            duration: 0.3,
            volume: 0.2,
          });
        }, i * 150);
      });
      return;
    }
    case "menuClick":
      playTone({
        freq: 620,
        type: "square",
        duration: 0.04,
        volume: 0.1,
        attack: 0.001,
        release: 0.02,
      });
      return;
    case "menuConfirm":
      playTone({
        freq: 520,
        type: "triangle",
        duration: 0.08,
        volume: 0.15,
      });
      setTimeout(() => {
        playTone({
          freq: 780,
          type: "triangle",
          duration: 0.1,
          volume: 0.15,
        });
      }, 50);
      return;
    case "countdownTick":
      playTone({
        freq: 520,
        type: "square",
        duration: 0.09,
        volume: 0.16,
      });
      return;
    case "countdownGo":
      playTone({
        freq: 880,
        type: "triangle",
        duration: 0.28,
        volume: 0.22,
      });
      return;
  }
};

"use client";

/**
 * Short Web Audio cues: the heads-up "you're nearly up" blip and the full
 * test chime. The long break-over alarm lives in `./alarm` — this file is
 * deliberately limited to sounds that finish on their own.
 */

let chimeCtx: AudioContext | null = null;
let chimeBus: GainNode | null = null;

export function getChimeCtx(): AudioContext | null {
  try {
    if (!chimeCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      chimeCtx = new Ctor();
    }
    return chimeCtx;
  } catch {
    return null;
  }
}

function getChimeBus(ctx: AudioContext): GainNode {
  if (!chimeBus) {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 14;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(limiter);
    limiter.connect(ctx.destination);
    chimeBus = bus;
  }
  return chimeBus;
}

function scheduleTone(
  ctx: AudioContext,
  bus: GainNode,
  freq: number,
  at: number,
  peak: number,
  decay: number,
  type: OscillatorType,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(at);
  osc.stop(at + decay + 0.02);
  return osc;
}

/** Creates/resumes the shared context. Safe to call on every user gesture. */
export function primeChimeCtx() {
  const ctx = getChimeCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

export function silenceChime() {
  const ctx = chimeCtx;
  const bus = chimeBus;
  if (!ctx || !bus) return;
  try {
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(0, ctx.currentTime);
  } catch {
    // Audio unavailable.
  }
}

/** The full "this is what the alarm sounds like" preview. */
export function playChime() {
  const ctx = getChimeCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const bus = getChimeBus(ctx);
    const t0 = ctx.currentTime;
    bus.gain.cancelScheduledValues(t0);
    bus.gain.setValueAtTime(1, t0);
    const notes: [number, number][] = [
      [988, 0],
      [988, 0.17],
      [1319, 0.34],
      [988, 1.2],
      [988, 1.37],
      [1319, 1.54],
      [988, 2.4],
      [988, 2.57],
      [1319, 2.74],
      [1319, 3.7],
      [1319, 3.87],
      [1568, 4.04],
    ];
    for (const [freq, at] of notes) {
      scheduleTone(ctx, bus, freq, t0 + at, 0.55, 0.42, "triangle");
      scheduleTone(ctx, bus, freq * 2, t0 + at, 0.2, 0.3, "triangle");
    }
    scheduleTone(ctx, bus, 1568, t0 + 4.04, 0.5, 1.4, "sine");
  } catch {
    // Audio unavailable — the break-over alarm still covers it.
  }
}

/** Fires `warnMs` before the break ends, while the screen is still watched. */
export function playHeadsUpChime() {
  const ctx = getChimeCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const bus = getChimeBus(ctx);
    const t0 = ctx.currentTime;
    bus.gain.cancelScheduledValues(t0);
    bus.gain.setValueAtTime(1, t0);
    scheduleTone(ctx, bus, 784, t0, 0.45, 0.3, "triangle");
    scheduleTone(ctx, bus, 784, t0 + 0.22, 0.45, 0.3, "triangle");
    scheduleTone(ctx, bus, 1047, t0 + 0.44, 0.45, 0.7, "triangle");
  } catch {
    // Audio unavailable.
  }
}

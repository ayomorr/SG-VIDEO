"use client";

/**
 * The break-over alarm.
 *
 * The single most important property here is that a finished break *always*
 * makes noise, so this never relies on one mechanism:
 *
 *   1. an <audio> element looping the siren asset,
 *   2. a Web Audio siren synthesised on the fly, used whenever the element
 *      cannot play (autoplay policy, missing/corrupt asset, stalled buffer),
 *   3. vibration and a notification underneath both of those.
 *
 * A keep-alive re-asserts every layer on a timer, so a mechanism that dies
 * mid-ring is restarted rather than left silent.
 *
 * State lives at module scope on purpose: the alarm is owed until the user
 * dismisses it, so it must survive component unmounts and client-side
 * navigation. Nothing in here is tied to a React lifecycle.
 */

import { getChimeCtx, silenceChime } from "@/lib/audio/chime";

export type AlarmSoundChoice = "siren" | "screech";

export const ALARM_SOUND_OPTIONS: { value: AlarmSoundChoice; label: string }[] = [
  { value: "siren", label: "Siren" },
  { value: "screech", label: "Screech" },
];

const ALARM_FILES: Record<AlarmSoundChoice, string> = {
  siren: "/audio/siren.mp3",
  screech: "/audio/screech.mp3",
};

const DEFAULT_SOUND: AlarmSoundChoice = "siren";

/** The currently selected sound, for callers that render a label. */
export function alarmSoundLabel(choice?: AlarmSoundChoice): string {
  const target = choice ?? alarmSound;
  return ALARM_SOUND_OPTIONS.find((o) => o.value === target)?.label ?? "Siren";
}

const MUTED_KEY = "scrolldictive.alarm.muted.v1";
const VOLUME_KEY = "scrolldictive.alarm.volume.v1";
/** Kept from the original key so an existing choice survives the rename. */
const SOUND_CHOICE_KEY = "scrolldictive.timer.soundchoice.v1";

/** How often the keep-alive re-checks that something is actually audible. */
const KEEPALIVE_MS = 800;
/** Consecutive silent ticks before vibration + notification are added. */
const ESCALATE_AFTER_TICKS = 3;
/** A preview must never ring forever — this is the cap for test alarms. */
const PREVIEW_MAX_MS = 10_000;

const SWEEP_LOW_HZ = 620;
const SWEEP_HIGH_HZ = 1180;
const SWEEP_RATE_HZ = 0.9;

const NOTIF_TITLE = "Scroll Detect — break's over";

let alarmAudio: HTMLAudioElement | null = null;
/** Which file the element is currently pointed at, so `src` is only ever
 *  reassigned on a real change of sound — never on a retry. */
let loadedChoice: AlarmSoundChoice | null = null;

let alarmSound: AlarmSoundChoice = DEFAULT_SOUND;

interface SynthVoice {
  carrier: OscillatorNode;
  lfo: OscillatorNode;
  gain: GainNode;
}
let synth: SynthVoice | null = null;

let keepAliveTimer: number | null = null;
let autoStopTimer: number | null = null;
let ringing = false;
let silentTicks = 0;
let notified = false;
let muted = false;
let volume = 1;
const listeners = new Set<() => void>();

/**
 * Bumped on every prime and every start. Priming ends in an async
 * play/pause, so without a token that teardown can land *after* an alarm has
 * started and pause the very thing it was meant to unlock.
 */
let primeToken = 0;

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
};
let wakeLock: WakeLockSentinelLike | null = null;

/* ------------------------------------------------------------------ */
/* persisted preferences                                              */
/* ------------------------------------------------------------------ */

function clampVolume(next: number): number {
  if (!Number.isFinite(next)) return 1;
  return Math.min(1, Math.max(0, next));
}

function loadPrefs() {
  if (typeof localStorage === "undefined") return;
  muted = localStorage.getItem(MUTED_KEY) === "1";
  // `Number(null)` is 0, so an absent key would coerce to silence — the one
  // outcome that must never happen by accident. A key that is genuinely
  // present is honoured, including an explicit 0.
  const raw = localStorage.getItem(VOLUME_KEY);
  if (raw !== null) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) volume = parsed;
  }
  const stored = localStorage.getItem(SOUND_CHOICE_KEY);
  if (stored && ALARM_SOUND_OPTIONS.some((o) => o.value === stored)) {
    alarmSound = stored as AlarmSoundChoice;
  } else if (stored) {
    // A sound that no longer exists (the truck horn was removed). Drop the
    // stale key rather than leaving it to fail this check on every load.
    localStorage.removeItem(SOUND_CHOICE_KEY);
  }
}

function notify() {
  for (const listener of listeners) listener();
}

/* ------------------------------------------------------------------ */
/* layer 1 — the siren asset                                          */
/* ------------------------------------------------------------------ */

/**
 * The element is created once and `src` is only reassigned when the selected
 * sound actually changes. `audio.src` reflects an *absolute* URL, so guarding a
 * retry against the relative path never matches and each "retry" restarts the
 * download mid-flight, which aborts the pending `play()`. `loadedChoice` is
 * therefore the only reliable thing to compare.
 */
function getAlarmAudio(): HTMLAudioElement {
  if (!alarmAudio) {
    alarmAudio = new Audio();
    alarmAudio.preload = "auto";
    alarmAudio.loop = true;
    // If the asset itself is the problem, drop straight to the synthesised
    // siren instead of waiting out the keep-alive.
    alarmAudio.addEventListener("error", () => {
      if (ringing) startSynth();
    });
  }
  if (loadedChoice !== alarmSound) {
    const href = new URL(ALARM_FILES[alarmSound], window.location.href).href;
    loadedChoice = alarmSound;
    // Assigning a new `src` sets readyState to 0 and cancels any pending
    // playback, so this must only ever happen between rings, never mid-ring.
    alarmAudio.src = href;
  }
  return alarmAudio;
}

function elementIsAudible(): boolean {
  const audio = alarmAudio;
  if (!audio || audio.paused || audio.ended) return false;
  // readyState 2 = HAVE_CURRENT_DATA. Below that the element is "playing" but
  // has nothing to output, so it must not count as making noise.
  return audio.readyState >= 2;
}

/**
 * The siren recording is the intended sound, so the synthesised stand-in is
 * only ever allowed to run while the recording is silent. Called from every
 * path that can start the element.
 */
function preferRecording() {
  if (synth && elementIsAudible()) stopSynth();
}

function startElement(): Promise<void> {
  if (muted || volume <= 0) return Promise.resolve();
  try {
    const audio = getAlarmAudio();
    audio.volume = clampVolume(volume);
    audio.muted = false;
    return audio.play().then((r) => {
      preferRecording();
      return r;
    });
  } catch {
    return Promise.reject(new Error("audio unavailable"));
  }
}

/* ------------------------------------------------------------------ */
/* layer 2 — synthesised siren                                        */
/* ------------------------------------------------------------------ */

function startSynth() {
  if (synth) return;
  if (muted || volume <= 0) return;
  const ctx = getChimeCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});

    const t0 = ctx.currentTime;
    const centre = (SWEEP_LOW_HZ + SWEEP_HIGH_HZ) / 2;
    const depth = (SWEEP_HIGH_HZ - SWEEP_LOW_HZ) / 2;

    const carrier = ctx.createOscillator();
    carrier.type = "sawtooth";
    carrier.frequency.setValueAtTime(centre, t0);

    // An LFO on the carrier frequency is what makes it wail rather than beep.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(SWEEP_RATE_HZ, t0);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.setValueAtTime(depth, t0);
    lfo.connect(lfoDepth);
    lfoDepth.connect(carrier.frequency);

    // Soften the sawtooth so it reads as a siren, not a buzzsaw.
    const body = ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.setValueAtTime(2_600, t0);
    body.Q.setValueAtTime(0.7, t0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(clampVolume(volume) * 0.9, t0 + 0.06);

    carrier.connect(body);
    body.connect(gain);
    gain.connect(ctx.destination);

    carrier.start(t0);
    lfo.start(t0);
    synth = { carrier, lfo, gain };
  } catch {
    // Web Audio unavailable — the element and notification layers remain.
  }
}

function stopSynth() {
  const voice = synth;
  synth = null;
  if (!voice) return;
  try {
    const ctx = getChimeCtx();
    if (ctx) {
      const t = ctx.currentTime;
      voice.gain.gain.cancelScheduledValues(t);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, t);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      voice.carrier.stop(t + 0.12);
      voice.lfo.stop(t + 0.12);
    }
  } catch {
    // Already torn down.
  }
}

/* ------------------------------------------------------------------ */
/* layer 3 — vibration + notification                                  */
/* ------------------------------------------------------------------ */

function vibrate() {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate([400, 200, 400, 200, 400]);
    }
  } catch {
    // Unsupported (iOS, desktop) — fine, other layers cover it.
  }
}

async function showNotification(body: string) {
  if (notified) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  // Never prompt here: this runs on a timer, not a gesture, so a prompt
  // cannot be shown and would only stall. Permission is requested up front
  // when the user taps Start.
  if (Notification.permission !== "granted") return;
  notified = true;

  const opts: NotificationOptions = {
    body,
    tag: "timer-break",
    icon: "/icon-192.png",
  };

  if ("serviceWorker" in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.getRegistration(),
        new Promise<ServiceWorkerRegistration | null>((resolve) =>
          setTimeout(() => resolve(null), 1500),
        ),
      ]);
      if (reg && typeof reg.showNotification === "function") {
        try {
          await reg.showNotification(NOTIF_TITLE, opts);
          return;
        } catch {
          // Fall through to the constructor.
        }
      }
    } catch {
      // Fall through to the constructor.
    }
  }

  try {
    new Notification(NOTIF_TITLE, opts);
  } catch {
    // The in-app alarm is already ringing.
  }
}

/* ------------------------------------------------------------------ */
/* keep-alive                                                         */
/* ------------------------------------------------------------------ */

function keepAliveTick() {
  if (!ringing) return;
  if (muted || volume <= 0) return;

  // The recording wins. The moment the siren asset is actually producing
  // sound, tear the synthesised fallback down so it can never mask or
  // compete with it.
  if (elementIsAudible()) {
    if (synth) stopSynth();
    silentTicks = 0;
    return;
  }
  if (synth) {
    // The fallback is carrying the alarm on its own; keep it alive.
    silentTicks = 0;
    return;
  }

  silentTicks += 1;

  // Retrying the element is safe now: `src` is never reassigned, so this
  // resumes the existing load instead of restarting it.
  void startElement().catch(() => {});

  // Second silent tick: the asset is not going to make it. Take over with the
  // synthesised siren, which needs neither the network nor element permission.
  if (silentTicks >= 2) startSynth();

  if (silentTicks >= ESCALATE_AFTER_TICKS) {
    vibrate();
    void showNotification(
      "Your break finished. Dismiss the questions in Scroll Detect to stop the alarm.",
    );
  }
}

function kick() {
  if (!ringing) return;
  if (muted || volume <= 0) return;
  preferRecording();
  if (!elementIsAudible() && !synth) void startElement().catch(() => startSynth());
}

/* ------------------------------------------------------------------ */
/* public API                                                         */
/* ------------------------------------------------------------------ */

loadPrefs();

/**
 * Unlocks every audio layer from a real user gesture. Browsers refuse to make
 * noise otherwise, and `startAlarm` is always reached from a timer — so this
 * has to be wired to taps, not to the timer.
 */
export function primeAlarmAudio() {
  if (typeof window === "undefined") return;
  const ctx = getChimeCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});

  // Resuming an AudioContext does NOT grant permission to a separate
  // <audio> element, so prime that one too: a silent, instant play/pause
  // marks the element as unlocked for later programmatic playback.
  if (ringing) return;
  const token = ++primeToken;
  try {
    const audio = getAlarmAudio();
    if (!audio.paused) return;
    audio.muted = true;
    void audio
      .play()
      .then(() => {
        // The alarm can be started in the same tick as the prime (a tap on
        // "Test alarm" does exactly that), and its play() can resolve first.
        // Pausing here would silence it, and would reject its play() with
        // AbortError — so bail out unless this prime is still the current one
        // and nothing has started ringing.
        if (token !== primeToken || ringing) return;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        if (token === primeToken) audio.muted = false;
      });
  } catch {
    // Audio unavailable.
  }
}

export function startAlarm(
  body = "Your timer just finished. Stretch, drink water, and only then decide what's next.",
  autoStopMs: number | null = null,
) {
  stopAlarm();
  ringing = true;
  // Invalidate any prime still in flight, so its teardown cannot pause us.
  primeToken += 1;
  notify();

  if (!muted && volume > 0) {
    // The selected recording is the sound. The synthesised fallback is a last
    // resort for a browser that refuses the element outright, and the
    // keep-alive tears it down again the moment the recording comes up — so
    // what you hear is the chosen audio file, not a stand-in.
    void startElement().catch((err) => {
      console.warn(
        `[alarm] ${alarmSoundLabel()} could not play, falling back to the synthesised siren`,
        err,
      );
      startSynth();
    });
  }

  vibrate();
  void showNotification(body);

  keepAliveTimer = window.setInterval(keepAliveTick, KEEPALIVE_MS);

  if (autoStopMs !== null) {
    autoStopTimer = window.setTimeout(() => stopAlarm(), autoStopMs);
  }
}

export function stopAlarm() {
  if (keepAliveTimer !== null) {
    window.clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  if (autoStopTimer !== null) {
    window.clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
  ringing = false;
  silentTicks = 0;
  notified = false;
  stopSynth();
  if (alarmAudio) {
    try {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    } catch {
      // Audio unavailable.
    }
  }
  silenceChime();
  notify();
}

/** Re-asserts the alarm from a user gesture or a tab becoming visible. */
export function kickAlarm() {
  kick();
}

export function isAlarmRinging(): boolean {
  return ringing;
}

/**
 * Plays a short, self-stopping preview of the currently selected recording, so
 * switching sound can be confirmed without waiting for a real break.
 */
export function previewAlarm() {
  if (isAlarmRinging()) stopAlarm();
  startAlarm("This is what the break-over alarm sounds like.", PREVIEW_MAX_MS);
}

export function subscribeAlarm(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAlarmSound(): AlarmSoundChoice {
  return alarmSound;
}

export function setAlarmSound(next: AlarmSoundChoice) {
  if (!ALARM_SOUND_OPTIONS.some((o) => o.value === next)) return;
  if (next === alarmSound) return;
  alarmSound = next;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SOUND_CHOICE_KEY, next);
  }
  // Changing the recording replaces the currently loaded one. The element is
  // pointed at the new file here, while nothing is playing, so the in-flight
  // load is not aborted.
  loadedChoice = null;
  notify();
  // A new selection is an explicit "let me hear this", so preview it straight
  // away instead of waiting for the next break to discover it was wrong. This
  // still respects mute and volume 0 — if the user silenced the alarm they do
  // not want it brought back by changing a dropdown.
  if (isAlarmRinging()) stopAlarm();
  startAlarm("This is the break-over alarm you just selected.", PREVIEW_MAX_MS);
}

export function getAlarmMuted(): boolean {
  return muted;
}

export function setAlarmMuted(next: boolean) {
  muted = next;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(MUTED_KEY, next ? "1" : "0");
  }
  if (next) {
    if (alarmAudio) {
      try {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
      } catch {
        // Audio unavailable.
      }
    }
    stopSynth();
  } else if (ringing) {
    void startElement().catch(() => startSynth());
  }
  notify();
}

export function getAlarmVolume(): number {
  return volume;
}

export function setAlarmVolume(next: number) {
  volume = clampVolume(next);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(VOLUME_KEY, String(volume));
  }
  if (alarmAudio) {
    try {
      alarmAudio.volume = volume;
    } catch {
      // Audio unavailable.
    }
  }
  if (ringing && !muted && volume > 0) {
    void startElement().catch(() => startSynth());
  }
  notify();
}

/* ------------------------------------------------------------------ */
/* wake lock                                                          */
/* ------------------------------------------------------------------ */

type WakeLockManagerLike = {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
};

function getWakeLockManager(): WakeLockManagerLike | null {  const nav = navigator as Navigator & {
    wakeLock?: WakeLockManagerLike;
  };
  return nav.wakeLock ?? null;
}

/**
 * Without this the phone dims and locks mid-break, the tab gets throttled or
 * discarded, and the countdown never reaches zero — so the alarm never runs.
 */
export function acquireWakeLock() {
  const manager = getWakeLockManager();
  if (!manager || wakeLock) return;
  void manager
    .request("screen")
    .then((sentinel) => {
      wakeLock = sentinel;
      // The browser drops the lock whenever the page is hidden, so the next
      // `visibilitychange` has to ask for it again.
      sentinel.addEventListener?.("release", () => {
        wakeLock = null;
      });
    })
    .catch(() => {
      // Denied or unsupported — the countdown still runs while the tab is open.
    });
}

export function releaseWakeLock() {
  const sentinel = wakeLock;
  wakeLock = null;
  if (sentinel) void sentinel.release().catch(() => {});
}

export function rearmWakeLock() {
  if (document.visibilityState === "visible") acquireWakeLock();
}

export { PREVIEW_MAX_MS };

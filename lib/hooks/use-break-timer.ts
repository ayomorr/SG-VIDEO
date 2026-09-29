"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORE_KEY = "scrolldictive.timer.v1";
const DURATION_PREF_KEY = "scrolldictive.timer.pref.v1";
const SOUND_KEY = "scrolldictive.timer.sound.v1";
const SOUND_CHOICE_KEY = "scrolldictive.timer.soundchoice.v1";
const WARN_KEY = "scrolldictive.timer.warn.v1";

export const PRESETS_MIN = [5, 10, 15, 25, 45];
export const WARN_OPTIONS_MIN = [0, 1, 2, 5, 10, 15] as const;

export type AlarmSoundChoice = "siren" | "screech" | "horn";

export const ALARM_SOUND_OPTIONS: { value: AlarmSoundChoice; label: string }[] = [
  { value: "siren", label: "Siren" },
  { value: "screech", label: "Screech" },
  { value: "horn", label: "Truck horn" },
];

const ALARM_FILES: Record<AlarmSoundChoice, string> = {
  siren: "/audio/siren.mp3",
  screech: "/audio/screech.mp3",
  horn: "/audio/truck-horn.mp3",
};

export type BreakTimerPhase = "idle" | "running" | "done";

interface PersistedTimer {
  running: boolean;
  endAt: number;
  durationMs: number;
  warned: boolean;
}

export function mmss(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function loadSound(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "0";
}

function saveSound(on: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SOUND_KEY, on ? "1" : "0");
}

function loadSoundChoice(): AlarmSoundChoice {
  if (typeof localStorage === "undefined") return "siren";
  const stored = localStorage.getItem(SOUND_CHOICE_KEY);
  return (ALARM_SOUND_OPTIONS as { value: AlarmSoundChoice }[]).some(
    (o) => o.value === stored,
  )
    ? (stored as AlarmSoundChoice)
    : "siren";
}

function saveSoundChoice(choice: AlarmSoundChoice) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SOUND_CHOICE_KEY, choice);
}

function loadDurationPref(): number {
  if (typeof localStorage === "undefined") return 15 * 60_000;
  const raw = Number(localStorage.getItem(DURATION_PREF_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 15 * 60_000;
}

function saveDurationPref(ms: number) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DURATION_PREF_KEY, String(ms));
}

function loadWarnMin(): number {
  if (typeof localStorage === "undefined") return 15;
  const raw = Number(localStorage.getItem(WARN_KEY));
  return (WARN_OPTIONS_MIN as readonly number[]).includes(raw) ? raw : 15;
}

function saveWarnMin(min: number) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WARN_KEY, String(min));
}

function loadPersisted(): PersistedTimer | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTimer;
    if (typeof parsed.endAt === "number" && typeof parsed.durationMs === "number") {
      return parsed;
    }
  } catch {
    // Ignore corrupt state.
  }
  return null;
}

function savePersisted(
  timer: Omit<PersistedTimer, "durationMs"> & { durationMs: number } | null,
) {
  if (typeof localStorage === "undefined") return;
  if (timer) localStorage.setItem(STORE_KEY, JSON.stringify(timer));
  else localStorage.removeItem(STORE_KEY);
}

let chimeCtx: AudioContext | null = null;

function getChimeCtx(): AudioContext | null {
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

/** iOS/Chrome block audio until a user gesture unlocks it. */
function unlockAudio() {
  const ctx = getChimeCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

let chimeBus: GainNode | null = null;

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

const ALARM_MAX_MS = 600_000;

let alarmTimer: ReturnType<typeof setTimeout> | null = null;
let alarmAudio: HTMLAudioElement | null = null;
let alarmStartedAt = 0;

function getAlarmAudio(choice: AlarmSoundChoice): HTMLAudioElement {
  if (!alarmAudio) {
    alarmAudio = new Audio();
    alarmAudio.loop = true;
  }
  if (alarmAudio.src !== ALARM_FILES[choice]) {
    alarmAudio.src = ALARM_FILES[choice];
  }
  return alarmAudio;
}

function startAlarm(choice: AlarmSoundChoice) {
  stopAlarm();
  try {
    const audio = getAlarmAudio(choice);
    audio.volume = 1;
    audio.currentTime = 0;
    alarmStartedAt = performance.now();
    void audio.play().catch(() => {
      // Blocked (e.g. iOS background) — the notification still covers it.
    });
    alarmTimer = setTimeout(() => {
      if (performance.now() - alarmStartedAt >= ALARM_MAX_MS) {
        stopAlarm();
      }
    }, ALARM_MAX_MS + 100);
  } catch {
    // Audio unavailable.
  }
}

function stopAlarm() {
  if (alarmTimer !== null) {
    clearTimeout(alarmTimer);
    alarmTimer = null;
  }
  if (alarmAudio) {
    try {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    } catch {
      // Audio unavailable.
    }
  }
  silenceChime();
}

function playChime() {
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
    // Audio unavailable — the in-app alarm still covers it.
  }
}

function silenceChime() {
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

function playHeadsUpChime() {
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

/**
 * The heads-up can never land on top of the alarm, so short breaks trim it
 * instead of silently dropping it. Returns the effective lead time in ms.
 */
function resolveWarnMs(warnMs: number, durationMs: number): number {
  if (warnMs <= 0 || durationMs <= 0) return 0;
  const room = durationMs - 30_000;
  if (room < 60_000) return 0;
  return Math.min(warnMs, Math.max(60_000, Math.floor(room / 2)));
}

function vibratePattern() {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate([400, 200, 400, 200, 400]);
    }
  } catch {
    // Not supported — fine.
  }
}

async function sendNotification(title: string, body: string, tag: string) {
  if (!("Notification" in window)) return;

  // Ask for permission if the user hasn't decided yet. This runs inside the
  // timer's gesture (Start tap) so browsers that require a user gesture can
  // still show the prompt.
  let perm = Notification.permission;
  if (perm === "default") {
    try {
      perm = await Notification.requestPermission();
    } catch {
      return;
    }
  }
  if (perm !== "granted") return;

  const opts: NotificationOptions = {
    body,
    tag,
    icon: "/apple-touch-icon-180.png",
  };

  // Prefer the service worker (works even from a background page), but never
  // wait on `ready` forever — if there's no active SW, fall through to the
  // plain constructor instead of silently dying.
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
          await reg.showNotification(title, opts);
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
    new Notification(title, opts);
  } catch {
    // In-app alarm still covers it.
  }
}

/** Schedules a precise background notification (Notification Triggers). */
async function scheduleBackgroundNotification(
  title: string,
  body: string,
  tag: string,
  when: number,
): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }
  const Trigger = (globalThis as { TimestampTrigger?: new (t: number) => object })
    .TimestampTrigger;
  if (!Trigger) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    await reg.showNotification(title, {
      body,
      tag,
      icon: "/apple-touch-icon-180.png",
      showTrigger: new Trigger(when),
    } as NotificationOptions & { showTrigger: object });
    return true;
  } catch {
    return false;
  }
}

export function useBreakTimer() {
  const [durationMs, setDurationMs] = useState(loadDurationPref);
  const [remaining, setRemaining] = useState(durationMs);
  const [phase, setPhase] = useState<BreakTimerPhase>("idle");
  const [endAt, setEndAt] = useState(0);
  const [sound, setSound] = useState(loadSound);
  const [alarmSound, setAlarmSound] = useState<AlarmSoundChoice>(loadSoundChoice);
  const [notifState, setNotifState] = useState<NotificationPermission>("default");
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [finishTime, setFinishTime] = useState("");
  const [warnMin, setWarnMin] = useState(loadWarnMin);
  const [warned, setWarned] = useState(false);
  const [reflectionPending, setReflectionPending] = useState(false);
  const finishedRef = useRef(false);
  const warnedRef = useRef(false);
  const bgWarnScheduledRef = useRef(false);

  const warnMs = resolveWarnMs(warnMin * 60_000, durationMs);
  const warnEffectiveMin = Math.round(warnMs / 60_000);

  useEffect(() => {
    setNotifState("Notification" in window ? Notification.permission : "denied");
    const persisted = loadPersisted();
    if (persisted && persisted.running) {
      warnedRef.current = persisted.warned ?? false;
      setWarned(persisted.warned ?? false);
      if (persisted.endAt <= Date.now()) {
        setPhase("done");
        setReflectionPending(true);
        finishedRef.current = true;
        savePersisted(null);
      } else {
        setEndAt(persisted.endAt);
        setRemaining(persisted.endAt - Date.now());
        setDurationMs(persisted.durationMs);
        setPhase("running");
      }
    }
  }, []);

  // iOS only lets audio run after a user gesture, so unlock it on any
  // interaction and re-unlock every time the app becomes visible again.
  useEffect(() => {
    unlockAudio();
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("touchstart", unlock);
    const onVis = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      document.removeEventListener("visibilitychange", onVis);
      stopAlarm();
    };
  }, []);

  const fireHeadsUp = useCallback(() => {
    warnedRef.current = true;
    setWarned(true);
    savePersisted({ running: true, endAt, durationMs, warned: true });
    if (!bgWarnScheduledRef.current) {
      if (sound) playHeadsUpChime();
      void sendNotification(
        "Scroll Detect — almost up",
        `${warnEffectiveMin} min left on your break. Wrap up so it doesn't get cut off.`,
        "timer-headsup",
      );
    }
  }, [endAt, durationMs, warnEffectiveMin, sound]);

  // Always-on countdown: it lives here (mounted across the whole app), so the
  // heads-up and alarm fire even when the user is looking at another tab.
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      const left = endAt - Date.now();
      setRemaining(Math.max(0, left));
      if (!warnedRef.current && warnMs > 0 && left <= warnMs) {
        fireHeadsUp();
      }
      if (left <= 0) {
        window.clearInterval(id);
        if (!finishedRef.current) {
          finishedRef.current = true;
          savePersisted(null);
          setPhase("done");
          setReflectionPending(true);
          if (sound) startAlarm(alarmSound);
          vibratePattern();
          void sendNotification(
            "Scroll Detect — break's over",
            "Your timer just finished. Stretch, drink water, and only then decide what's next.",
            "timer-break",
          );
        }
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, endAt, durationMs, sound, alarmSound, warnMs, fireHeadsUp]);

  // If the user returns to the app mid-break, catch up on the heads-up or end.
  useEffect(() => {
    if (phase !== "running") return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const left = endAt - Date.now();
        setRemaining(Math.max(0, left));
        if (!warnedRef.current && warnMs > 0 && left <= warnMs) {
          fireHeadsUp();
        }
        if (left <= 0 && !finishedRef.current) {
          finishedRef.current = true;
          savePersisted(null);
          setPhase("done");
          setReflectionPending(true);
          if (sound) startAlarm(alarmSound);
          vibratePattern();
          void sendNotification(
            "Scroll Detect — break's over",
            "Your timer just finished. Stretch, drink water, and only then decide what's next.",
            "timer-break",
          );
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, endAt, durationMs, sound, alarmSound, warnMs, fireHeadsUp]);

  const start = () => {
    if (durationMs <= 0) return;
    finishedRef.current = false;
    warnedRef.current = false;
    setWarned(false);
    bgWarnScheduledRef.current = false;
    setReflectionPending(false);
    stopAlarm();
    const target = Date.now() + durationMs;
    setEndAt(target);
    setRemaining(durationMs);
    setPhase("running");
    savePersisted({ running: true, endAt: target, durationMs, warned: false });
    saveDurationPref(durationMs);
    unlockAudio();

    const scheduleTriggers = () => {
      // Precise background alarm where Notification Triggers is supported.
      void scheduleBackgroundNotification(
        "Scroll Detect — break's over",
        "Your timer just finished. Stretch, drink water, and only then decide what's next.",
        "timer-break",
        target,
      );

      // Heads-up before the alarm (auto-trimmed for shorter breaks).
      if (warnMs > 0) {
        void scheduleBackgroundNotification(
          "Scroll Detect — almost up",
          `${warnEffectiveMin} min left on your break. Wrap up so it doesn't get cut off.`,
          "timer-headsup",
          target - warnMs,
        ).then((ok) => {
          bgWarnScheduledRef.current = ok;
        });
      }
    };

    // Browsers can't show a permission prompt outside a user gesture, and this
    // tap IS the gesture — so ask right here instead of waiting for the tiny
    // "Enable" toggle. If permission was already granted (or denied), we don't
    // prompt again.
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission().then((perm) => {
        setNotifState(perm);
        if (perm === "granted") scheduleTriggers();
      });
    } else {
      scheduleTriggers();
    }
  };

  const pause = () => {
    const left = Math.max(0, endAt - Date.now());
    setRemaining(left);
    setDurationMs(left > 5_000 ? left : durationMs);
    warnedRef.current = false;
    setWarned(false);
    setPhase("idle");
    savePersisted(null);
  };

  const cancel = () => {
    stopAlarm();
    finishedRef.current = false;
    warnedRef.current = false;
    setWarned(false);
    setReflectionPending(false);
    const pref = loadDurationPref();
    setDurationMs(pref);
    setRemaining(pref);
    setPhase("idle");
    savePersisted(null);
  };

  const applyPreset = (min: number) => {
    const ms = min * 60_000;
    setDurationMs(ms);
    setRemaining(ms);
    setCustomDays(0);
    setCustomHours(0);
    setCustomMinutes(0);
    setFinishTime("");
    saveDurationPref(ms);
  };

  const applyCustom = () => {
    const min = customDays * 1440 + customHours * 60 + customMinutes;
    if (!Number.isFinite(min) || min <= 0) return;
    applyPreset(min);
  };

  const applyFinishTime = (value: string) => {
    setFinishTime(value);
    if (!value) return;
    const [h, m] = value.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;
    const target = new Date();
    target.setHours(h, m, 0, 0);
    let t = target.getTime();
    if (t <= Date.now()) t += 24 * 60 * 60_000;
    const ms = t - Date.now();
    setDurationMs(ms);
    setRemaining(ms);
    setCustomDays(0);
    setCustomHours(0);
    setCustomMinutes(0);
    saveDurationPref(ms);
  };

  const requestNotifs = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifState(perm);
  };

  const toggleSound = (next: boolean) => {
    setSound(next);
    saveSound(next);
  };

  const changeWarnMin = (min: number) => {
    setWarnMin(min);
    saveWarnMin(min);
  };

  const changeAlarmSound = (choice: AlarmSoundChoice) => {
    setAlarmSound(choice);
    saveSoundChoice(choice);
  };

  const testSound = () => {
    unlockAudio();
    playChime();
  };

  const testAlarm = () => {
    unlockAudio();
    if (alarmTimer !== null) stopAlarm();
    else startAlarm(alarmSound);
  };

  return {
    phase,
    remaining,
    durationMs,
    endAt,
    sound,
    alarmSound,
    notifState,
    customDays,
    customHours,
    customMinutes,
    finishTime,
    warnMin,
    warnEffectiveMin,
    warned,
    reflectionPending,
    setCustomDays,
    setCustomHours,
    setCustomMinutes,
    setFinishTime,
    setWarnMin,
    toggleSound,
    changeAlarmSound,
    testSound,
    testAlarm,
    completeReflection: cancel,
    requestNotifs,
    changeWarnMin,
    start,
    pause,
    cancel,
    applyPreset,
    applyCustom,
    applyFinishTime,
  };
}

export type BreakTimer = ReturnType<typeof useBreakTimer>;
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  acquireWakeLock,
  ALARM_SOUND_OPTIONS,
  type AlarmSoundChoice,
  alarmSoundLabel,
  getAlarmMuted,
  getAlarmSound,
  getAlarmVolume,
  isAlarmRinging,
  kickAlarm,
  previewAlarm,
  primeAlarmAudio,
  rearmWakeLock,
  releaseWakeLock,
  setAlarmMuted,
  setAlarmSound,
  setAlarmVolume,
  startAlarm,
  stopAlarm,
  subscribeAlarm,
} from "@/lib/audio/alarm";
import { playChime, playHeadsUpChime, primeChimeCtx } from "@/lib/audio/chime";

const STORE_KEY = "scrolldictive.timer.v1";
const DURATION_PREF_KEY = "scrolldictive.timer.pref.v1";
const WARN_KEY = "scrolldictive.timer.warn.v1";

export const PRESETS_MIN = [5, 10, 15, 25, 45];
export const WARN_OPTIONS_MIN = [0, 1, 2, 5, 10, 15] as const;

export type { AlarmSoundChoice };
export { ALARM_SOUND_OPTIONS, alarmSoundLabel };

export type BreakTimerPhase = "idle" | "running" | "done";

interface PersistedTimer {
  running: boolean;
  endAt: number;
  durationMs: number;
  warned: boolean;
  /** Set once the break is over: the alarm must keep ringing until dismissed. */
  alarmPending?: boolean;
}

export function mmss(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
  // `Number(null)` is 0 and 0 is a valid option, so an absent key would
  // silently disable the heads-up for every new user.
  const stored = localStorage.getItem(WARN_KEY);
  if (stored === null) return 15;
  const raw = Number(stored);
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

/** Keeps the alarm owed across reloads and navigation until it is dismissed. */
function persistPendingAlarm(durationMs: number) {
  savePersisted({
    running: false,
    endAt: 0,
    durationMs,
    warned: true,
    alarmPending: true,
  });
}

/**
 * The break-over alarm is started in the same tick as the reflection
 * questions, with no grace window: a silent gap is exactly the failure mode
 * this is meant to prevent. The questions sit on top of the ringing alarm,
 * and the alarm keeps going until the user dismisses them.
 */
function ringNow() {
  startAlarm(
    "Your timer just finished. Stretch, drink water, and only then decide what's next.",
  );
}

/** Bounded so a preview can never be stranded ringing with no stop control. */
function ringPreview() {
  if (isAlarmRinging()) {
    stopAlarm();
    return;
  }
  previewAlarm();
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

async function sendNotification(title: string, body: string, tag: string) {
  if (!("Notification" in window)) return;

  // Never prompt from here. This runs on a timer, not a gesture, so the
  // prompt would be rejected or silently dropped — and the permission is
  // already requested up front when the user taps Start.
  if (Notification.permission !== "granted") return;

  const opts: NotificationOptions = {
    body,
    tag,
    icon: "/icon-192.png",
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
      icon: "/icon-192.png",
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

  const [alarmRinging, setAlarmRinging] = useState(isAlarmRinging());
  const [alarmMuted, setMutedState] = useState(getAlarmMuted);
  const [alarmVolume, setVolumeState] = useState(getAlarmVolume);
  const [alarmSound, setAlarmSoundState] = useState<AlarmSoundChoice>(getAlarmSound);

  const warnMs = resolveWarnMs(warnMin * 60_000, durationMs);
  const warnEffectiveMin = Math.round(warnMs / 60_000);

  useEffect(() => {
    setNotifState("Notification" in window ? Notification.permission : "denied");
    const persisted = loadPersisted();
    if (persisted?.alarmPending) {
      // The break ended on a previous page load and was never dismissed.
      setPhase("done");
      setReflectionPending(true);
      setWarned(true);
      warnedRef.current = true;
      finishedRef.current = true;
      if (persisted.durationMs > 0) setDurationMs(persisted.durationMs);
      ringNow();
    } else if (persisted && persisted.running) {
      warnedRef.current = persisted.warned ?? false;
      setWarned(persisted.warned ?? false);
      if (persisted.endAt <= Date.now()) {
        setPhase("done");
        setReflectionPending(true);
        finishedRef.current = true;
        persistPendingAlarm(persisted.durationMs);
        ringNow();
      } else {
        setEndAt(persisted.endAt);
        setRemaining(persisted.endAt - Date.now());
        setDurationMs(persisted.durationMs);
        setPhase("running");
      }
    }
  }, []);

  // Browsers only let audio run after a user gesture, and `startAlarm` is
  // always reached from a timer, so every layer is primed from real
  // interactions and re-primed whenever the app comes back to the front.
  useEffect(() => {
    primeChimeCtx();
    primeAlarmAudio();

    const onGesture = () => {
      primeChimeCtx();
      primeAlarmAudio();
      kickAlarm();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        primeChimeCtx();
        primeAlarmAudio();
        rearmWakeLock();
        kickAlarm();
      }
    };

    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("touchstart", onGesture);
    window.addEventListener("keydown", onGesture);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("keydown", onGesture);
      document.removeEventListener("visibilitychange", onVisible);
      // Deliberately NOT stopAlarm(): the alarm is owed until the user
      // dismisses it, so unmounting (including a client-side navigation away
      // from /app) must not cancel a ring that is already owed. The module
      // scope in lib/audio/alarm keeps it alive, and the next mount re-arms
      // it from the `alarmPending` flag in localStorage.
    };
  }, []);

  // The alarm lives outside React, so mirror its ringing state into the UI.
  useEffect(
    () =>
      subscribeAlarm(() => {
        setAlarmRinging(isAlarmRinging());
      }),
    [],
  );

  const fireHeadsUp = useCallback(() => {
    warnedRef.current = true;
    setWarned(true);
    savePersisted({ running: true, endAt, durationMs, warned: true });
    if (!bgWarnScheduledRef.current) {
      playHeadsUpChime();
      void sendNotification(
        "Scroll Detect — almost up",
        `${warnEffectiveMin} min left on your break. Wrap up so it doesn't get cut off.`,
        "timer-headsup",
      );
    }
  }, [endAt, durationMs, warnEffectiveMin]);

  // Always-on countdown. It drives the heads-up and the alarm, and the alarm
  // itself lives outside React so navigating to another tab cannot silence it.
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
          persistPendingAlarm(durationMs);
          setPhase("done");
          setReflectionPending(true);
          releaseWakeLock();
          ringNow();
        }
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, endAt, durationMs, warnMs, fireHeadsUp]);

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
          persistPendingAlarm(durationMs);
          setPhase("done");
          setReflectionPending(true);
          releaseWakeLock();
          ringNow();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, endAt, durationMs, warnMs, fireHeadsUp]);

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

    // This tap is a real user gesture, which is the only moment audio and
    // wake locks can be claimed — the alarm itself fires minutes from now
    // with no activation left.
    primeChimeCtx();
    primeAlarmAudio();
    acquireWakeLock();

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
    stopAlarm();
    releaseWakeLock();
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
    releaseWakeLock();
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
    // Changing the length mid-break would rewrite the persisted end time the
    // alarm is owed against, so presets are inert while a break is running.
    if (phase === "running") return;
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
    if (phase === "running") return;
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

  const changeWarnMin = (min: number) => {
    setWarnMin(min);
    saveWarnMin(min);
  };

  const testSound = () => {
    primeChimeCtx();
    playChime();
  };

  /** Selects the break-over recording and previews it. */
  const changeAlarmSound = (choice: AlarmSoundChoice) => {
    if (choice === alarmSound) return;
    setAlarmSoundState(choice);
    setAlarmSound(choice);
  };

  /** Toggles a short, self-stopping preview of the real alarm. */
  const testAlarm = () => {
    primeChimeCtx();
    primeAlarmAudio();
    ringPreview();
  };

  const toggleAlarmMute = () => {
    const next = !getAlarmMuted();
    setAlarmMuted(next);
    setMutedState(next);
    if (!next) {
      primeChimeCtx();
      primeAlarmAudio();
    }
  };

  const changeAlarmVolume = (next: number) => {
    setAlarmVolume(next);
    setVolumeState(getAlarmVolume());
  };

  return {
    phase,
    remaining,
    durationMs,
    endAt,
    notifState,
    customDays,
    customHours,
    customMinutes,
    finishTime,
    warnMin,
    warnEffectiveMin,
    warned,
    reflectionPending,
    alarmRinging,
    alarmMuted,
    alarmVolume,
    setCustomDays,
    setCustomHours,
    setCustomMinutes,
    setFinishTime,
    setWarnMin,
    testSound,
    testAlarm,
    changeAlarmSound,
    alarmSound,
    toggleAlarmMute,
    changeAlarmVolume,
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

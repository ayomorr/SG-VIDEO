"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORE_KEY = "scrolldictive.timer.v1";
const DURATION_PREF_KEY = "scrolldictive.timer.pref.v1";
const SOUND_KEY = "scrolldictive.timer.sound.v1";
const WARN_KEY = "scrolldictive.timer.warn.v1";

export const PRESETS_MIN = [5, 10, 15, 25, 45];
export const WARN_OPTIONS_MIN = [0, 1, 2, 5, 10, 15] as const;

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

function playChime() {
  const ctx = getChimeCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const notes: [number, number][] = [
      [880, 0],
      [880, 0.4],
      [1174, 0.8],
    ];
    for (const [freq, at] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.4);
    }
  } catch {
    // Audio unavailable — the in-app alarm still covers it.
  }
}

function playHeadsUpChime() {
  const ctx = getChimeCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio unavailable.
  }
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
  try {
    const opts: NotificationOptions = {
      body,
      tag,
      icon: "/apple-touch-icon-180.png",
    };
    if ("serviceWorker" in navigator && typeof navigator.serviceWorker.ready === "object") {
      const reg = await navigator.serviceWorker.ready;
      if (typeof reg.showNotification === "function") {
        await reg.showNotification(title, opts);
        return;
      }
    }
    if ("Notification" in window && typeof Notification === "function") {
      const perm =
        typeof Notification.requestPermission === "function"
          ? await Notification.requestPermission()
          : Notification.permission;
      if (perm === "granted") new Notification(title, opts);
    }
  } catch {
    // Notification failed — the in-app alarm still fires.
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
  const [notifState, setNotifState] = useState<NotificationPermission>("default");
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [finishTime, setFinishTime] = useState("");
  const [warnMin, setWarnMin] = useState(loadWarnMin);
  const [warned, setWarned] = useState(false);
  const finishedRef = useRef(false);
  const warnedRef = useRef(false);
  const bgWarnScheduledRef = useRef(false);

  const warnMs = warnMin > 0 ? warnMin * 60_000 : 0;

  useEffect(() => {
    setNotifState("Notification" in window ? Notification.permission : "denied");
    const persisted = loadPersisted();
    if (persisted && persisted.running) {
      warnedRef.current = persisted.warned ?? false;
      setWarned(persisted.warned ?? false);
      if (persisted.endAt <= Date.now()) {
        setPhase("done");
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
    window.addEventListener("pointerdown", unlock, { once: true });
    const onVis = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const fireHeadsUp = useCallback(() => {
    warnedRef.current = true;
    setWarned(true);
    savePersisted({ running: true, endAt, durationMs, warned: true });
    if (!bgWarnScheduledRef.current) {
      playHeadsUpChime();
      void sendNotification(
        "Scroll Detect — almost up",
        `${warnMin} min left on your break. Wrap up so it doesn't get cut off.`,
        "timer-headsup",
      );
    }
  }, [endAt, durationMs, warnMin]);

  // Always-on countdown: it lives here (mounted across the whole app), so the
  // heads-up and alarm fire even when the user is looking at another tab.
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      const left = endAt - Date.now();
      setRemaining(Math.max(0, left));
      if (!warnedRef.current && warnMs > 0 && warnMs < durationMs - 30_000 && left <= warnMs) {
        fireHeadsUp();
      }
      if (left <= 0) {
        window.clearInterval(id);
        if (!finishedRef.current) {
          finishedRef.current = true;
          savePersisted(null);
          setPhase("done");
          if (sound) playChime();
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
  }, [phase, endAt, durationMs, sound, warnMs, fireHeadsUp]);

  // If the user returns to the app mid-break, catch up on the heads-up or end.
  useEffect(() => {
    if (phase !== "running") return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const left = endAt - Date.now();
        setRemaining(Math.max(0, left));
        if (!warnedRef.current && warnMs > 0 && warnMs < durationMs - 30_000 && left <= warnMs) {
          fireHeadsUp();
        }
        if (left <= 0 && !finishedRef.current) {
          finishedRef.current = true;
          savePersisted(null);
          setPhase("done");
          if (sound) playChime();
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
  }, [phase, endAt, durationMs, sound, warnMs, fireHeadsUp]);

  const start = () => {
    if (durationMs <= 0) return;
    finishedRef.current = false;
    warnedRef.current = false;
    setWarned(false);
    bgWarnScheduledRef.current = false;
    const target = Date.now() + durationMs;
    setEndAt(target);
    setRemaining(durationMs);
    setPhase("running");
    savePersisted({ running: true, endAt: target, durationMs, warned: false });
    saveDurationPref(durationMs);
    unlockAudio();

    // Precise background alarm where Notification Triggers is supported.
    void scheduleBackgroundNotification(
      "Scroll Detect — break's over",
      "Your timer just finished. Stretch, drink water, and only then decide what's next.",
      "timer-break",
      target,
    );

    // Heads-up before the alarm (auto-trimmed for shorter breaks).
    if (warnMs > 0 && warnMs < durationMs - 30_000) {
      void scheduleBackgroundNotification(
        "Scroll Detect — almost up",
        `${warnMin} min left on your break. Wrap up so it doesn't get cut off.`,
        "timer-headsup",
        target - warnMs,
      ).then((ok) => {
        bgWarnScheduledRef.current = ok;
      });
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
    finishedRef.current = false;
    warnedRef.current = false;
    setWarned(false);
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

  return {
    phase,
    remaining,
    durationMs,
    endAt,
    sound,
    notifState,
    customDays,
    customHours,
    customMinutes,
    finishTime,
    warnMin,
    warned,
    setCustomDays,
    setCustomHours,
    setCustomMinutes,
    setFinishTime,
    setWarnMin,
    toggleSound,
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
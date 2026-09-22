"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  Pause,
  Play,
  RotateCcw,
  Timer as TimerIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORE_KEY = "scrolldictive.timer.v1";
const DURATION_PREF_KEY = "scrolldictive.timer.pref.v1";
const SOUND_KEY = "scrolldictive.timer.sound.v1";
const WARN_KEY = "scrolldictive.timer.warn.v1";

interface PersistedTimer {
  running: boolean;
  endAt: number;
  durationMs: number;
  warned: boolean;
}

const PRESETS_MIN = [5, 10, 15, 25, 45];
const WARN_OPTIONS_MIN = [0, 1, 2, 5, 10, 15] as const;

function loadTick(): number {
  if (typeof localStorage === "undefined") return 250;
  return 250;
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

function savePersisted(timer: Omit<PersistedTimer, "durationMs"> & { durationMs: number } | null) {
  if (typeof localStorage === "undefined") return;
  if (timer) localStorage.setItem(STORE_KEY, JSON.stringify(timer));
  else localStorage.removeItem(STORE_KEY);
}

function mmss(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playChime() {
  try {
    const ctx = new AudioContext();
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
    // Audio unavailable — notification still covers it.
  }
}

async function sendNotification(title: string, body: string, tag: string) {
  try {
    const reg =
      "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
    const opts: NotificationOptions = {
      body,
      tag,
      icon: "/apple-touch-icon-180.png",
    };
    if (reg) await reg.showNotification(title, opts);
    else if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, opts);
    }
  } catch {
    // Notification failed — in-app alarm still fires.
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

function alarmComplete({ sound }: { sound: boolean }) {
  if (sound) playChime();
  void sendNotification(
    "Scroll Detect — break's over",
    "Your timer just finished. Stretch, drink water, and only then decide what's next.",
    "timer-break",
  );
}

type Phase = "idle" | "running" | "done";

export function TimerTab() {
  const [durationMs, setDurationMs] = useState(loadDurationPref());
  const [remaining, setRemaining] = useState(durationMs);
  const [phase, setPhase] = useState<Phase>("idle");
  const [endAt, setEndAt] = useState(0);
  const [sound, setSound] = useState(loadSound);
  const [notifState, setNotifState] = useState<NotificationPermission>("default");
  const [custom, setCustom] = useState("");
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

  const fireHeadsUp = useCallback(() => {
    warnedRef.current = true;
    setWarned(true);
    savePersisted({ running: true, endAt, durationMs, warned: true });
    if (!bgWarnScheduledRef.current) {
      void sendNotification(
        "Scroll Detect — almost up",
        `${warnMin} min left on your break. Wrap up so it doesn't get cut off.`,
        "timer-headsup",
      );
    }
  }, [endAt, durationMs, warnMin]);

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
          alarmComplete({ sound });
        }
      }
    }, loadTick());
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
          alarmComplete({ sound });
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
    setCustom("");
    setFinishTime("");
    saveDurationPref(ms);
  };

  const applyCustom = () => {
    const min = Number(custom);
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
    setCustom("");
    saveDurationPref(ms);
  };

  const requestNotifs = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifState(perm);
  };

  const endLabel = new Date(endAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col items-center rounded-2xl border border-border/80 bg-card/70 p-8 shadow-card md:p-12">
        {phase === "done" ? (
          <>
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-coral/15 text-coral animate-breathe">
              <BellRing className="h-10 w-10" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-center font-heading text-3xl font-semibold text-foreground">
              Break&apos;s over.
            </h3>
            <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
              You made it through {mmss(durationMs)}. Stretch, sip some water,
              and decide what&apos;s next instead of opening a feed.
            </p>
            <button
              type="button"
              onClick={() => {
                finishedRef.current = false;
                setPhase("idle");
              }}
              className="mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Set another timer
            </button>
          </>
        ) : (
          <>
            <p
              className={cn(
                "font-heading text-7xl font-semibold tabular-nums tracking-tight text-foreground md:text-8xl",
                phase === "running" && remaining < 60_000 && "text-coral",
              )}
              aria-live="polite"
            >
              {mmss(remaining)}
            </p>

            {phase === "running" ? (
              warned ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Heads-up — under {warnMin} min left. Wrap up your break so it
                  ends on your terms.
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Alarm set for{" "}
                  <span className="font-semibold text-foreground">{endLabel}</span>.{" "}
                  {warnMs > 0
                    ? `It'll warn you ${warnMin} min before it rings.`
                    : "Head away from the screen — it will ring."}
                </p>
              )
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Set a focused break. When it rings, you&apos;ll know the scrolling
                didn&apos;t win.
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {PRESETS_MIN.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => applyPreset(min)}
                  className={cn(
                    "inline-flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors",
                    durationMs === min * 60_000 && phase === "idle"
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {min}m
                </button>
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="number"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onBlur={applyCustom}
                  placeholder="Custom"
                  inputMode="numeric"
                  min={1}
                  className="h-10 w-24 rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
                <span className="text-sm text-muted-foreground">m</span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">or finish by</span>
              <input
                type="time"
                value={finishTime}
                onChange={(e) => applyFinishTime(e.target.value)}
                aria-label="Finish the break at a chosen clock time"
                className="h-10 cursor-pointer rounded-full border border-border bg-background px-4 text-sm tabular-nums text-foreground outline-none transition-colors focus:border-primary/60"
              />
              <span className="text-sm text-muted-foreground">
                → {mmss(durationMs)}
              </span>
            </div>

            {phase === "running" ? (
              <div className="mt-8 flex items-center gap-2">
                <button
                  type="button"
                  onClick={pause}
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  Pause
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-coral/50 hover:text-coral"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={durationMs <= 0}
                className="mt-8 inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Start {mmss(durationMs)}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-5 shadow-card">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Alarm settings
          </h3>

          <button
            type="button"
            onClick={() => {
              const next = !sound;
              setSound(next);
              saveSound(next);
            }}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              {sound ? (
                <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
              Sound chime
            </span>
            <span className={cn("relative h-6 w-11 rounded-full transition-colors", sound ? "bg-primary" : "bg-muted/40")}>
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                  sound ? "left-[22px]" : "left-0.5",
                )}
              />
            </span>
          </button>

          <div className="rounded-xl border border-border/70 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                Notification alert
              </span>
              {notifState === "granted" ? (
                <span className="text-xs font-semibold text-teal">On</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void requestNotifs()}
                  className="cursor-pointer rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  {notifState === "denied" ? "Blocked in browser" : "Enable"}
                </button>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The alarm rings through the installed app even if the tab isn&apos;t
              focused.
            </p>
          </div>

          <label className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
              Heads-up before end
            </span>
            <select
              value={warnMin}
              onChange={(e) => {
                const min = Number(e.target.value);
                setWarnMin(min);
                saveWarnMin(min);
              }}
              className="h-9 cursor-pointer rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
            >
              {WARN_OPTIONS_MIN.map((min) => (
                <option key={min} value={min}>
                  {min === 0 ? "None" : `${min} min`}
                </option>
              ))}
            </select>
          </label>
          <p className="-mt-1 px-1 text-xs leading-relaxed text-muted-foreground">
            Short breaks auto-trim this so it never overlaps the alarm.
          </p>
        </div>

        <div className="rounded-2xl border border-lavender/25 bg-lavender/5 p-5">
          <div className="flex items-center gap-2">
            <TimerIcon className="h-4 w-4 text-lavender" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide text-lavender">
              Why it&apos;s timed
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            The timer is hardware real-time, so it stays accurate even if the
            browser throttles the tab in the background. When it rings, the
            service worker shows the alert.
          </p>
        </div>
      </div>
    </div>
  );
}
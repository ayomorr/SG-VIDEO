"use client";

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
import {
  type BreakTimer,
  mmss,
  PRESETS_MIN,
  WARN_OPTIONS_MIN,
} from "@/lib/hooks/use-break-timer";

export function TimerTab({ timer }: { timer: BreakTimer }) {
  const {
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
    changeWarnMin,
    toggleSound,
    requestNotifs,
    start,
    pause,
    cancel,
    applyPreset,
    applyCustom,
    applyFinishTime,
  } = timer;

  const warnMs = warnMin > 0 ? warnMin * 60_000 : 0;

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
              onClick={cancel}
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
                Set a break first, then go scroll. When the alarm rings, it&apos;s
                proof you chose to stop — the feed didn&apos;t win.
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
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(0, Number(e.target.value)))}
                  onBlur={applyCustom}
                  placeholder="0"
                  inputMode="numeric"
                  min={0}
                  className="h-10 w-16 rounded-full border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
                <span className="text-sm text-muted-foreground">d</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="number"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(0, Number(e.target.value)))}
                  onBlur={applyCustom}
                  placeholder="0"
                  inputMode="numeric"
                  min={0}
                  className="h-10 w-16 rounded-full border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
                <span className="text-sm text-muted-foreground">h</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, Number(e.target.value)))}
                  onBlur={applyCustom}
                  placeholder="0"
                  inputMode="numeric"
                  min={0}
                  className="h-10 w-16 rounded-full border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
                <span className="text-sm text-muted-foreground">m</span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                or ring at a clock time
              </span>
              <input
                type="time"
                value={finishTime}
                onChange={(e) => applyFinishTime(e.target.value)}
                aria-label="Ring the alarm at a chosen clock time"
                className="h-10 cursor-pointer rounded-full border border-border bg-background px-4 text-sm tabular-nums text-foreground outline-none transition-colors focus:border-primary/60"
              />
              <span className="text-sm text-muted-foreground">
                → rings in {mmss(durationMs)}
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
            onClick={() => toggleSound(!sound)}
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
              focused. On iPhone, keep the app open on screen (or come back when
              the break ends) — iOS won&apos;t let any website ring in the background.
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
                changeWarnMin(min);
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
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
  ALARM_SOUND_OPTIONS,
  alarmSoundLabel,
  type AlarmSoundChoice,
} from "@/lib/hooks/use-break-timer";

export function TimerTab({ timer }: { timer: BreakTimer }) {
  const {
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
    alarmRinging,
    alarmMuted,
    alarmSound,
    setCustomDays,
    setCustomHours,
    setCustomMinutes,
    changeWarnMin,
    testSound,
    testAlarm,
    changeAlarmSound,
    toggleAlarmMute,
    requestNotifs,
    start,
    pause,
    cancel,
    applyPreset,
    applyCustom,
    applyFinishTime,
  } = timer;

  const warnMs = warnEffectiveMin * 60_000;

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
                  disabled={phase === "running"}
                  onClick={() => applyPreset(min)}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                    phase === "running"
                      ? "cursor-not-allowed border-border/40 text-muted-foreground/40"
                      : "cursor-pointer",
                    durationMs === min * 60_000 && phase === "idle"
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {min}m
                </button>
              ))}
              {(
                [
                  ["Days", customDays, setCustomDays],
                  ["Hours", customHours, setCustomHours],
                  ["Minutes", customMinutes, setCustomMinutes],
                ] as const
              ).map(([label, value, onChange]) => (
                <label key={label} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={value}
                    disabled={phase === "running"}
                    onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
                    onBlur={applyCustom}
                    placeholder="0"
                    inputMode="numeric"
                    min={0}
                    aria-label={`Custom break length in ${label.toLowerCase()}`}
                    className="h-10 w-16 rounded-full border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <span className="text-sm text-muted-foreground">
                    {label.charAt(0).toLowerCase()}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                or ring at a clock time
              </span>
              <input
                type="time"
                value={finishTime}
                disabled={phase === "running"}
                onChange={(e) => applyFinishTime(e.target.value)}
                aria-label="Ring the alarm at a chosen clock time"
                className="h-10 cursor-pointer rounded-full border border-border bg-background px-4 text-sm tabular-nums text-foreground outline-none transition-colors focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
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

          <div className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2">
            <BellRing className="h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium text-foreground">
              {alarmSoundLabel(alarmSound)}
            </span>
            <button
              type="button"
              onClick={toggleAlarmMute}
              aria-pressed={alarmMuted}
              aria-label={alarmMuted ? "Unmute the alarm" : "Mute the alarm"}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {alarmMuted ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                  Muted
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  On
                </>
              )}
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
            <span className="text-sm font-medium text-foreground">Sound</span>
            <select
              value={alarmSound}
              onChange={(e) => changeAlarmSound(e.target.value as AlarmSoundChoice)}
              aria-label="Alarm sound"
              className="flex-1 cursor-pointer rounded-lg border border-border/70 bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50"
            >
              {ALARM_SOUND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-muted-foreground">
            The {alarmSoundLabel(alarmSound).toLowerCase()} recording starts the
            instant your break ends and keeps looping until you answer — it is
            designed to be impossible to miss, so it stays on unless you mute it
            here. Pick a new sound and it plays straight away.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={testSound}
              title="A short 5-second jingle — not the alarm"
              className="shrink-0 cursor-pointer rounded-xl border border-border/70 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Preview chime
            </button>
            <button
              type="button"
              onClick={testAlarm}
              aria-pressed={alarmRinging}
              title={`Plays the exact ${alarmSoundLabel(alarmSound).toLowerCase()} that ends a real break`}
              className={cn(
                "shrink-0 cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                alarmRinging
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-coral/40 text-coral hover:bg-coral/10",
              )}
            >
              {alarmRinging
                ? `Stop ${alarmSoundLabel(alarmSound).toLowerCase()}`
                : `Preview ${alarmSoundLabel(alarmSound).toLowerCase()}`}
            </button>
          </div>
          {alarmRinging && (
            <p className="text-xs font-medium text-coral">
              {alarmSoundLabel(alarmSound)} is ringing — tap Stop{" "}
              {alarmSoundLabel(alarmSound).toLowerCase()}, or wait 10 seconds.
            </p>
          )}

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
              Turn on notifications so the break still reaches you if you
              switch away. On iPhone, keep the app open on screen — iOS
              won&apos;t let any website ring in the background, and the app
              asks to keep your screen awake while a break is running.
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
            {warnEffectiveMin > 0 && warnEffectiveMin !== warnMin
              ? `Trimmed to ${warnEffectiveMin} min so it never overlaps the alarm.`
              : "Short breaks auto-trim this so it never overlaps the alarm."}
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
            The timer runs on the clock, not on counted ticks, so it stays
            accurate even if the browser throttles the tab. The alarm holds
            The alarm holds
            three layers — the {alarmSoundLabel(alarmSound).toLowerCase()}{" "}
            recording, a synthesised backup, and your notifications — so one
            being blocked never means silence.
          </p>
        </div>
      </div>
    </div>
  );
}
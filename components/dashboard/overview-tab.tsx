"use client";

import { useMemo } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Coffee,
  Pencil,
  ShieldAlert,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/engine/types";
import type { AwayTrackerState } from "@/lib/hooks/use-away-tracker";
import { useGoalProfile } from "@/lib/hooks/use-goal-profile";
import { requestGoalEdit } from "@/lib/data/goals";
import { buildRuns, interventionForRun } from "@/lib/engine/detection";
import { daySummary } from "@/lib/engine/insights";
import { predictRisk } from "@/lib/engine/predict";
import { formatDuration, formatHour } from "@/lib/engine/format";
import {
  Card,
  ConfidenceBar,
  Pill,
  SeverityBadge,
  ZapStatus,
} from "@/components/dashboard/primitives";

export function OverviewTab({
  sessions,
  tracker,
}: {
  sessions: Session[];
  tracker: AwayTrackerState;
}) {
  const runs = useMemo(() => buildRuns(sessions), [sessions]);
  const today = useMemo(() => daySummary(sessions), [sessions]);
  const predictions = useMemo(() => predictRisk(sessions), [sessions]);
  const next = predictions[0] ?? null;

  const lastRun = runs[runs.length - 1] ?? null;
  const intervention = lastRun
    ? interventionForRun(lastRun, runs.slice(0, -1))
    : null;

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayList = useMemo(
    () => sessions.filter((s) => s.startAt >= todayStart),
    [sessions, todayStart],
  );

const todayActivity = useMemo(() => {
    const durs = todayList.map((s) => Math.max(0, s.endAt - s.startAt));
    const total = durs.reduce((a, b) => a + b, 0);
    const longest = durs.length ? Math.max(...durs) : 0;
    const average = durs.length ? total / durs.length : 0;
    const breaks = todayList.reduce((s, d) => s + (d.breaks ?? 0), 0);
    return { total, longest, average, breaks };
  }, [todayList]);

  const profile = useGoalProfile();

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {profile.monthName} goals
              </h3>
              <Pill className="bg-primary/10 text-primary">
                {profile.name ? `Hi ${profile.name}` : "Not set"}
              </Pill>
            </div>
            {profile.goals.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-1.5">
                {profile.goals.map((goal, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Target
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No goals saved for this month yet — without them the AI can only
                guess what you&apos;re aiming at.
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              These reset at the start of each month. The break questions mix
              these with the general ones.
            </p>
          </div>
          <button
            type="button"
            onClick={requestGoalEdit}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                tracker.awayNow
                  ? "bg-coral/15 text-coral"
                  : tracker.tracking
                    ? "bg-teal/15 text-teal"
                    : "bg-muted/20 text-muted-foreground",
              )}
            >
              {tracker.awayNow ? (
                <Activity className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ZapStatus tracking={tracker.tracking} />
              )}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Loop watch
                </h3>
                <Pill
                  className={
                    tracker.awayNow
                      ? "bg-coral/15 text-coral"
                      : tracker.tracking
                        ? "bg-teal/15 text-teal"
                        : "bg-muted/20 text-muted-foreground"
                  }
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      tracker.awayNow
                        ? "bg-coral animate-ping"
                        : tracker.tracking
                          ? "bg-teal animate-pulse-soft"
                          : "bg-muted-foreground",
                    )}
                  />
                  {tracker.awayNow
                    ? `Away right now · ${formatDuration(tracker.awayMs)}`
                    : tracker.tracking
                      ? "Watching"
                      : "Paused"}
                </Pill>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {tracker.tracking
                  ? "The away watch is on: it shows how long you were off the app. Away time is never guessed as scrolling — the web can't see other apps, so scrolls are only logged when you record them."
                  : "The away watch is off. Either way, being away from the app is never counted as scrolling on its own."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={tracker.toggle}
            className={cn(
              "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium transition-all",
              tracker.tracking
                ? "border border-border text-muted-foreground hover:border-coral/50 hover:text-coral"
                : "bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)]",
            )}
          >
            {tracker.tracking ? (
              <>
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Pause watch
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" aria-hidden="true" />
                Start watching
              </>
            )}
          </button>
        </div>
      </Card>
      {next ? (
        <Card className="relative overflow-hidden">
          <div
            className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-lavender/20 blur-[80px]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-lavender">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Prediction
              </div>
              <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">
                High-risk window starting around {formatHour(next.windowStartHour, 0)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {next.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill className="bg-primary/10 text-primary">
                  ~{Math.round(next.averageSessionMs / 60_000)} min runs
                </Pill>
                <Pill className="bg-lavender/10 text-lavender">
                  {next.observedCount} starts in the last 2 weeks
                </Pill>
                <Pill className="bg-card">
                  Usually in {next.primaryApp}
                </Pill>
              </div>
            </div>
            <div className="w-full max-w-[220px]">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Confidence</span>
                <span className="text-foreground">{next.confidence}%</span>
              </div>
              <ConfidenceBar value={next.confidence} />
              <p className="mt-3 text-xs text-muted-foreground">
                Reminder suggestion:{" "}
                <span className="text-foreground">
                  {formatHour(next.reminderHour, next.reminderMin)}
                </span>
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Scroll time today</p>
              <p className="mt-1 font-heading text-3xl font-semibold text-foreground">
                {formatDuration(today.totalMs)}
              </p>
            </div>
            <SeverityBadge severity={today.severity} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {today.date} · {today.runs} continuous scrolling run{today.runs === 1 ? "" : "s"}
          </p>
        </Card>
      </div>

      <Card className="border-coral/25">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-coral">
              {intervention ? (
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden="true" />
              )}
            </span>
            <div>
              {intervention ? (
                <>
                  <h4 className="font-heading text-base font-semibold text-foreground">
                    {intervention.title}
                  </h4>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {intervention.body}
                  </p>
                </>
              ) : (
                <h4 className="font-heading text-base font-semibold text-foreground">
                  From what we have, you look steady.
                </h4>
              )}
              {!intervention && lastRun ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Your latest detected run was{" "}
                  {formatDuration(lastRun.totalMs)} across {lastRun.apps.length}{" "}
                  app{lastRun.apps.length === 1 ? "" : "s"} — below the
                  intervention threshold.
                </p>
              ) : null}
            </div>
          </div>
          {intervention ? (
            <div className="shrink-0">
              <ul className="flex flex-col gap-1.5">
                {intervention.suggestions.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coffee className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-muted-foreground">
          Today&apos;s activity
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: "Total sessions", value: String(todayList.length) },
            { label: "Total time", value: formatDuration(todayActivity.total) },
            { label: "Longest session", value: formatDuration(todayActivity.longest) },
            { label: "Average session", value: formatDuration(todayActivity.average) },
            { label: "Breaks taken", value: String(todayActivity.breaks) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-muted/70 px-4 py-3"
            >
              <p className="text-[11px] font-semibold text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 font-heading text-lg font-semibold tabular-nums text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

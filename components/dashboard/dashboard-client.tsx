"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coffee,
  Info,
  Lightbulb,
  MessageCircle,
  Moon,
  Plus,
  Radar,
  RefreshCw,
  Rss,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addSession,
  clearAllData,
  deleteSession,
  loadSessions,
  onSessionsChange,
  resetToDemo,
} from "@/lib/store";
import type {
  CoachMessage,
  Insight,
  Mood,
  Severity,
  Session,
} from "@/lib/engine/types";
import {
  APP_CATALOG,
  CATEGORY_LABELS,
  MOOD_LABELS,
  MOODS,
} from "@/lib/engine/catalog";
import { analyzeInsights, daySummary } from "@/lib/engine/insights";
import { predictRisk } from "@/lib/engine/predict";
import {
  detectTriggers,
  journalFromSessions,
  topMoodCost,
} from "@/lib/engine/triggers";
import { buildRuns, interventionForRun } from "@/lib/engine/detection";
import { buildContextSummary } from "@/lib/engine/coach";
import { formatDuration, formatHour, percent } from "@/lib/engine/format";
import { useAwayTracker } from "@/lib/hooks/use-away-tracker";
import type { AwayTrackerState } from "@/lib/hooks/use-away-tracker";
import { useBreakTimer } from "@/lib/hooks/use-break-timer";
import { importSessionsFromQuery } from "@/lib/import-sessions";
import { TimerTab } from "@/components/dashboard/timer-tab";
import { LiveScrollTab } from "@/components/dashboard/live-scroll-tab";
import { DoomPhoneMark } from "@/components/logo";

type TabId =
  | "overview"
  | "insights"
  | "predict"
  | "triggers"
  | "coach"
  | "timer"
  | "live";

const TABS: {
  id: TabId;
  label: string;
  icon: typeof Activity;
  blurb: string;
  featured?: boolean;
}[] = [
  {
    id: "timer",
    label: "Break timer",
    icon: Timer,
    featured: true,
    blurb: "Set a break first, then go scroll. This is the main tool: start it before any scroll — the alarm rings to pull you back.",
  },
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    blurb: "Your day at a glance: total sessions, time logged, per-app breakdown and the loop watch.",
  },
  {
    id: "insights",
    label: "Insights",
    icon: Lightbulb,
    blurb: "Patterns found in your own data: peak hours, longest stretches and high-pull apps.",
  },
  {
    id: "predict",
    label: "Predict",
    icon: CalendarClock,
    blurb: "Foresees your riskiest hours for a long run, so you can set a break before they hit.",
  },
  {
    id: "triggers",
    label: "Triggers",
    icon: Brain,
    blurb: "Connects the mood before a session with how it ends, and suggests what to do instead.",
  },
  {
    id: "coach",
    label: "Coach",
    icon: MessageCircle,
    blurb: "An honest companion that answers questions using your own history.",
  },
  {
    id: "live",
    label: "Live scroll",
    icon: Rss,
    blurb: "Real-time detection while you scroll in-app: catch drifting before it becomes a spiral.",
  },
];

const CAPABILITIES: {
  icon: typeof Activity;
  title: string;
  description: string;
  tab: TabId | null;
}[] = [
  {
    icon: ClipboardList,
    title: "Self-tracked scrolls",
    description:
      "No background scanner. Log a session in two taps — the app, the minutes, how it left you — and everything runs on that honest data.",
    tab: "triggers",
  },
  {
    icon: Radar,
    title: "Doom-scroll detection",
    description:
      "Every logged run is scored from Calm to Spiral, with a single line on what's happening and one thing to try next.",
    tab: "overview",
  },
  {
    icon: CalendarClock,
    title: "Risk predictions",
    description:
      "From your own history, Scroll Detect predicts your riskiest hours for a long run — so you can spot them coming.",
    tab: "predict",
  },
  {
    icon: Brain,
    title: "Trigger insight",
    description:
      "It finds what links your spirals — late nights, certain apps, a mood — and surfaces the journal of your habits.",
    tab: "insights",
  },
  {
    icon: Timer,
    title: "Break timer with alarm",
    description:
      "Set a focused break for any length. It heads-up you before the end, then rings — your alarm for stepping away.",
    tab: "timer",
  },
  {
    icon: ShieldCheck,
    title: "On-device privacy",
    description:
      "Everything lives in your browser's storage on your device. No account, no tracking, no data sent anywhere.",
    tab: null,
  },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  calm: "bg-teal/10 text-teal-400",
  mindful: "bg-focus/10 text-focus-400",
  drifting: "bg-lavender/10 text-lavender",
  deep: "bg-coral/10 text-coral",
  spiral: "bg-coral/20 text-coral animate-pulse-soft",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  calm: "Calm",
  mindful: "Mostly mindful",
  drifting: "Drifting",
  deep: "Deep scroll",
  spiral: "Scroll spiral",
};

const TONE_STYLES: Record<Insight["tone"], string> = {
  info: "border-focus/30 bg-focus/10 text-focus-400",
  good: "border-teal/30 bg-teal/10 text-teal-400",
  warn: "border-coral/30 bg-coral/10 text-coral",
};

const TONE_ICONS: Record<Insight["tone"], typeof Info> = {
  info: Info,
  good: CheckCircle2,
  warn: AlertTriangle,
};

function ZapStatus({ tracking }: { tracking: boolean }) {
  if (!tracking) return <ShieldAlert className="h-5 w-5" aria-hidden="true" />;
  return <Zap className="h-5 w-5" aria-hidden="true" />;
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/70 p-6 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal to-focus transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Pill className={SEVERITY_STYLES[severity]}>{SEVERITY_LABELS[severity]}</Pill>
  );
}

function LogSessionForm({ onLogged }: { onLogged: () => void }) {
  const [app, setApp] = useState(APP_CATALOG[0].name);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(20);
  const [moodBefore, setMoodBefore] = useState<Mood | "">("");
  const [moodAfter, setMoodAfter] = useState<Mood | "">("");
  const [note, setNote] = useState("");

  const totalMinutes = Math.max(1, days * 1440 + hours * 60 + minutes);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const def = APP_CATALOG.find((a) => a.name === app) ?? APP_CATALOG[0];
    const now = Date.now();
    const startAt = now - totalMinutes * 60_000;
    addSession({
      id: `m-${now}-${Math.random().toString(36).slice(2, 8)}`,
      app: def.name,
      category: def.category,
      startAt,
      endAt: now,
      moodBefore: moodBefore || null,
      moodAfter: moodAfter || null,
      note: note.trim() || undefined,
      source: "manual",
    });
    setDays(0);
    setHours(0);
    setMinutes(20);
    setMoodBefore("");
    setMoodAfter("");
    setNote("");
    onLogged();
  };

  const selectClass =
    "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60";
  const inputClass =
    "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60";

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            App
          </span>
          <select value={app} onChange={(e) => setApp(e.target.value)} className={selectClass}>
            {APP_CATALOG.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name} · {CATEGORY_LABELS[a.category]}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Duration
          </span>
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <input
                type="number"
                min={0}
                value={days}
                onChange={(e) => setDays(Math.max(0, Number(e.target.value)))}
                className={cn(inputClass, "rounded-r-none border-r-0")}
              />
            </label>
            <label className="block">
              <input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                className={cn(inputClass, "rounded-none border-r-0")}
              />
            </label>
            <label className="block">
              <input
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))}
                className={cn(inputClass, "rounded-l-none")}
              />
            </label>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-2 text-[11px] font-medium text-muted-foreground">
            <span className="text-left">days</span>
            <span className="text-center">h</span>
            <span className="text-right">min</span>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Feeling before
          </span>
          <select
            value={moodBefore}
            onChange={(e) => setMoodBefore(e.target.value as Mood | "")}
            className={selectClass}
          >
            <option value="">Skip</option>
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {MOOD_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Feeling after (optional)
          </span>
          <select
            value={moodAfter}
            onChange={(e) => setMoodAfter(e.target.value as Mood | "")}
            className={selectClass}
          >
            <option value="">Skip</option>
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {MOOD_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Note (what happened?)
        </span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. picked it up during a work break"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Log scroll session
      </button>
    </form>
  );
}

function OverviewTab({
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
  const insights = useMemo(() => analyzeInsights(sessions), [sessions]);

  const lastRun = runs[runs.length - 1] ?? null;
  const intervention = lastRun
    ? interventionForRun(lastRun, runs.slice(0, -1))
    : null;

  const topInsight = insights[0] ?? null;

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
    const breaks = todayList.reduce((a, s) => a + (s.breaks ?? 0), 0);
    return { total, longest, average, breaks };
  }, [todayList]);

  const todayBreakdown = useMemo(() => {
    const map = new Map<string, { totalMs: number; count: number }>();
    for (const s of todayList) {
      const d = Math.max(0, s.endAt - s.startAt);
      const cur = map.get(s.app) ?? { totalMs: 0, count: 0 };
      cur.totalMs += d;
      cur.count += 1;
      map.set(s.app, cur);
    }
    return [...map.entries()]
      .map(([app, v]) => ({ app, ...v }))
      .sort((a, b) => b.totalMs - a.totalMs);
  }, [todayList]);

  return (
    <div className="grid gap-5">
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

        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            This week&apos;s standout insight
          </div>
          {topInsight ? (
            <>
              <h4 className="mt-2 font-heading text-lg font-semibold text-foreground">
                {topInsight.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {topInsight.body}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Log a few sessions and the insight engine will start finding patterns.
            </p>
          )}
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

      <div className="grid gap-5 md:grid-cols-2">
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

        <Card>
          <p className="text-sm font-semibold text-muted-foreground">
            Today&apos;s scrolling
          </p>
          {todayBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nothing logged yet today. Log a session, run a live scroll, or
              switch on the loop watch.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {todayBreakdown.map((row) => (
                <li
                  key={row.app}
                  className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal" />
                    {row.app}
                    {row.count > 1 ? (
                      <span className="text-xs text-muted-foreground">
                        ×{row.count}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                    {formatDuration(row.totalMs)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5">
                <span className="text-sm font-semibold text-foreground">
                  Total
                </span>
                <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                  {formatDuration(todayActivity.total)}
                </span>
              </li>
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function InsightsTab({ sessions }: { sessions: Session[] }) {
  const insights = useMemo(() => analyzeInsights(sessions), [sessions]);

  if (insights.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Lightbulb className="h-10 w-10 text-primary/60" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-foreground">
          Not enough data yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Log a handful of scroll sessions and the insight engine will surface
          peaks, trends, and high-pull apps.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {insights.map((insight) => {
        const Icon = TONE_ICONS[insight.tone];
        return (
          <Card key={insight.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                    TONE_STYLES[insight.tone],
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h4 className="font-heading text-base font-semibold text-foreground">
                    {insight.title}
                  </h4>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {insight.body}
                  </p>
                </div>
              </div>
              {insight.metric ? (
                <div className="shrink-0 text-right">
                  <p className="font-heading text-2xl font-semibold text-foreground">
                    {insight.metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{insight.metric.label}</p>
                </div>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PredictTab({ sessions }: { sessions: Session[] }) {
  const predictions = useMemo(() => predictRisk(sessions), [sessions]);

  if (predictions.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <CalendarClock className="h-10 w-10 text-primary/60" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-foreground">
          No patterns to predict yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Once you have a couple of weeks of scroll data, the predictor will
          learn exactly when the risky windows tend to start.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {predictions.map((prediction, i) => (
        <Card key={prediction.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lavender/15 text-lavender">
                <Target className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {i === 0 ? "Most likely window" : "Secondary pattern"}
                </p>
                <h4 className="mt-1 font-heading text-lg font-semibold text-foreground">
                  {formatHour(prediction.windowStartHour, 0)} –{" "}
                  {formatHour(prediction.windowEndHour, 0)}
                </h4>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {prediction.message}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill className="bg-primary/10 text-primary">
                    ~{Math.round(prediction.averageSessionMs / 60_000)} min per run
                  </Pill>
                  <Pill className="bg-lavender/10 text-lavender">
                    Usually in {prediction.primaryApp}
                  </Pill>
                  <Pill className="bg-card">
                    Suggest reminder at {formatHour(prediction.reminderHour, prediction.reminderMin)}
                  </Pill>
                </div>
              </div>
            </div>
            <div className="w-full max-w-[200px] shrink-0">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Confidence</span>
                <span className="text-foreground">{prediction.confidence}%</span>
              </div>
              <ConfidenceBar value={prediction.confidence} />
            </div>
          </div>
        </Card>
      ))}
      <Card className="border-border/60">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5 text-lavender" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Predictions live entirely on your device. We never store your usage
            patterns anywhere else — the model is just your own history.
          </p>
        </div>
      </Card>
    </div>
  );
}

function TriggersTab({ sessions }: { sessions: Session[] }) {
  const triggers = useMemo(() => detectTriggers(sessions), [sessions]);
  const journal = useMemo(() => journalFromSessions(sessions), [sessions]);
  const moodCost = useMemo(() => topMoodCost(sessions), [sessions]);
  const [refresh, setRefresh] = useState(0);

  const maxCost = moodCost[0]?.totalMs ?? 1;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="font-heading text-base font-semibold text-foreground">
              Log a session
            </h3>
          </div>
          <LogSessionForm onLogged={() => setRefresh((v) => v + 1)} />
        </Card>

        {journal.length > 0 ? (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Journal
            </h3>
            <ul className="mt-4 grid gap-2 md:grid-cols-1">
              {journal.slice(0, 12).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/50 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {MOOD_LABELS[entry.moodBefore]} → {entry.app} →{" "}
                      {formatDuration(entry.durationMs)}
                      {entry.moodAfter ? ` → ${MOOD_LABELS[entry.moodAfter]}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteSession(entry.id);
                      setRefresh((v) => v + 1);
                    }}
                    aria-label="Delete entry"
                    className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        {triggers.length > 0 ? (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Your loops
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {triggers.map((trigger) => (
                <li key={trigger.id} className="rounded-xl border border-border/70 bg-background/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Brain className="h-4 w-4 text-lavender" aria-hidden="true" />
                    {trigger.chain}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Instead: {trigger.suggestion}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Feeling → feed → outcome
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Start logging a mood before each session. After a few entries, the
              engine will connect the dots — like &quot;bored → YouTube → 45
              min → tired&quot; — and suggest a healthier alternative for the
              feeling at the start.
            </p>
          </Card>
        )}

        {moodCost.length > 0 ? (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Which feelings cost the most screen time
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {moodCost.map((item) => (
                <div key={item.mood}>
                  <div className="mb-1 flex items-center justify-between text-xs font-medium">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.sessions} session{item.sessions === 1 ? "" : "s"} ·{" "}
                      {formatDuration(item.totalMs)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-lavender to-focus transition-all duration-500"
                      style={{ width: `${percent(item.totalMs, maxCost)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      <span className="hidden">{refresh}</span>
    </div>
  );
}

const QUICK_PROMPTS = [
  "I'm bored",
  "I keep reopening the same app",
  "Why do I doomscroll?",
  "Help me sleep instead of scrolling",
  "I can't stop tonight",
];

function CoachTab({ sessions, initialMessage }: { sessions: Session[]; initialMessage?: string }) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState(initialMessage ?? "");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const context = useMemo(() => buildContextSummary(sessions), [sessions]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setInput("");
    const history: CoachMessage[] = [
      ...messages,
      { id: `u-${Date.now()}`, role: "user", content, at: Date.now() },
    ];
    setMessages(history);
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        via?: "llm" | "rules";
        error?: string;
      };
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            data.reply ??
            data.error ??
            "Give me one more try — I'll think it through.",
          at: Date.now(),
          via: data.via,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "I hit a hiccup. Try again in a moment.",
          at: Date.now(),
          via: "rules",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-card">
        <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              Accountability companion
            </p>
            <p className="text-xs text-muted-foreground">
              Here to be honest with you, not bossy with you.
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Hey — I can see your recent habits, so I&apos;ll reference what's
              actually true for you. {context}{" "}
              {sessions.length === 0
                ? "Log a few sessions first so I have something real to work with."
                : ""}
            </p>
          ) : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border/70 bg-background/60 text-foreground",
                )}
              >
                {m.content}
                {m.role === "assistant" ? (
                  <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {m.via === "llm" ? "AI-powered" : "rules engine"}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/70 bg-background/60 px-4 py-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/70 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell them how you feel right now…"
              className="h-12 w-full rounded-full border border-border bg-background px-5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-all hover:bg-teal-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Quick prompts
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() => void send(prompt)}
                  className="w-full cursor-pointer rounded-xl border border-border/70 px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              You&apos;re only sending a short summary of your habits and the
              last 12 messages. Add <code className="text-foreground">AI_API_KEY</code>{" "}
              to enable the full model instead of the built-in rules engine.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function DashboardClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<TabId | null>("timer");
  const [hydrated, setHydrated] = useState(false);
  const timer = useBreakTimer();
  const [importNotice, setImportNotice] = useState<{ imported: number } | null>(
    null,
  );
  const tracker = useAwayTracker();

  useEffect(() => {
    const result = importSessionsFromQuery();
    if (result.imported > 0) setImportNotice(result);
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    setSessions(loadSessions());
    setHydrated(true);
    return onSessionsChange(() => setSessions(loadSessions()));
  }, []);

  const totalMs = useMemo(
    () => sessions.reduce((sum, s) => sum + Math.max(0, s.endAt - s.startAt), 0),
    [sessions],
  );

  const lastRunScore = useMemo(() => buildRuns(sessions).at(-1)?.score ?? 0, [sessions]);
  const lastSeverity: Severity =
    lastRunScore === 0
      ? "calm"
      : lastRunScore >= 75
        ? "spiral"
        : lastRunScore >= 55
          ? "deep"
          : lastRunScore >= 35
            ? "drifting"
            : lastRunScore >= 15
              ? "mindful"
              : "calm";

  return (
    <div className="relative min-h-screen overflow-hidden pb-40 pt-24 md:pt-32">
      <div
        className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-teal/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -left-40 bottom-20 h-96 w-96 rounded-full bg-lavender/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        {importNotice ? (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-teal/30 bg-teal/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden="true" />
              <p className="text-sm text-foreground">
                Imported {importNotice.imported} scroll session
                {importNotice.imported === 1 ? "" : "s"} from your browser
                extension. They&apos;re feeding your predictions and insights now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImportNotice(null)}
              aria-label="Dismiss"
              className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <DoomPhoneMark className="hidden h-14 w-14 shrink-0 sm:block" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                On-device AI
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Your smart scrolling dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Detects haunted patterns, intervenes with context, and gives you a
                companion who&apos;s honest instead of lecture-y.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSessions(resetToDemo())}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reset demo data
            </button>
            <button
              type="button"
              onClick={() => setSessions(clearAllData())}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-coral/50 hover:text-coral"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear data
            </button>
          </div>
        </div>

        {!hydrated ? null : (
          <>
            {timer.phase === "running" && timer.warned ? (
              <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 shrink-0 text-amber" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-foreground">
                    Heads-up — your break has {timer.warnMin} min left.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("timer")}
                  className="shrink-0 cursor-pointer rounded-full bg-amber/20 px-4 py-2 text-sm font-semibold text-amber transition-colors hover:bg-amber/30"
                >
                  Open timer
                </button>
              </div>
            ) : null}
            {timer.phase === "done" ? (
              <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-coral/40 bg-coral/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 shrink-0 text-coral" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-foreground">
                    Break&apos;s over. You beat the feed — go see the result.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("timer")}
                  className="shrink-0 cursor-pointer rounded-full bg-coral/20 px-4 py-2 text-sm font-semibold text-coral transition-colors hover:bg-coral/30"
                >
                  See the result
                </button>
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Sessions",
                  value: String(sessions.length),
                  icon: BarChart3,
                },
                {
                  label: "Total logged time",
                  value: formatDuration(totalMs),
                  icon: Clock,
                },
                {
                  label: "Latest run",
                  value:
                    sessions.length > 0 ? SEVERITY_LABELS[lastSeverity] : "—",
                  icon: Activity,
                },
              ].map((stat) => (
                <Card key={stat.label} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <stat.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-heading text-xl font-semibold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {TABS.map(({ id, label, icon: Icon, featured }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab((cur) => (cur === id ? null : id))}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border transition-all",
                    featured
                      ? cn(
                          "h-14 px-7 text-base font-bold tracking-tight shadow-lg",
                          tab === id
                            ? "scale-[1.06] border-primary bg-gradient-to-r from-primary to-[#2D6CDF] text-primary-foreground shadow-primary/30"
                            : "border-primary bg-primary/10 text-primary shadow-primary/10",
                        )
                      : cn(
                          "h-11 px-5 text-sm font-medium",
                          tab === id
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        ),
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4", featured && "h-5 w-5")}
                    aria-hidden="true"
                  />
                  {label}
                </button>
              ))}
            </div>

            <p
              key={tab ?? "none"}
              className="mt-4 max-w-2xl animate-fade-in text-sm leading-relaxed text-muted-foreground"
            >
              {tab
                ? TABS.find((t) => t.id === tab)?.blurb
                : "Everything in one place. Tap a card to open it — tap the active one again to close it."}
            </p>

            <div className="mt-6">
              {tab ? (
                <>
                  {tab === "overview" ? (
                    <OverviewTab sessions={sessions} tracker={tracker} />
                  ) : null}
                  {tab === "insights" ? <InsightsTab sessions={sessions} /> : null}
                  {tab === "predict" ? <PredictTab sessions={sessions} /> : null}
                  {tab === "triggers" ? <TriggersTab sessions={sessions} /> : null}
                  {tab === "coach" ? <CoachTab sessions={sessions} /> : null}
                  {tab === "timer" ? <TimerTab timer={timer} /> : null}
                  {tab === "live" ? (
                    <LiveScrollTab onGoToTimer={() => setTab("timer")} />
                  ) : null}
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CAPABILITIES.map((cap) => (
                    <button
                      key={cap.title}
                      type="button"
                      disabled={cap.tab === null}
                      onClick={() => cap.tab && setTab(cap.tab)}
                      className={cn(
                        "group flex h-full flex-col gap-3 rounded-2xl border bg-card/70 p-6 text-left shadow-card transition-all",
                        cap.tab
                          ? "cursor-pointer hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow-teal"
                          : "cursor-default",
                      )}
                    >
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <cap.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        {cap.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {cap.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
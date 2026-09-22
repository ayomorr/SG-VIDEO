"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Gauge,
  Hand,
  MousePointerClick,
  Play,
  Square,
  TimerReset,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MOOD_LABELS, MOODS } from "@/lib/engine/catalog";
import type { Mood, Session } from "@/lib/engine/types";
import { uuid } from "@/lib/engine/format";
import { addSession } from "@/lib/store";
import {
  LIVE_CHECKIN_MINUTES,
  LIVE_GOAL_EXTEND_MINUTES,
  LIVE_IDLE_BREAK_MS,
  LIVE_RISK_LABEL,
  LIVE_WINDOW_MS,
  classifyLive,
  riskFor,
  type LiveClass,
  type LiveRisk,
} from "@/lib/engine/live";

const RISK_TONE: Record<LiveRisk, string> = {
  normal: "",
  long: "border-amber/40 bg-amber/5 text-amber-500",
  extended: "border-coral/40 bg-coral/5 text-coral",
  high: "border-coral/40 bg-coral/10 text-coral",
};

const AUTHORS = [
  "Maya",
  "Theo",
  "Zara",
  "Adrian",
  "Noa",
  "Felix",
  "Imani",
  "Jonas",
];

const POSTS = [
  "No one is talking about the 11pm scroll spiral.",
  "Just finished this — feels huge, sharing here.",
  "Hot take: notifications are designed to be pushed.",
  "Found a 10-line trick that changed my mornings.",
  "Why do I open the feed when I'm tired?",
  "3 am, one more post, then bed. Again.",
  "The infinite scroll was a mistake but it pays too well.",
  "Day 4 without checking my phone first thing.",
  "What's your go-to when the doom hits at night?",
  "Small wins: put the charger across the room.",
  "This took way longer than it should have.",
  "Alright, actually logging off after this one.",
  "The feed adapts faster than your willpower.",
  "Nobody shares this but everyone feels it.",
  "Two tabs, one feed, zero idea how long I was there.",
  "Recommend me one thing to read instead of scrolling.",
  "Realized my worst scrolls start with curiosity.",
  "An app that just a countdown would be enough.",
  "Your urge to check is not a moral failing.",
  "Tonight I'm trying the no-phone kitchen rule.",
  "Why is the worst content the stickiest?",
  "Set a timer before opening the feed today.",
  "The scroll is the reward and the punishment.",
  "One run, 40 minutes, no memory of the middle.",
  "I put a sticker on my phone that says 'why'.",
  "Rebel move: leave the refresh alone.",
  "Streaks are cute but sleep is better.",
  "Anyone else lose an argument with a feed?",
  "The algorithm finally met my 'sleep' struggle.",
  "Posting this so I stop editing for five hours.",
];

const GRADIENTS = [
  "from-teal to-blue",
  "from-lavender to-focus",
  "from-coral to-amber/60",
  "from-blue to-lavender",
  "from-teal to-lavender",
  "from-focus to-coral",
  "from-amber to-coral",
  "from-lavender to-teal",
];

const GOAL_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
];

type Prompt = { kind: "checkin" | "complete"; min: number } | null;

function FeedChip({
  prompt,
  current,
  onPrimary,
  onSecondary,
}: {
  prompt: Exclude<Prompt, null>;
  current: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const complete = prompt.kind === "complete";
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        current
          ? "border-coral/40 bg-coral/10 shadow-glow-coral"
          : "border-border bg-card opacity-60",
      )}
    >
      <p className="text-sm font-semibold text-foreground">
        {complete
          ? "Your session's complete."
          : `Still scrolling? You've been here ${prompt.min} minutes.`}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {complete
          ? `You planned to stop at ${prompt.min} minutes. Take a break or push on — the call is yours.`
          : "Consider a real break — your run is logging on its own when you stop."}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-coral px-4 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          <Hand className="h-3.5 w-3.5" aria-hidden="true" />
          Take a break
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {complete ? `+${LIVE_GOAL_EXTEND_MINUTES} more minutes` : "Continue"}
        </button>
      </div>
    </div>
  );
}

function fmtClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function fmtDistance(px: number) {
  const meters = px / 3779.53;
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  if (meters >= 10) return `${Math.round(meters)} m`;
  return `${Math.round(meters * 100) / 100} m`;
}

const CLASS_BADGE: Record<LiveClass, { label: string; className: string }> = {
  normal: { label: "Normal session", className: "bg-teal/15 text-teal" },
  continuous: {
    label: "Continuous scrolling",
    className: "bg-lavender/15 text-lavender",
  },
  autopilot: { label: "Autopilot pattern", className: "bg-coral/15 text-coral" },
};

export function LiveScrollTab({
  onGoToTimer,
}: {
  onGoToTimer?: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "live" | "summary">("idle");
  const [goalMinutes, setGoalMinutes] = useState(30);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [moodBefore, setMoodBefore] = useState<Mood | null>(null);
  const [moodAfter, setMoodAfter] = useState<Mood | null>(null);
  const [startAt, setStartAt] = useState<number>(0);
  const [endAt, setEndAt] = useState<number>(0);
  const [eventCount, setEventCount] = useState(0);
  const [distancePx, setDistancePx] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [lastEventAt, setLastEventAt] = useState<number>(0);
  const [prompted, setPrompted] = useState<number[]>([]);
  const [goalPromptShown, setGoalPromptShown] = useState(false);
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [now, setNow] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTop = useRef(0);
  const windowQueue = useRef<number[]>([]);
  const endedRef = useRef(false);
  const snap = useRef<{
    startAt: number;
    moodBefore: Mood | null;
    eventCount: number;
    distancePx: number;
    breaksTaken: number;
    goalMinutes: number;
    label: string;
  } | null>(null);

  const posts = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        author: AUTHORS[i % AUTHORS.length],
        text: POSTS[i % POSTS.length],
        gradient: GRADIENTS[i % GRADIENTS.length],
      })),
    [],
  );

  const elapsedMs = Math.max(0, (now || endAt || Date.now()) - startAt);
  const goalMs = goalMinutes * 60_000;
  const timeLeftMs = Math.max(0, goalMs - elapsedMs);
  const goalDone = goalMinutes > 0 && elapsedMs >= goalMs;

  const windowEvents = (() => {
    const cutoff = performance.now() - LIVE_WINDOW_MS;
    return windowQueue.current.filter((t) => t >= cutoff).length;
  })();

  const liveClass: LiveClass = classifyLive({
    elapsedMs,
    windowEvents,
    breaksTaken,
    idleMs: now > 0 ? Math.max(0, now - lastEventAt) : 0,
  });
  const liveRisk: LiveRisk = riskFor(elapsedMs);

  useEffect(() => {
    if (phase !== "live") return;
    setNow(performance.now());
    const id = setInterval(() => {
      setNow(performance.now());
      if (snap.current) {
        snap.current.label = CLASS_BADGE[liveClass].label;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, liveClass]);

  useEffect(() => {
    if (phase !== "live") return;
    const dueCheckins = LIVE_CHECKIN_MINUTES.filter(
      (m) => m < goalMinutes && !prompted.includes(m) && elapsedMs >= m * 60_000,
    );
    if (dueCheckins.length > 0) {
      setPrompted((prev) => [...prev, ...dueCheckins]);
      setPrompt({ kind: "checkin", min: dueCheckins[0] });
      return;
    }
    if (!goalPromptShown && goalDone) {
      setGoalPromptShown(true);
      setPrompt({ kind: "complete", min: goalMinutes });
    }
  }, [phase, elapsedMs, prompted, goalPromptShown, goalDone, goalMinutes]);

  useEffect(
    () => () => {
      if (
        phase === "live" &&
        !endedRef.current &&
        snap.current &&
        performance.now() - snap.current.startAt >= 15_000
      ) {
        const s = snap.current;
        addSession({
          id: uuid(),
          app: "Live feed",
          category: "social",
          startAt: s.startAt,
          endAt: performance.now(),
          moodBefore: s.moodBefore,
          moodAfter: null,
          source: "live",
          breaks: s.breaksTaken,
          note: `${s.eventCount} scrolls · ${fmtDistance(s.distancePx)} of feed · ${
            s.breaksTaken
          } pause${s.breaksTaken === 1 ? "" : "s"} · plan ${s.goalMinutes} min · classified ${s.label}`,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase],
  );

  const begin = () => {
    windowQueue.current = [];
    prevTop.current = 0;
    setEventCount(0);
    setDistancePx(0);
    setBreaksTaken(0);
    setLastEventAt(0);
    setPrompted([]);
    setGoalPromptShown(false);
    setPrompt(null);
    const start = performance.now();
    setStartAt(start);
    setNow(start);
    endedRef.current = false;
    snap.current = {
      startAt: start,
      moodBefore,
      eventCount: 0,
      distancePx: 0,
      breaksTaken: 0,
      goalMinutes,
      label: "Normal session",
    };
    setPhase("live");
  };

  const buildSession = (after?: Mood | null): Session => ({
    id: uuid(),
    app: "Live feed",
    category: "social",
    startAt,
    endAt: endAt || performance.now(),
    moodBefore,
    moodAfter: after ?? null,
    source: "live",
    breaks: breaksTaken,
    note: `${eventCount} scrolls · ${fmtDistance(distancePx)} of feed · ${breaksTaken} pause${
      breaksTaken === 1 ? "" : "s"
    } · plan ${goalMinutes} min · classified ${CLASS_BADGE[liveClass].label}`,
  });

  const save = () => {
    addSession(buildSession(moodAfter));
    reset();
  };

  const reset = () => {
    setPhase("idle");
    setMoodAfter(null);
    setMoodBefore(null);
    setEventCount(0);
    setDistancePx(0);
    setBreaksTaken(0);
    setEndAt(0);
    setPrompt(null);
    setGoalPromptShown(false);
    setPrompted([]);
    snap.current = null;
  };

  const finish = () => {
    setEndAt(performance.now());
    endedRef.current = true;
    setPhase("summary");
  };

  const extendGoal = () => {
    setGoalMinutes((g) => g + LIVE_GOAL_EXTEND_MINUTES);
    setGoalPromptShown(false);
    setPrompt(null);
  };

  const dismissPrompt = () => setPrompt(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const t = performance.now();
    const delta = Math.abs(el.scrollTop - prevTop.current);
    prevTop.current = el.scrollTop;
    if (lastEventAt > 0 && t - lastEventAt >= LIVE_IDLE_BREAK_MS) {
      setBreaksTaken((b) => {
        if (snap.current) snap.current.breaksTaken = b + 1;
        return b + 1;
      });
    }
    setLastEventAt(t);
    if (delta > 0) {
      setEventCount((c) => {
        if (snap.current) snap.current.eventCount = c + 1;
        return c + 1;
      });
      setDistancePx((d) => {
        if (snap.current) snap.current.distancePx = d + delta;
        return d + delta;
      });
      windowQueue.current.push(t);
    }
  };

  if (phase === "idle") {
    return (
      <Card className="p-8 md:p-10">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gauge className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-heading text-2xl font-semibold text-foreground">
            The live scroll lab
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Decide how long you want to scroll, then open the feed. The clock
            counts down your chosen amount while live counts of scrolls,
            distance, and pauses build beside it — and it prompts you at the
            milestones. Real apps can&apos;t be watched by a browser, so this is
            the one feed Scroll Detect can see.
          </p>

          <div className="mt-7 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How long do you want to scroll?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setGoalMinutes(opt.value);
                    setCustomOpen(false);
                  }}
                  className={cn(
                    "inline-flex h-10 cursor-pointer items-center rounded-full border px-5 text-sm font-medium transition-colors",
                    goalMinutes === opt.value && !customOpen
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center rounded-full border px-5 text-sm font-medium transition-colors",
                  customOpen
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                Custom
              </button>
            </div>
            {customOpen ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="h-10 w-28 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
                  placeholder="20"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = Number.parseInt(customValue, 10);
                    if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 240) {
                      setGoalMinutes(parsed);
                      setCustomOpen(false);
                    }
                  }}
                  className="inline-flex h-10 cursor-pointer items-center rounded-full border border-primary/50 bg-primary/10 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  Set
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-7 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How are you feeling before starting?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setMoodBefore((m) => (m === mood ? null : mood))}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-xs font-medium transition-colors",
                    moodBefore === mood
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {MOOD_LABELS[mood]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={begin}
            className="mt-8 inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-glow-teal transition-transform hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Open the feed &amp; start the timer
          </button>
        </div>
      </Card>
    );
  }

  if (phase === "summary") {
    return (
      <Card className="p-8 md:p-10">
        <div className="mx-auto max-w-lg text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal/15 text-teal">
            <TimerReset className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">
            Run captured.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtClock(endAt - startAt)} on the feed (you planned {goalMinutes}
            min) · {eventCount} scrolls across {fmtDistance(distancePx)} ·{" "}
            {breaksTaken} pause{breaksTaken === 1 ? "" : "s"} ·{" "}
            <span className={CLASS_BADGE[liveClass].className}>
              {CLASS_BADGE[liveClass].label}
            </span>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 text-left">
            {[
              { label: "Time", value: fmtClock(endAt - startAt) },
              { label: "Scrolls", value: String(eventCount) },
              { label: "Distance", value: fmtDistance(distancePx) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-muted px-3 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 font-heading text-lg font-semibold tabular-nums text-foreground">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How did it leave you?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setMoodAfter((m) => (m === mood ? null : mood))}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-xs font-medium transition-colors",
                    moodAfter === mood
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {MOOD_LABELS[mood]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={save}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-glow-teal transition-transform hover:-translate-y-0.5"
            >
              Save to log
            </button>
            {onGoToTimer ? (
              <button
                type="button"
                onClick={onGoToTimer}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                Start a break timer instead
              </button>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 cursor-pointer items-center rounded-full border px-6 text-sm font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              Discard
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-3xl border border-border bg-card shadow-card">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[560px] overflow-y-auto overscroll-contain px-4 py-4"
        >
          <div className="mb-4 rounded-2xl bg-muted px-4 py-3 text-[11px] text-muted-foreground">
            This is a pretend feed for the live lab. Scroll, pause, go fast —
            the classifier and the countdown watch everything you do here.
          </div>
          {posts.map((post, i) => (
            <article
              key={i}
              className="mb-4 rounded-2xl border border-border p-4"
            >
              <header className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                    post.gradient,
                  )}
                >
                  {post.author[0]}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {post.author}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    @{post.author.toLowerCase()} · just now
                  </p>
                </div>
              </header>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {post.text}
              </p>
              <div
                className={cn(
                  "mt-3 h-28 rounded-xl bg-gradient-to-br",
                  post.gradient,
                )}
              />
            </article>
          ))}
          <p className="px-4 pb-2 text-center text-[10px] text-muted-foreground">
            End of the demo feed — close the lab whenever you&apos;re ready.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live classification
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                CLASS_BADGE[liveClass].className,
              )}
            >
              {CLASS_BADGE[liveClass].label}
            </span>
          </div>

          {liveRisk !== "normal" ? (
            <div
              className={cn(
                "mt-4 rounded-2xl border px-4 py-3",
                RISK_TONE[liveRisk],
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wider">
                {LIVE_RISK_LABEL[liveRisk]} detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You&apos;ve been scrolling continuously for{" "}
                <span className="font-medium text-foreground">
                  {fmtClock(elapsedMs)}
                </span>
                . {liveRisk === "high" ? "This is getting into the deep end." : "Consider wrapping up soon."}
              </p>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Time on feed
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
                {fmtClock(elapsedMs)}
              </p>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your {goalMinutes} minutes
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
                {fmtClock(timeLeftMs)}
              </p>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Scrolls
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
                {eventCount}
              </p>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Feed distance
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
                {fmtDistance(distancePx)}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                goalDone
                  ? "bg-coral"
                  : timeLeftMs < goalMs * 0.25
                    ? "bg-coral"
                    : timeLeftMs < goalMs * 0.5
                      ? "bg-lavender"
                      : "bg-teal",
              )}
              style={{
                width: `${Math.min(100, (elapsedMs / goalMs) * 100)}%`,
              }}
            />
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MousePointerClick
              className="h-3.5 w-3.5 text-lavender"
              aria-hidden="true"
            />
            {breaksTaken} pause{breaksTaken === 1 ? "" : "s"} ·{" "}
            {windowEvents >= 6 ? (
              <span className="font-medium text-foreground">fast, frequent scrolling</span>
            ) : (
              <span className="font-medium text-foreground">occasional scrolling</span>
            )}{" "}
            in the last 30 seconds.
          </p>
        </Card>

        <div className="flex flex-col gap-3">
          {prompt?.kind === "complete" ? (
            <FeedChip
              prompt={prompt}
              current
              onPrimary={finish}
              onSecondary={extendGoal}
            />
          ) : null}
          {LIVE_CHECKIN_MINUTES.filter((m) => m < goalMinutes).map((m) => (
            <FeedChip
              key={m}
              prompt={{ kind: "checkin", min: m }}
              current={prompt?.kind === "checkin" && prompt.min === m}
              onPrimary={finish}
              onSecondary={dismissPrompt}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={finish}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-coral/40 text-sm font-semibold text-coral transition-colors hover:bg-coral/10"
        >
          <Square className="h-4 w-4" aria-hidden="true" />
          End session
        </button>
      </div>
    </div>
  );
}
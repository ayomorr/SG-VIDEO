import type { Insight, Session, Severity } from "@/lib/engine/types";
import { DEFAULT_CONFIG } from "@/lib/engine/types";
import { appDefinition } from "@/lib/engine/catalog";
import { buildRuns } from "@/lib/engine/detection";
import {
  dayKey,
  formatDuration,
  formatHour,
  formatRange,
  hourOf,
  isLateNight,
  percent,
  startOfDay,
  uuid,
} from "@/lib/engine/format";
import { severityOf } from "@/lib/engine/detection";

const WEEK = 7 * 24 * 60 * 60_000;

/** Cumulative scroll minutes per hour-of-day for a set of sessions. */
function hourHistogram(sessions: Session[]): number[] {
  const buckets = new Array<number>(24).fill(0);
  for (const session of sessions) {
    const end = Math.min(session.endAt, startOfDay(session.startAt) + 24 * 60 * 60_000);
    const step = 60_000;
    for (let t = session.startAt; t < end; t += step) {
      const hour = new Date(t).getHours();
      buckets[hour] += step;
    }
  }
  return buckets;
}

function peakWindow(
  buckets: number[],
): { startHour: number; endHour: number; totalMs: number } | null {
  const total = buckets.reduce((sum, ms) => sum + ms, 0);
  if (total <= 0) return null;
  // Sliding 2-hour window for the peak.
  let bestStart = 0;
  let bestMs = -1;
  for (let h = 0; h < 24; h++) {
    const winMs = buckets[h] + buckets[(h + 1) % 24];
    if (winMs > bestMs) {
      bestMs = winMs;
      bestStart = h;
    }
  }
  return {
    startHour: bestStart,
    endHour: (bestStart + 2) % 24,
    totalMs: bestMs,
  };
}

function totalMs(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + Math.max(0, s.endAt - s.startAt), 0);
}

function avgRunMs(sessions: Session[]): number {
  const runs = buildRuns(sessions);
  if (runs.length === 0) return 0;
  return runs.reduce((sum, run) => sum + run.totalMs, 0) / runs.length;
}

function deepestRun(sessions: Session[]): Severity | null {
  const runs = buildRuns(sessions);
  const max = Math.max(...runs.map((run) => run.score));
  if (runs.length === 0) return null;
  return severityOf(max);
}

export function analyzeInsights(sessions: Session[]): Insight[] {
  const now = Date.now();
  const insights: Insight[] = [];

  const last7 = sessions.filter((s) => now - s.startAt <= WEEK);
  const before = sessions.filter(
    (s) => now - s.startAt > WEEK && now - s.startAt <= 2 * WEEK,
  );

  if (last7.length === 0) {
    return [];
  }

  // 1. Peak scrolling window.
  const hist = hourHistogram(last7);
  const peak = peakWindow(hist);
  if (peak) {
    const nightShare = percent(
      hist.reduce(
        (sum, _, h) =>
          sum +
          (isLateNight(h, DEFAULT_CONFIG.nightStartHour, DEFAULT_CONFIG.nightEndHour)
            ? hist[h]
            : 0),
        0,
      ),
      peak.totalMs > 0 ? hist.reduce((sum, ms) => sum + ms, 0) : 1,
    );
    insights.push({
      id: uuid(),
      kind: "peak-window",
      title: `Your peak scrolling window is ${formatRange(peak.startHour, 0, peak.endHour, 0)}`,
      body: `That's when a two-hour stretch of your day has the most scroll time — and ${nightShare}% of it happens in your late-night hours.`,
      tone: nightShare > 40 ? "warn" : "info",
      metric: { value: formatDuration(peak.totalMs), label: "in peak window" },
    });
  }

  // 2. Average run-length trend (this week vs last).
  const last7Avg = avgRunMs(last7);
  const beforeAvg = avgRunMs(before);
  if (last7Avg > 0 && beforeAvg > 0) {
    const change = Math.round(((last7Avg - beforeAvg) / beforeAvg) * 100);
    if (change >= 5) {
      insights.push({
        id: uuid(),
        kind: "trend",
        title: `Your average scrolling session is up ${change}%.`,
        body: `From ${formatDuration(beforeAvg)} to ${formatDuration(last7Avg)} per run. That's creeping up — a tiny nudge now is the gentlest way to bend it back down. You get to choose.`,
        tone: "warn",
        metric: { value: `+${change}%`, label: "vs last week" },
      });
    } else if (change <= -5 || change === 0) {
      insights.push({
        id: uuid(),
        kind: "progress",
        title:
          change <= -5
            ? `Your average scrolling session is down ${Math.abs(change)}%.`
            : "Your scrolling is holding steady.",
        body:
          change <= -5
            ? `From ${formatDuration(beforeAvg)} to ${formatDuration(last7Avg)}. Whatever you're doing differently is working — keep it.`
            : `Runs averaged ${formatDuration(last7Avg)} this week. Steady beats perfect.`,
        tone: "good",
        metric: {
          value: change <= -5 ? `${Math.abs(change)}%` : "steady",
          label: "vs last week",
        },
      });
    }
  }

  // 3. Night share.
  const last7Ms = totalMs(last7);
  const nightMs = last7.reduce(
    (sum, s) =>
      sum +
      (isLateNight(hourOf(s.startAt), DEFAULT_CONFIG.nightStartHour, DEFAULT_CONFIG.nightEndHour)
        ? Math.max(0, s.endAt - s.startAt)
        : 0),
    0,
  );
  if (last7Ms > 0) {
    const share = percent(nightMs, last7Ms);
    if (share > 25) {
      insights.push({
        id: uuid(),
        kind: "night-share",
        title: `${share}% of your scrolling happens after ${formatHour(DEFAULT_CONFIG.nightStartHour, 0)}`,
        body: `That's your vulnerable window — the same time of day triggers long runs. A 10-minute buffer before it beats willpower at midnight.`,
        tone: "warn",
        metric: { value: `${share}%`, label: "late-night share" },
      });
    }
  }

  // 4. App focus (top app).
  const byApp = new Map<string, { app: string; ms: number }>();
  for (const s of last7) {
    const entry = byApp.get(s.app) ?? { app: s.app, ms: 0 };
    entry.ms += Math.max(0, s.endAt - s.startAt);
    byApp.set(s.app, entry);
  }
  const topApp = Array.from(byApp.values()).sort((a, b) => b.ms - a.ms)[0];
  if (topApp && last7Ms > 0) {
    const share = percent(topApp.ms, last7Ms);
    const def = appDefinition(topApp.app);
    insights.push({
      id: uuid(),
      kind: "app-focus",
      title: `${topApp.app} takes ${share}% of your scroll time.`,
      body: `It's a ${def.feedPull >= 0.85 ? "high-pull feed — built to keep you looping" : "medium-pull feed — easier to put down"}. ${
        def.feedPull >= 0.85
          ? "That's worth a hard question: do you leave feeling better?"
          : "You can probably shorten these sessions first."
      }`,
      tone: def.feedPull >= 0.85 ? "warn" : "info",
      metric: { value: formatDuration(topApp.ms), label: "time this week" },
    });
  }

  // 5. Reopen habit.
  const sorted = [...last7].sort((a, b) => a.startAt - b.startAt);
  let reopenCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].startAt - sorted[i - 1].endAt;
    if (
      sorted[i].app === sorted[i - 1].app &&
      gap > 0 &&
      gap <= DEFAULT_CONFIG.chainGapMs * 2
    ) {
      reopenCount++;
    }
  }
  if (reopenCount >= 5) {
    insights.push({
      id: uuid(),
      kind: "reopen",
      title: `You reopen the same app ${reopenCount} times a week within minutes of closing it.`,
      body: `That's the habit loop, not a real reason to open it. When you notice it, name it: "this is a reopen, not a need."`,
      tone: "warn",
      metric: { value: `${reopenCount}/wk`, label: "reopens" },
    });
  } else {
    insights.push({
      id: uuid(),
      kind: "reopen",
      title: `You reopen the same app right after closing it about ${reopenCount} times a week.`,
      body: "That impulse is normal — most brains check twice. We just don't want it to be four. Nice and low.",
      tone: "good",
      metric: { value: `${reopenCount}/wk`, label: "reopens" },
    });
  }

  // 6. Deep-scroll day streak.
  const deepDays = new Set<string>();
  for (const s of last7) {
    if (deepestRun([s]) === "deep" || deepestRun([s]) === "spiral") {
      deepDays.add(dayKey(s.startAt));
    }
  }
  const seriousDays = new Set(last7.map((s) => dayKey(s.startAt)));
  if (deepDays.size > 0 && deepDays.size >= Math.ceil(seriousDays.size / 2)) {
    insights.push({
      id: uuid(),
      kind: "streak",
      title: `Deep-scroll days on ${deepDays.size} of your last ${seriousDays.size} active days.`,
      body: "Deep days aren't failure — they're data. They tell us the exact time and app where the guard should sit.",
      tone: "info",
      metric: { value: `${deepDays.size}`, label: "deep days" },
    });
  }

  return insights.slice(0, 5);
}

/** Single-day overview used by the Overview tab. */
export function daySummary(sessions: Session[]): {
  date: string;
  totalMs: number;
  runs: number;
  score: number;
  severity: Severity;
} {
  const today = startOfDay(Date.now());
  const todays = sessions.filter(
    (s) => s.startAt >= today && s.startAt < today + 24 * 60 * 60_000,
  );
  const runs = buildRuns(todays);
  const total = totalMs(todays);
  const score = runs.length
    ? Math.round(runs.reduce((sum, run) => sum + run.score, 0) / runs.length)
    : 0;
  return {
    date: new Date(today).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }),
    totalMs: total,
    runs: runs.length,
    score,
    severity: score > 0 ? severityOf(score) : "calm",
  };
}
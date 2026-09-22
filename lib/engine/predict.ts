import type { Prediction, Session } from "@/lib/engine/types";
import { DEFAULT_CONFIG } from "@/lib/engine/types";
import { buildRuns } from "@/lib/engine/detection";
import {
  clamp,
  formatHour,
  formatRange,
  hourOf,
  uuid,
} from "@/lib/engine/format";

/**
 * Predict risky scrolling periods. Runs from the last two weeks are clustered
 * by the hour they started in, weighted by frequency, run length, and how
 * late-night they were. The strongest windows become predictions with a
 * suggested reminder 10 minutes before.
 */
export function predictRisk(sessions: Session[]): Prediction[] {
  const now = Date.now();
  const recent = sessions.filter((s) => now - s.startAt <= 14 * 24 * 60 * 60_000);
  const runs = buildRuns(recent);

  const clusters = new Map<number, { count: number; totalMs: number }>();
  for (const run of runs) {
    const hour = hourOf(run.startAt);
    for (let offset = -1; offset <= 1; offset++) {
      const bucket = (((hour + offset) % 24) + 24) % 24;
      const entry = clusters.get(bucket) ?? { count: 0, totalMs: 0 };
      entry.count += 1;
      entry.totalMs += run.totalMs;
      clusters.set(bucket, entry);
    }
  }

  if (clusters.size === 0) return [];

  const lateNight = (hour: number): boolean =>
    DEFAULT_CONFIG.nightStartHour <= DEFAULT_CONFIG.nightEndHour
      ? hour >= DEFAULT_CONFIG.nightStartHour && hour < DEFAULT_CONFIG.nightEndHour
      : hour >= DEFAULT_CONFIG.nightStartHour || hour < DEFAULT_CONFIG.nightEndHour;

  const ranked = Array.from(clusters.entries())
    .map(([bucketHour, value]) => {
      const lateBoost = lateNight(bucketHour) ? 1.35 : 1;
      const score =
        value.count * 2 * lateBoost + Math.log10(value.totalMs + 1) * 10;
      return { bucketHour, ...value, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 3);
  const topScore = top[0]?.score ?? 1;

  return top.map((bucket, index) => {
    const startHour = bucket.bucketHour;
    const endHour = (startHour + 1) % 24;
    const windowRuns = runs.filter((run) => {
      const h = hourOf(run.startAt);
      return Math.abs(h - startHour) <= 1;
    });
    const avgMs = windowRuns.length
      ? windowRuns.reduce((sum, run) => sum + run.totalMs, 0) / windowRuns.length
      : 0;
    const byApp = new Map<string, number>();
    for (const run of windowRuns) {
      const topApp = run.apps[0];
      if (!topApp) continue;
      byApp.set(topApp, (byApp.get(topApp) ?? 0) + run.totalMs);
    }
    const primaryApp =
      Array.from(byApp.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "your apps";

    const confidence = clamp(Math.round((bucket.score / topScore) * 100), 30, 98);
    const reminderHour = (((startHour - 1) % 24) + 24) % 24;
    const reminderMin = index >= 2 ? 5 : 10;

    return {
      id: uuid(),
      windowStartHour: startHour,
      windowStartMin: 0,
      windowEndHour: endHour,
      windowEndMin: 0,
      confidence,
      observedCount: bucket.count,
      averageSessionMs: Math.round(avgMs),
      primaryApp,
      reminderHour,
      reminderMin,
      message: `You usually start long scrolling sessions between ${formatRange(
        startHour,
        0,
        endHour,
        0,
      )}. Would you like a gentle reminder at ${formatHour(
        reminderHour,
        reminderMin,
      )} so you get to decide first?`,
    };
  });
}

/** The single next high-risk window for the Overview tab. */
export function nextRisk(sessions: Session[]): Prediction | null {
  return predictRisk(sessions)[0] ?? null;
}
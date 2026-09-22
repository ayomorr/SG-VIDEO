import type {
  DetectionConfig,
  Intervention,
  RunAnalysis,
  Session,
  SessionAnalysis,
  Severity,
} from "@/lib/engine/types";
import { DEFAULT_CONFIG } from "@/lib/engine/types";
import { appDefinition } from "@/lib/engine/catalog";
import {
  clamp,
  formatDuration,
  hourOf,
  isLateNight,
  uuid,
} from "@/lib/engine/format";

export function severityOf(score: number): Severity {
  if (score < 15) return "calm";
  if (score < 35) return "mindful";
  if (score < 55) return "drifting";
  if (score < 75) return "deep";
  return "spiral";
}

function severityLabel(severity: Severity): string {
  switch (severity) {
    case "calm":
      return "Calm & intentional";
    case "mindful":
      return "Mostly mindful";
    case "drifting":
      return "Drifting";
    case "deep":
      return "Deep scroll";
    case "spiral":
      return "Scroll spiral";
  }
}

/** Analyze a single session in isolation. */
export function analyzeSession(
  session: Session,
  config: DetectionConfig = DEFAULT_CONFIG,
): SessionAnalysis {
  const durationMs = Math.max(0, session.endAt - session.startAt);
  const hour = hourOf(session.startAt);
  const def = appDefinition(session.app);

  const longSession = durationMs >= config.longSessionMs;
  const veryLongSession = durationMs >= config.veryLongSessionMs;
  const lateNight = isLateNight(
    hour,
    config.nightStartHour,
    config.nightEndHour,
  );

  let score = 0;
  if (longSession) score += 22;
  if (veryLongSession) score += 22;
  if (lateNight) score += 18;
  score += Math.round(14 * def.feedPull);
  if (session.category === "shorts") score += 6;

  // Gentle ceiling so a single mindful 8-minute clip stays "calm".
  if (durationMs < 6 * 60_000 && !lateNight) {
    score = Math.round(score * 0.5);
  }

  return {
    session,
    durationMs,
    flags: {
      longSession,
      veryLongSession,
      lateNight,
      rapidSwitch: false,
      chained: false,
    },
    score: clamp(score, 0, 100),
    severity: severityOf(clamp(score, 0, 100)),
  };
}

/**
 * Group sessions into continuous "runs" of scrolling. A run ends when there is
 * a gap longer than chainGapMs between sessions. Runs are the unit the engine
 * uses for interventions and predictions.
 */
export function buildRuns(
  sessions: Session[],
  config: DetectionConfig = DEFAULT_CONFIG,
): RunAnalysis[] {
  const sorted = [...sessions].sort((a, b) => a.startAt - b.startAt);
  const runs: RunAnalysis[] = [];

  let current: Session[] = [];
  let startAt = 0;
  let endAt = 0;

  const flush = () => {
    if (current.length === 0) return;
    const totalMs = endAt - startAt;
    const apps = Array.from(new Set(current.map((s) => s.app)));
    let appSwitches = 0;
    for (let i = 1; i < current.length; i++) {
      const prevEnd = current[i - 1].endAt;
      const gap = current[i].startAt - prevEnd;
      if (gap <= config.switchGapMs && current[i].app !== current[i - 1].app) {
        appSwitches++;
      }
    }

    let score = 0;
    if (totalMs >= config.excessiveRunMs) score += 30;
    if (appSwitches >= 2) score += 20;
    if (apps.length >= 3 && totalMs >= config.longSessionMs) score += 15;
    const avg = analyzeSession(current[current.length - 1]);
    score += Math.round(avg.score * 0.4);

    runs.push({
      sessions: current,
      totalMs,
      apps,
      appSwitches,
      startAt,
      endAt,
      lateNight: isLateNight(
        hourOf(startAt),
        config.nightStartHour,
        config.nightEndHour,
      ),
      score: clamp(score, 0, 100),
      severity: severityOf(clamp(score, 0, 100)),
    });
    current = [];
  };

  for (const session of sorted) {
    if (current.length === 0) {
      startAt = session.startAt;
      endAt = session.endAt;
      current = [session];
      continue;
    }
    if (session.startAt - endAt <= config.chainGapMs) {
      endAt = Math.max(endAt, session.endAt);
      current.push(session);
    } else {
      flush();
      startAt = session.startAt;
      endAt = session.endAt;
      current = [session];
    }
  }
  flush();

  return runs;
}

const BREAK_SUGGESTIONS = [
  "Step away for a 5-minute stretch",
  "Drink some water and look at something far away",
  "Take one slow breath in for 4 counts, out for 8",
  "Go make a drink and come back with a plan",
  "Set a 5-minute timer and close the app until it rings",
];

/**
 * Smart, context-aware intervention for a single detected run. References real
 * numbers (actual duration, this person's usual run length) instead of a
 * generic nudge.
 */
export function interventionForRun(
  run: RunAnalysis,
  priorRuns: RunAnalysis[],
): Intervention | null {
  if (run.score < 30) return null;

  const usual = averageRunMs(priorRuns, 10);
  const duration = formatDuration(run.totalMs);
  const usualText = usual > 0 ? `Your usual session is around ${formatDuration(usual)}.` : "";
  const appsText =
    run.appSwitches >= 2
      ? ` You switched between ${run.apps.length} apps in the last few minutes — a classic bounce-around.`
      : "";
  const nightText = run.lateNight
    ? " It's also past your calm hours, when scrolling tends to linger."
    : "";

  let suggestion: string;
  if (run.severity === "spiral" || run.severity === "deep") {
    suggestion = `Would you like to take a 10-minute break?`;
  } else {
    suggestion = `Want a quick break now?`;
  }

  return {
    id: uuid(),
    title: `You've been scrolling continuously for ${duration}.`,
    body: `${suggestion} ${usualText}${appsText}${nightText}`,
    reason: severityLabel(run.severity),
    severity: run.severity,
    suggestions: BREAK_SUGGESTIONS.slice(0, 3),
    origin: "run",
  };
}

export function averageRunMs(runs: RunAnalysis[], max = 10): number {
  const recent = runs.slice(-max);
  const late = recent.filter((run) => run.lateNight);
  const base = late.length >= 2 ? late : recent;
  if (base.length === 0) return 0;
  return base.reduce((sum, run) => sum + run.totalMs, 0) / base.length;
}

/** Fills in flag fields for sessions inside a run (rapidSwitch / chained). */
export function annotateRuns(sessions: Session[]): SessionAnalysis[] {
  const runs = buildRuns(sessions);
  const map = new Map<string, SessionAnalysis>();
  for (const run of runs) {
    for (const session of run.sessions) {
      const analysis = analyzeSession(session);
      const quickGap =
        run.sessions.length > 1 &&
        run.sessions.some(
          (other) =>
            other.id !== session.id &&
            Math.abs(other.startAt - session.endAt) <= DEFAULT_CONFIG.switchGapMs,
        );
      map.set(session.id, {
        ...analysis,
        score: run.score,
        severity: run.severity,
        flags: {
          ...analysis.flags,
          chained: run.sessions.length > 1,
          rapidSwitch: quickGap || run.appSwitches > 0,
        },
      });
    }
  }
  return sessions
    .map((session) => map.get(session.id))
    .filter((v): v is SessionAnalysis => Boolean(v));
}
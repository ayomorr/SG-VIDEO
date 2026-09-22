export const LIVE_WINDOW_MS = 30_000;
export const LIVE_IDLE_BREAK_MS = 4_000;
export const LIVE_AUTOPILOT_MIN_MS = 10 * 60_000;
export const LIVE_CHECKIN_MINUTES = [10, 20];
export const LIVE_GOAL_EXTEND_MINUTES = 5;

export type LiveClass = "normal" | "continuous" | "autopilot";

export const LIVE_CLASS_LABEL: Record<LiveClass, string> = {
  normal: "Normal session",
  continuous: "Continuous scrolling",
  autopilot: "Autopilot pattern",
};

export type LiveRisk = "normal" | "long" | "extended" | "high";

export const LIVE_RISK_LABEL: Record<LiveRisk, string> = {
  normal: "Normal",
  long: "Getting long",
  extended: "Extended scrolling",
  high: "High scrolling session",
};

export function riskFor(elapsedMs: number): LiveRisk {
  if (elapsedMs < 15 * 60_000) return "normal";
  if (elapsedMs < 30 * 60_000) return "long";
  if (elapsedMs < 60 * 60_000) return "extended";
  return "high";
}

export interface LiveSample {
  elapsedMs: number;
  windowEvents: number;
  breaksTaken: number;
  idleMs: number;
}

export function classifyLive(sample: LiveSample): LiveClass {
  const { elapsedMs, windowEvents, breaksTaken, idleMs } = sample;
  if (elapsedMs < 60_000 || windowEvents < 3 || idleMs >= LIVE_IDLE_BREAK_MS) {
    return "normal";
  }
  if (
    elapsedMs >= LIVE_AUTOPILOT_MIN_MS &&
    breaksTaken === 0 &&
    windowEvents >= 10
  ) {
    return "autopilot";
  }
  return windowEvents >= 6 ? "continuous" : "normal";
}
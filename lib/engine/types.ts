export type Category =
  | "social"
  | "video"
  | "news"
  | "shorts"
  | "messaging"
  | "shopping"
  | "gaming"
  | "other";

export type Mood =
  | "bored"
  | "anxious"
  | "stressed"
  | "tired"
  | "lonely"
  | "curious"
  | "restless"
  | "okay"
  | "good";

export interface Session {
  id: string;
  app: string;
  category: Category;
  startAt: number;
  endAt: number;
  moodBefore?: Mood | null;
  moodAfter?: Mood | null;
  note?: string;
  source: "seed" | "manual" | "auto" | "live";
  /** Pauses taken during the run (live feed sessions). */
  breaks?: number;
}

export interface DetectionConfig {
  /** A single session longer than this counts as "long". */
  longSessionMs: number;
  /** A single session longer than this counts as "very long". */
  veryLongSessionMs: number;
  /** Sessions chained within this gap are treated as one continuous run. */
  chainGapMs: number;
  /** A gap this small between different apps counts as rapid switching. */
  switchGapMs: number;
  /** Starts after this hour (local time) are late-night. */
  nightStartHour: number;
  /** ...and before this hour are still late-night. */
  nightEndHour: number;
  /** Continuous-run length that is considered "excessive". */
  excessiveRunMs: number;
}

export const DEFAULT_CONFIG: DetectionConfig = {
  longSessionMs: 10 * 60_000,
  veryLongSessionMs: 30 * 60_000,
  chainGapMs: 2 * 60_000,
  switchGapMs: 90_000,
  nightStartHour: 21,
  nightEndHour: 5,
  excessiveRunMs: 30 * 60_000,
};

export type Severity = "calm" | "mindful" | "drifting" | "deep" | "spiral";

export interface SessionFlags {
  longSession: boolean;
  veryLongSession: boolean;
  lateNight: boolean;
  rapidSwitch: boolean;
  chained: boolean;
}

export interface SessionAnalysis {
  session: Session;
  durationMs: number;
  flags: SessionFlags;
  /** 0–100 heuristic doomscroll likelihood for this session. */
  score: number;
  severity: Severity;
}

export interface RunAnalysis {
  /** The sessions that make up one continuous run of scrolling. */
  sessions: Session[];
  totalMs: number;
  apps: string[];
  appSwitches: number;
  startAt: number;
  endAt: number;
  lateNight: boolean;
  score: number;
  severity: Severity;
}

export interface Intervention {
  id: string;
  title: string;
  body: string;
  reason: string;
  severity: Severity;
  suggestions: string[];
  /** Which engine produced it. */
  origin: "session" | "run" | "journal" | "prediction";
}

export type InsightKind =
  | "peak-window"
  | "trend"
  | "night-share"
  | "app-focus"
  | "reopen"
  | "streak"
  | "progress";

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  tone: "info" | "good" | "warn";
  metric?: { value: string; label: string };
}

export interface PeakWindow {
  startHour: number;
  endHour: number;
  totalMs: number;
  sessionCount: number;
  share: number;
}

export interface AppBreakdown {
  app: string;
  category: Category;
  totalMs: number;
  sessions: number;
}

export interface Prediction {
  id: string;
  windowStartHour: number;
  windowStartMin: number;
  windowEndHour: number;
  windowEndMin: number;
  confidence: number;
  observedCount: number;
  averageSessionMs: number;
  primaryApp: string;
  /** Suggested reminder, typically 10 minutes before the window. */
  reminderHour: number;
  reminderMin: number;
  message: string;
}

export interface TriggerPattern {
  id: string;
  mood: Mood;
  moodLabel: string;
  app: string;
  averageMs: number;
  count: number;
  mostCommonAfter: Mood | null;
  chain: string;
  suggestion: string;
}

export interface JournalEntry {
  id: string;
  createdAt: number;
  moodBefore: Mood;
  app: string;
  category: Category;
  durationMs: number;
  moodAfter?: Mood | null;
  note?: string;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  via?: "llm" | "rules";
}

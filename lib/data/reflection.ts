export type ReflectionQuestionId =
  | "intention"
  | "awareness"
  | "time"
  | "purpose"
  | "mood"
  | "next"
  | "future";

export interface ReflectionOption {
  label: string;
  value: string;
}

export interface ReflectionQuestion {
  id: ReflectionQuestionId;
  prompt: string;
  options?: ReflectionOption[];
  /** Plain-number input (the "intended minutes" comparison question). */
  minutesInput?: {
    hint: string;
    comparison: (plannedMin: number, actualMs: number) => string;
  };
}

const actualMinLabel = (actualMs: number) =>
  Math.max(1, Math.round(actualMs / 60_000));

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "intention",
    prompt: "Why did you start scrolling?",
    options: [
      { label: "To relax", value: "relax" },
      { label: "To find something specific", value: "specific" },
      { label: "To chat / connect", value: "connect" },
      { label: "I was bored", value: "bored" },
      { label: "I don't remember", value: "forgot" },
    ],
  },
  {
    id: "awareness",
    prompt: "Do you still want to continue scrolling?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "time",
    prompt: "How long did you intend to scroll when you started?",
    minutesInput: {
      hint: "minutes",
      comparison: (plannedMin, actualMs) =>
        `You planned ${plannedMin} minute${plannedMin === 1 ? "" : "s"}. This one ran you ${actualMinLabel(actualMs)} minute${actualMinLabel(actualMs) === 1 ? "" : "s"}.`,
    },
  },
  {
    id: "purpose",
    prompt: "Did you find what you came here for?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
      { label: "I forgot what I came for", value: "forgot" },
    ],
  },
  {
    id: "mood",
    prompt: "How do you feel after this session?",
    options: [
      { label: "Better", value: "better" },
      { label: "Same", value: "same" },
      { label: "More tired", value: "tired" },
      { label: "Bored", value: "bored" },
      { label: "Stressed", value: "stressed" },
      { label: "I feel like I wasted my time", value: "wasted" },
    ],
  },
  {
    id: "next",
    prompt: "Before you continue, what do you actually want to do?",
    options: [
      { label: "Continue scrolling", value: "scroll" },
      { label: "Take a 5-minute break", value: "break" },
      { label: "Close the app", value: "close" },
      { label: "Do something else", value: "other" },
    ],
  },
  {
    id: "future",
    prompt:
      "If you continue scrolling for another 30 minutes, will you be okay with that?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
];

export function pickReflectionSession(
  minQuestions = 1,
  maxQuestions = 3,
): ReflectionQuestion[] {
  const pool = [...REFLECTION_QUESTIONS];
  const count = minQuestions + Math.floor(Math.random() * (maxQuestions - minQuestions + 1));
  const picked: ReflectionQuestion[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

const LOG_KEY = "scrolldictive.reflection.v1";
const LOG_CAP = 500;

export interface ReflectionLogEntry {
  at: number;
  questionId: ReflectionQuestionId;
  answer: string;
  actualMs: number;
}

export function logReflectionAnswer(
  questionId: ReflectionQuestionId,
  answer: string,
  actualMs: number,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const log: ReflectionLogEntry[] = raw
      ? (JSON.parse(raw) as ReflectionLogEntry[])
      : [];
    log.push({ at: Date.now(), questionId, answer, actualMs });
    while (log.length > LOG_CAP) log.shift();
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    // Storage unavailable — answers stay in the session only.
  }
}

export function loadReflectionLog(): ReflectionLogEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as ReflectionLogEntry[]) : [];
  } catch {
    return [];
  }
}

function labelFor(id: ReflectionQuestionId, value: string): string {
  const q = REFLECTION_QUESTIONS.find((x) => x.id === id);
  if (!q) return value;
  if (q.minutesInput) return `${value} min`;
  const opt = q.options?.find((o) => o.value === value);
  return opt?.label ?? value;
}

function tally(
  log: ReflectionLogEntry[],
  id: ReflectionQuestionId,
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of log) {
    if (e.questionId !== id) continue;
    const label = labelFor(id, e.answer);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export interface ReflectionStats {
  checkins: number;
  intentions: { label: string; count: number }[];
  moods: { label: string; count: number }[];
  reluctantPct: number | null;
  wastedMoodPct: number | null;
  chooseScrollPct: number | null;
  time: { plannedAvg: number; actualAvg: number; count: number } | null;
}

export function analyzeReflections(log: ReflectionLogEntry[]): ReflectionStats {
  const pressure = (id: ReflectionQuestionId, wanted: string[]) => {
    const total = log.filter((e) => e.questionId === id).length;
    if (total === 0) return null;
    const hits = log.filter(
      (e) => e.questionId === id && wanted.includes(e.answer),
    ).length;
    return Math.round((hits / total) * 100);
  };

  const timeEntries = log
    .filter((e) => e.questionId === "time")
    .map((e) => ({ planned: Number(e.answer), actual: e.actualMs }))
    .filter((e) => Number.isFinite(e.planned) && e.planned >= 0);

  const time =
    timeEntries.length > 0
      ? {
          plannedAvg:
            timeEntries.reduce((s, e) => s + e.planned, 0) / timeEntries.length,
          actualAvg:
            timeEntries.reduce((s, e) => s + e.actual, 0) /
            timeEntries.length /
            60_000,
          count: timeEntries.length,
        }
      : null;

  return {
    checkins: new Set(log.map((e) => Math.floor(e.at / 120_000))).size,
    intentions: tally(log, "intention"),
    moods: tally(log, "mood"),
    reluctantPct: pressure("awareness", ["no"]),
    wastedMoodPct: pressure("mood", ["wasted"]),
    chooseScrollPct: pressure("next", ["scroll"]),
    time,
  };
}
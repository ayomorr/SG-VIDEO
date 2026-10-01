import { loadRecentPrompts, rememberPrompts } from "@/lib/data/goals";

export type ReflectionQuestionId =
  | "intention"
  | "awareness"
  | "time"
  | "purpose"
  | "mood"
  | "next"
  | "future"
  | "goal-align"
  | "goal-swap"
  | "goal-tradeoff"
  | "goal-remind"
  | "goal-habit";

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
  /** The monthly goal this question was generated from, if any. */
  goal?: string;
}

/** Personalisation context for goal-generated questions. */
export interface GoalContext {
  name?: string;
  goals?: string[];
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

function shuffled<T>(items: T[]): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/** Goals are quoted, so the user's own wording survives into the question. */
function quoteGoal(goal: string): string {
  return `"${goal.replace(/["“”]/g, "").trim()}"`;
}

/**
 * Builds the goal-aware half of the question bank from the current month's
 * goals. Only the current month is ever passed in — nothing reads history here.
 *
 * Each goal gets several phrasings of the same idea so the bank doesn't feel
 * like one sentence with the goal swapped in.
 */
export function buildGoalQuestions(ctx?: GoalContext): ReflectionQuestion[] {
  const goals = (ctx?.goals ?? []).map((g) => g.trim()).filter(Boolean);
  const name = ctx?.name?.trim();
  if (goals.length === 0) return [];

  const pickFrom = <T,>(options: T[]): T =>
    options[Math.floor(Math.random() * options.length)];

  const alignPrompts = (goal: string): string[] => [
    `You said ${quoteGoal(goal)} is one of your goals this month. Is this scroll getting you closer to it, or pulling you away?`,
    `Before you go back${name ? `, ${name}` : ""} — is scrolling right now helping with ${quoteGoal(goal)}, or getting in its way?`,
    `Quick one: does this session move ${quoteGoal(goal)} forward, or hold it back?`,
  ];
  const swapPrompts = (goal: string): string[] => [
    `What could you do in the next 15 minutes that moves ${quoteGoal(goal)} forward?`,
    `If the next 15 minutes were yours to spend, what would you do for ${quoteGoal(goal)}?`,
  ];
  const tradeoffPrompts = (goal: string): string[] => [
    `If you keep scrolling for another 30 minutes, will you be happy with the time that costs ${quoteGoal(goal)}?`,
    `30 more minutes here is 30 minutes not spent on ${quoteGoal(goal)}. Okay with that?`,
  ];

  const questions: ReflectionQuestion[] = [];
  // Spread across goals so one long goal can't crowd the bank out.
  for (const goal of shuffled(goals).slice(0, 3)) {
    questions.push({
      id: "goal-align",
      goal,
      prompt: pickFrom(alignPrompts(goal)),
      options: [
        { label: "Getting closer", value: "closer" },
        { label: "Pulling me away", value: "away" },
        { label: "Honestly, not sure", value: "unsure" },
      ],
    });

    if (Math.random() < 0.5) {
      questions.push({
        id: "goal-swap",
        goal,
        prompt: pickFrom(swapPrompts(goal)),
        options: [
          { label: "Start one small step", value: "start" },
          { label: "Decide when I'll do it", value: "schedule" },
          { label: "Something else right now", value: "other" },
        ],
      });
    } else {
      questions.push({
        id: "goal-tradeoff",
        goal,
        prompt: pickFrom(tradeoffPrompts(goal)),
        options: [
          { label: "Yes, that's fine", value: "yes" },
          { label: "No, I'd rather not", value: "no" },
        ],
      });
    }
  }

  questions.push({
    id: "goal-remind",
    prompt: `${name ? `${name}, ` : ""}of your goals this month, which one is closest to done?`,
    options: goals.slice(0, 5).map((goal, index) => ({
      label: goal,
      value: `g${index}`,
    })),
  });

  if (name) {
    questions.push({
      id: "goal-habit",
      prompt: pickFrom([
        `Quick check-in, ${name}: are you scrolling because you chose to, or because you lost track of time?`,
        `${name}, honest one — did you choose this scroll, or did it just happen to you?`,
      ]),
      options: [
        { label: "I chose to", value: "chose" },
        { label: "Habit", value: "habit" },
        { label: "Not sure", value: "unsure" },
      ],
    });
  }

  return questions;
}

function takeRandom(pool: ReflectionQuestion[]): ReflectionQuestion | undefined {
  if (pool.length === 0) return undefined;
  return pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
}

/**
 * Draws at least `minQuestions` from the combined bank: the original questions
 * plus the ones generated from this month's goals. Prompts asked recently are
 * held back so the same thing doesn't land twice in a row.
 */
export function pickReflectionSession(
  minQuestions = 1,
  maxQuestions = 3,
  ctx?: GoalContext,
): ReflectionQuestion[] {
  const goalQuestions = buildGoalQuestions(ctx);
  const bank = [...REFLECTION_QUESTIONS, ...goalQuestions];
  const recent = loadRecentPrompts();
  // Hold back everything asked recently. `rememberPrompts` stores newest-first,
  // so the head of the list is the most recent round.
  //
  // The holdback is capped at `bank.length - minQuestions`. That cap is what makes
  // an aggressive holdback safe: a user with no goals has a bank of only seven
  // original questions, so holding all of them would leave nothing to ask and
  // `count` would silently land under the minimum. Bounding the holdback at
  // `bank.length - minQuestions` guarantees the minimum is always serviceable
  // while holding back everything whenever the bank is big enough to afford it.
  const maxHoldBack = Math.max(0, bank.length - minQuestions);
  const holdBack = recent.slice(0, maxHoldBack);
  const unseen = bank.filter((q) => !holdBack.includes(q.prompt));
  const pool = unseen.length > 0 ? [...unseen] : [...bank];

  const span = Math.max(1, maxQuestions - minQuestions + 1);
  const count = Math.min(
    minQuestions + Math.floor(Math.random() * span),
    pool.length,
  );
  const picked: ReflectionQuestion[] = [];

  // When goals exist, lean on them — otherwise the personalisation is invisible.
  if (goalQuestions.length > 0 && pool.length > 0 && Math.random() < 0.7) {
    const freshGoal = goalQuestions.find((g) => !holdBack.includes(g.prompt));
    const seed = freshGoal ?? goalQuestions[0];
    const at = pool.findIndex((q) => q.prompt === seed.prompt);
    if (at !== -1) picked.push(pool.splice(at, 1)[0]);
  }

  while (picked.length < count) {
    const next = takeRandom(pool);
    if (!next) break;
    picked.push(next);
  }

  rememberPrompts(picked.map((q) => q.prompt));
  return picked;
}

const LOG_KEY = "scrolldictive.reflection.v1";
const LOG_CAP = 500;

export interface ReflectionLogEntry {
  at: number;
  questionId: ReflectionQuestionId;
  answer: string;
  actualMs: number;
  /** The monthly goal behind a generated question, when there was one. */
  goal?: string;
}

export function logReflectionAnswer(
  questionId: ReflectionQuestionId,
  answer: string,
  actualMs: number,
  goal?: string,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const log: ReflectionLogEntry[] = raw
      ? (JSON.parse(raw) as ReflectionLogEntry[])
      : [];
    log.push({ at: Date.now(), questionId, answer, actualMs, goal });
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
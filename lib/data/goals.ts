/**
 * Monthly goal store.
 *
 * Goals are deliberately month-scoped: `months` holds one list per `YYYY-MM`
 * key so a new calendar month arrives with no goals of its own, which is what
 * triggers the "it's a new month" review in the onboarding gate. The profile
 * name is the only long-lived field.
 */

export interface GoalProfile {
  name: string;
  months: Record<string, string[]>;
}

export const MIN_GOALS = 1;
export const MAX_GOALS = 5;

const PROFILE_KEY = "scrolldictive.profile.v1";
// A round now asks 4-5 questions, so the memory has to span several rounds to be
// worth anything: 20 covers about four. `pickReflectionSession` caps the holdback
// at `bank.length - minQuestions`, so a memory larger than the bank degrades to
// holding back the whole bank minus the minimum rather than starving the picker.
const RECENT_CAP = 20;

const listeners = new Set<() => void>();
const editListeners = new Set<() => void>();

function emptyProfile(): GoalProfile {
  return { name: "", months: {} };
}

/** Local-time month key. Never UTC — a UTC key would roll over at the wrong hour. */
export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const parsed = Number(year) * 100 + Number(month);
  // `Number(null) === 0`, so a malformed key would silently become January 2000.
  if (!Number.isFinite(parsed) || !year || !month) return "this month";
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long" });
}

export function previousMonthKey(key: string): string {
  const [year, month] = key.split("-");
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return key;
  const date = new Date(y, m - 2, 1);
  return monthKey(date);
}

function read(): GoalProfile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<GoalProfile>;
    const months: Record<string, string[]> = {};
    if (parsed.months && typeof parsed.months === "object") {
      for (const [key, value] of Object.entries(parsed.months)) {
        if (Array.isArray(value)) months[key] = value.map((g) => String(g));
      }
    }
    return { name: typeof parsed.name === "string" ? parsed.name : "", months };
  } catch {
    return emptyProfile();
  }
}

function write(profile: GoalProfile): GoalProfile {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Private mode / quota — the session keeps working without persistence.
    }
  }
  listeners.forEach((listener) => listener());
  return profile;
}

/** Trims, drops blanks, de-dupes case-insensitively and caps at MAX_GOALS. */
export function normalizeGoals(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= MAX_GOALS) break;
  }
  return out;
}

export function loadGoalProfile(): GoalProfile {
  return read();
}

export function goalsForMonth(key: string = monthKey()): string[] {
  return normalizeGoals(read().months[key] ?? []);
}

export function saveGoals(
  goals: string[],
  key: string = monthKey(),
): GoalProfile {
  const profile = read();
  const clean = normalizeGoals(goals);
  return write({ ...profile, months: { ...profile.months, [key]: clean } });
}

/** Saves the name and the current month's goals in one write. */
export function saveProfile(name: string, goals: string[]): GoalProfile {
  const profile = read();
  const key = monthKey();
  const clean = normalizeGoals(goals);
  return write({
    name: name.trim().slice(0, 40),
    months: { ...profile.months, [key]: clean },
  });
}

export function onProfileChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The Overview card asks the gate to reopen the editor. */
export function requestGoalEdit(): void {
  editListeners.forEach((listener) => listener());
}

export function onGoalEditRequest(listener: () => void): () => void {
  editListeners.add(listener);
  return () => editListeners.delete(listener);
}

/**
 * Keeps the last few asked prompts so the picker can avoid asking the same
 * thing twice in a row. Stores prompts, not ids, because generated goal
 * questions reuse a small id set.
 */
const RECENT_KEY = "scrolldictive.reflection.recent.v1";

export function loadRecentPrompts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((p) => String(p)) : [];
  } catch {
    return [];
  }
}

export function rememberPrompts(prompts: string[]): void {
  if (typeof window === "undefined" || prompts.length === 0) return;
  try {
    const merged = [...prompts, ...loadRecentPrompts()].slice(0, RECENT_CAP);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(merged));
  } catch {
    // Non-fatal: worst case one question repeats.
  }
}
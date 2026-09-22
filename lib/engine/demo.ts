import type { Mood, Session } from "@/lib/engine/types";
import { APP_CATALOG } from "@/lib/engine/catalog";
import { uuid } from "@/lib/engine/format";

export const STORAGE_KEY = "scrolldictive.sessions.v1";

export function buildHasSeededDemo(): boolean {
  return Boolean(
    typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY),
  );
}

/** Deterministic PRNG so the demo dataset is stable across reloads. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function weightedApp(rng: () => number) {
  // Heavier weight on high-pull feeds so the demo looks like real doomscrolling.
  const pool = APP_CATALOG;
  const weights = pool.map((app) => 0.4 + app.feedPull);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[0];
}

const MOODS_BEFORE: Mood[] = [
  "bored",
  "bored",
  "tired",
  "stressed",
  "restless",
  "anxious",
  "curious",
  "okay",
  "good",
];

const MOOD_AFTER: Mood[] = ["tired", "tired", "okay", "good", "restless", "anxious"];

function demoMoodBefore(rng: () => number): Mood | null {
  return rng() < 0.35 ? pick(rng, MOODS_BEFORE) : null;
}

function demoMoodAfter(rng: () => number): Mood | null {
  return rng() < 0.28 ? pick(rng, MOOD_AFTER) : null;
}

export function generateDemoSessions(): Session[] {
  const rng = mulberry32(20260922);
  const sessions: Session[] = [];

  const now = Date.now();
  const DAYS = 14;

  for (let dayOffset = DAYS - 1; dayOffset >= 1; dayOffset--) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - dayOffset);
    const base = dayStart.getTime();

    // Weekend days behave a little differently.
    const weekday = dayStart.getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    const morningBlocks = isWeekend ? (rng() < 0.7 ? 1 : 2) : rng() < 0.4 ? 1 : 0;
    const afternoonBlocks = isWeekend ? 2 : rng() < 0.65 ? 1 : 0;
    const eveningBlocks = 2 + (rng() < 0.5 ? 1 : 0);

    const blocks = [
      ...Array.from({ length: morningBlocks }, () => ({
        startHour: 7 + Math.floor(rng() * 2),
        startMin: Math.floor(rng() * 60),
        count: 1,
        lastNight: false,
      })),
      ...Array.from({ length: afternoonBlocks }, () => ({
        startHour: 13 + Math.floor(rng() * 4),
        startMin: Math.floor(rng() * 60),
        count: 1,
        lastNight: false,
      })),
      ...Array.from({ length: eveningBlocks }, () => ({
        startHour: 20 + Math.floor(rng() * 3),
        startMin: Math.floor(rng() * 60),
        count: 1,
        lastNight: false,
      })),
    ];

    // Occasional true late-night spirals.
    if (rng() < 0.4) {
      blocks.push({
        startHour: 22 + Math.floor(rng() * 2),
        startMin: Math.floor(rng() * 60),
        count: 1,
        lastNight: true,
      });
    }

    for (const block of blocks) {
      const startAt = base + (block.startHour * 60 + block.startMin) * 60_000;
      const isChain = block.lastNight || rng() < 0.5;
      const chainLength = isChain ? 2 + Math.floor(rng() * 3) : 1;

      let cursor = startAt;
      for (let i = 0; i < chainLength; i++) {
        const def = weightedApp(rng);
        const baseMs = 4 + Math.floor(rng() * 24);
        const durationMs =
          baseMs * 60_000 +
          (def.feedPull > 0.8 ? Math.floor(rng() * 12) * 60_000 : 0);
        const endAt = Math.min(cursor + durationMs, base + 24 * 60 * 60_000);

        if (endAt - cursor < 60_000) break;

        sessions.push({
          id: uuid(),
          app: def.name,
          category: def.category,
          startAt: cursor,
          endAt,
          moodBefore: i === 0 ? demoMoodBefore(rng) : null,
          moodAfter: i === chainLength - 1 ? demoMoodAfter(rng) : null,
          note: undefined,
          source: "seed",
        });

        cursor =
          endAt + (i < chainLength - 1 ? 30_000 + Math.floor(rng() * 60_000) : 0);
      }
    }
  }

  // Sort chronologically.
  return sessions.sort((a, b) => a.startAt - b.startAt);
}
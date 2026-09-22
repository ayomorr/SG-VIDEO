import type {
  JournalEntry,
  Mood,
  Session,
  TriggerPattern,
} from "@/lib/engine/types";
import { MOOD_LABELS, alternativeFor } from "@/lib/engine/catalog";
import { formatDuration, uuid } from "@/lib/engine/format";

function moodOccurrences(sessions: Session[]): Record<Mood, number> {
  const counts = {} as Record<Mood, number>;
  for (const s of sessions) {
    if (s.moodBefore) counts[s.moodBefore] = (counts[s.moodBefore] ?? 0) + 1;
  }
  return counts;
}

/** Top pre-scroll moods, ranked by how much time they tend to cost. */
export function topMoodCost(sessions: Session[]): {
  mood: Mood;
  label: string;
  sessions: number;
  totalMs: number;
}[] {
  const map = new Map<Mood, { sessions: number; totalMs: number }>();
  for (const s of sessions) {
    if (!s.moodBefore) continue;
    const entry = map.get(s.moodBefore) ?? { sessions: 0, totalMs: 0 };
    entry.sessions += 1;
    entry.totalMs += Math.max(0, s.endAt - s.startAt);
    map.set(s.moodBefore, entry);
  }
  return Array.from(map.entries())
    .map(([mood, value]) => ({
      mood,
      label: MOOD_LABELS[mood],
      sessions: value.sessions,
      totalMs: value.totalMs,
    }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 4);
}

/**
 * Detect trigger patterns: pre-scroll mood + app → session length → post mood.
 * Suggests a healthier alternative for the dominant feeling.
 */
export function detectTriggers(sessions: Session[]): TriggerPattern[] {
  const withMood = sessions.filter((s) => s.moodBefore);
  if (withMood.length < 3) return [];

  const groups = new Map<
    string,
    { mood: Mood; app: string; durations: number[]; after: (Mood | null)[] }
  >();
  for (const s of withMood) {
    if (!s.moodBefore) continue;
    const key = `${s.moodBefore}::${s.app}`;
    const group = groups.get(key) ?? {
      mood: s.moodBefore,
      app: s.app,
      durations: [],
      after: [],
    };
    group.durations.push(Math.max(0, s.endAt - s.startAt));
    group.after.push(s.moodAfter ?? null);
    groups.set(key, group);
  }

  const patterns = Array.from(groups.values())
    .filter((group) => group.durations.length >= 1)
    .map((group) => {
      const averageMs =
        group.durations.reduce((sum, ms) => sum + ms, 0) / group.durations.length;
      const afterCount = new Map<Mood, number>();
      for (const mood of group.after) {
        if (mood) afterCount.set(mood, (afterCount.get(mood) ?? 0) + 1);
      }
      const mostCommonAfter =
        Array.from(afterCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const moodLabel = MOOD_LABELS[group.mood];
      const afterLabel = mostCommonAfter ? MOOD_LABELS[mostCommonAfter] : null;
      const chain = `${moodLabel} → ${group.app} → ${formatDuration(averageMs)}${
        afterLabel ? ` → ${afterLabel}` : ""
      }`;

      return {
        id: uuid(),
        mood: group.mood,
        moodLabel,
        app: group.app,
        averageMs: Math.round(averageMs),
        count: group.durations.length,
        mostCommonAfter,
        chain,
        suggestion: alternativeFor(group.mood, 2).join(". "),
      };
    })
    .sort((a, b) => b.count * (b.averageMs / 60_000) - a.count * (a.averageMs / 60_000))
    .slice(0, 8);

  return patterns;
}

/** Sessions + journal entries combine into a flat list for the Triggers tab. */
export function journalFromSessions(sessions: Session[]): JournalEntry[] {
  return sessions
    .filter((s) => s.moodBefore || s.note)
    .map((s) => ({
      id: s.id,
      createdAt: s.startAt,
      moodBefore: s.moodBefore ?? ("okay" as Mood),
      app: s.app,
      category: s.category,
      durationMs: Math.max(0, s.endAt - s.startAt),
      moodAfter: s.moodAfter ?? null,
      note: s.note,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export { moodOccurrences };
import type { CoachMessage, TriggerPattern } from "@/lib/engine/types";
import { MOOD_LABELS, alternativeFor } from "@/lib/engine/catalog";
import { formatDuration } from "@/lib/engine/format";

export interface CoachInput {
  messages: { role: "user" | "assistant"; content: string }[];
  context?: string;
  triggers?: TriggerPattern[];
}

export interface CoachResult {
  reply: string;
  via: "rules";
}

function greetingReply(): string {
  return `Hey — I'm here, and I'm not here to judge a single minute of it.\n\nTell me what's pulling you in right now. Bored? Switched off? "Just one more rewatch"? Name it, and we'll pick the shortest possible ask — a 5-minute break, not a life overhaul.`;
}

function boredReply(triggers: TriggerPattern[]): string {
  const bored = triggers.find((t) => t.mood === "bored");
  const line = bored
    ? `It's a familiar one for you: "${bored.chain}." That usually costs you about ${formatDuration(
        bored.averageMs,
      )}.`
    : "";
  const alternatives = (triggers.find((t) => t.mood === "bored")?.suggestion ??
    alternativeFor("bored", 3).join(". ")) as string;
  return `Boredom is the #1 door into a scroll loop — ${line}\n\nWhen that itch starts, borrow 5 minutes, not 50:\n\n- ${alternatives.replace(/\n/g, "\n- ")}\n\nWant me to check back with you in 5 minutes?`;
}

function urgeReply(
  triggers: TriggerPattern[],
  context?: string,
): string {
  const contextLine = context
    ? `\n\n(Heads up: ${context.trim().replace(/\.$/, "")} — so I'd rather we talk first.)`
    : "";
  const line = triggers.length
    ? `Your logs show the usual suspects: ${triggers
        .slice(0, 2)
        .map((t) => t.app)
        .join(" and ")}.`
    : "";
  return `That urge to open the feed is a real feeling — it just tends to be a loop, not a need.${line}${contextLine}\n\nWhat if we try the 3-3-3 instead: 3 breaths, 3 steps, 3 words to someone in the room. Then, if it still matters in 5 minutes, you can always come back. Still want it? I'm not the boss of you — you are.`;
}

function whyReply(triggers: TriggerPattern[]): string {
  if (triggers.length === 0) {
    return `Usually it's not the app — it's the moment you're in. The feed is just the fastest way to stop sitting with it.\n\nKeep logging how you feel before you open a feed for a couple of days, and I'll be able to tell you your exact pattern (mood → app → how long → mood after).`;
  }
  const t = triggers[0];
  return `Looking at your own logs, here's the loop that shows up most:\n\n- **${t.moodLabel}** is when you reach for the phone\n- It tends to become **${t.app}** (avg ${formatDuration(
    t.averageMs,
  )} per session, ${t.count} times in your data)\n- And you usually end up **${
    t.mostCommonAfter ? MOOD_LABELS[t.mostCommonAfter].toLowerCase() : "zoned out"
  }** afterward\n\nThat's not weakness, that's a pattern — and patterns can be interrupted. When ${t.moodLabel.toLowerCase()} shows up, what if the first move is a 60-second break, not a feed?`;
}

function stopReply(): string {
  return `Stopping "for real" is the wrong target — shrinking is plenty.\n\nShrink the first 5 minutes, not the rest of the evening.` +
    `\n\n- Set a 10-minute timer and tell yourself that's the ceiling for this session\n- Put the phone somewhere that requires standing up to reach it\n- If you catch yourself mid-scroll, say out loud: "reopen, not a need"` +
    `\n\nThe next 5 minutes are always the easiest to change.`;
}

function sleepReply(): string {
  return `Screen time right before bed is pushing your sleep later — late feeds are your longest ones.\n\nTry a "sundown rule" for the next 3 nights:` +
    `\n\n- Phone in another room (or on the other side of it) 30 minutes before bed\n- Same bedtime regardless of scroll guilt\n- Do a 1-minute wind-down: lights low, one slow drink of water\n\nThen check the trend in your insights and tell me how the mornings feel.`;
}

function thanksReply(): string {
  return `Anytime. The work is genuinely yours — I'm just the mirror with a timer.\n\nOne small thing for today: pick the single shortest scroll you can manage right now, and notice you did the choosing. That's the whole game.`;
}

function fallbackReply(lastUser: string): string {
  const alt = alternativeFor("bored", 3).join(", ");
  return `I hear that — "${lastUser.trim()}" isn't a small thing to sit with, but you don't have to solve it on the couch with a feed.\n\nFor the next five minutes, consider: ${alt}. And if you want, tell me what's really under it. No lecture, I promise.`;
}

export function coachReply(input: CoachInput): CoachResult {
  const { messages, context, triggers } = input;
  const lastUser = [...messages]
    .reverse()
    .find((m) => m.role === "user")?.content ?? "";
  const text = lastUser.toLowerCase();
  const triggerContext = triggers ?? [];

  let reply: string;
  if (/\b(hi|hey|hello|yo|sup)\b/.test(text) && text.length < 25) {
    reply = greetingReply();
  } else if (/(bored|nothing to do|boring)/.test(text)) {
    reply = boredReply(triggerContext);
  } else if (
    /(can'?t stop|cant stop|keep scrolling|again|relapse|back to the feed)/.test(text)
  ) {
    reply = urgeReply(triggerContext, context);
  } else if (
    /(why|tell me).*(scroll|use|feed|phone)|why do i|explain/i.test(text)
  ) {
    reply = whyReply(triggerContext);
  } else if (/(stop|quit|how do i|help me|tips?|advice)/.test(text)) {
    reply = stopReply();
  } else if (/(sleep|bed|late|night|insomnia|tired)/.test(text)) {
    reply = sleepReply();
  } else if (/(thank|thanks|thx|appreciate)/.test(text)) {
    reply = thanksReply();
  } else if (/(scroll|feed|app|pick up|phone)/.test(text)) {
    reply = urgeReply(triggerContext, context);
  } else {
    reply = fallbackReply(lastUser);
  }

  return { reply, via: "rules" };
}

/** Builds the compact context summary sent to the LLM / used by rules. */
export function buildContextSummary(
  sessions: { app: string; startAt: number; endAt: number }[],
): string {
  const now = Date.now();
  const week = sessions.filter((s) => now - s.startAt <= 7 * 24 * 60 * 60_000);
  const total = week.reduce((sum, s) => sum + Math.max(0, s.endAt - s.startAt), 0);
  const lateNight = week.filter((s) => {
    const hour = new Date(s.startAt).getHours();
    return hour >= 21 || hour < 5;
  });
  const topApp = (() => {
    const map = new Map<string, number>();
    for (const s of week) map.set(s.app, (map.get(s.app) ?? 0) + Math.max(0, s.endAt - s.startAt));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();
  const parts: string[] = [];
  if (total > 0) parts.push(`${formatDuration(total)} of scrolling in the last 7 days`);
  if (topApp) parts.push(`mostly in ${topApp}`);
  if (lateNight.length > 0) parts.push(`${lateNight.length} sessions started after 9 PM`);
  return parts.length ? `${parts.join(", ")}.` : "No recent scroll data.";
}

export type { CoachMessage };
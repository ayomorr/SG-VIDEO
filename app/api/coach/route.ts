import { NextResponse } from "next/server";
import {
  buildContextSummary,
  coachReply,
  type CoachProfile,
} from "@/lib/engine/coach";
import { isLlmConfigured, llmReply } from "@/lib/ai/llm";

interface RequestBody {
  messages?: { role?: string; content?: string }[];
  context?: string;
  profile?: CoachProfile;
}

const SYSTEM_PROMPT = [
  "You are the accountability companion inside Scroll Detect, a gentle anti-doomscrolling app.",
  "You are NOT a therapist or medical advisor.",
  "Be warm, honest, non-judgmental, and concise. Most replies should be 2-4 short lines.",
  "Ground replies in the user's real habits when context is provided.",
  "Suggest small, doable 5-minute breaks and healthier alternatives, never shame.",
  "Never invent statistics about the user's actual screen time.",
  "End replies with a single micro-ask (one tiny action the user can take now).",
  "If a name is provided, use it naturally and sparingly — once or twice at most, not in every line.",
  "If goals for the current month are provided, connect your advice to them and ask what a small step toward one would be.",
  "Only ever use the goals listed for the current month. Never assume goals from other months still apply.",
  "Never shame, guilt-trip, threaten, or moralize. Be honest and a little challenging, like a friend who respects you.",
  "You are an assistant, not a human. Don't claim human experiences or feelings.",
].join("\n");

/** Keeps the request honest about its own shape before it reaches a model. */
function readProfile(value: CoachProfile | undefined): CoachProfile {
  const name = typeof value?.name === "string" ? value.name.trim().slice(0, 40) : "";
  const goals = Array.isArray(value?.goals)
    ? value.goals
        .map((g) => (typeof g === "string" ? g.trim() : ""))
        .filter(Boolean)
        .slice(0, 5)
    : [];
  const monthName =
    typeof value?.monthName === "string" ? value.monthName.slice(0, 20) : undefined;
  return { name, goals, monthName };
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m): m is { role: "user" | "assistant"; content: string } =>
            Boolean(m) &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0,
        )
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  if (messages.length === 0) {
    return NextResponse.json({ ok: false, error: "No message." }, { status: 400 });
  }

  // Cap what the API trusts to keep responses cheap and on-message.
  const recent = messages.slice(-12);
  const profile = readProfile(body.profile);
  const context = typeof body.context === "string" ? body.context : "";
  const summary = context || buildContextSummary([], profile);

  if (isLlmConfigured()) {
    const llmMessages = [
      { role: "system" as const, content: `${SYSTEM_PROMPT}\n\nRecent context:\n${summary}` },
      ...recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];
    const llm = await llmReply(llmMessages);
    if (llm) {
      return NextResponse.json({ ok: true, reply: llm, via: "llm" }, { status: 200 });
    }
  }

  const result = coachReply({ messages: recent, context: summary, profile });
  return NextResponse.json({ ok: true, ...result }, { status: 200 });
}
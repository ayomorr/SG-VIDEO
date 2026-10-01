"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachMessage, Session } from "@/lib/engine/types";
import { buildContextSummary } from "@/lib/engine/coach";
import { useGoalProfile } from "@/lib/hooks/use-goal-profile";
import { Card } from "@/components/dashboard/primitives";

const QUICK_PROMPTS = [
  "I'm bored",
  "I keep reopening the same app",
  "Why do I doomscroll?",
  "Help me sleep instead of scrolling",
  "I can't stop tonight",
  "What should I do about my goals?",
];

export function CoachTab({
  sessions,
  initialMessage,
}: {
  sessions: Session[];
  initialMessage?: string;
}) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState(initialMessage ?? "");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const profile = useGoalProfile();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const context = useMemo(
    () => buildContextSummary(sessions, {
      name: profile.name,
      goals: profile.goals,
      monthName: profile.monthName,
    }),
    // The profile is stable for a session; re-deriving on every goal edit is fine.
    [sessions, profile.name, profile.goals, profile.monthName],
  );

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setInput("");
    const history: CoachMessage[] = [
      ...messages,
      { id: `u-${Date.now()}`, role: "user", content, at: Date.now() },
    ];
    setMessages(history);
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context,
          profile: {
            name: profile.name,
            goals: profile.goals,
            monthName: profile.monthName,
          },
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        via?: "llm" | "rules";
        error?: string;
      };
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            data.reply ??
            data.error ??
            "Give me one more try — I'll think it through.",
          at: Date.now(),
          via: data.via,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "I hit a hiccup. Try again in a moment.",
          at: Date.now(),
          via: "rules",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-card">
        <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              Accountability companion
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.name
                ? `Here for you, ${profile.name} — honest, not bossy.`
                : "Here to be honest with you, not bossy with you."}
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Hey{profile.name ? `, ${profile.name}` : ""} — I can see your
                recent habits, so I&apos;ll reference what&apos;s actually true
                for you. {context}{" "}
                {sessions.length === 0
                  ? "Log a few sessions first so I have something real to work with."
                  : ""}
              </p>
              {profile.goals.length > 0 ? (
                <p>
                  I&apos;m also holding on to your {profile.monthName} goals, so
                  ask me what to do about them.
                </p>
              ) : null}
            </div>
          ) : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border/70 bg-background/60 text-foreground",
                )}
              >
                {m.content}
                {m.role === "assistant" ? (
                  <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {m.via === "llm" ? "AI-powered" : "rules engine"}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/70 bg-background/60 px-4 py-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/70 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell them how you feel right now…"
              className="h-12 w-full rounded-full border border-border bg-background px-5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-all hover:bg-teal-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Quick prompts
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() => void send(prompt)}
                  className="w-full cursor-pointer rounded-xl border border-border/70 px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              You&apos;re only sending a short summary of your habits, your
              goals for the current month, and the last 12 messages. Add{" "}
              <code className="text-foreground">AI_API_KEY</code> to enable the
              full model instead of the built-in rules engine.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

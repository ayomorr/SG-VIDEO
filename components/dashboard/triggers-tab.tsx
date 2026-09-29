"use client";

import { useMemo, useState } from "react";
import { Brain, Trash2 } from "lucide-react";
import type { Session } from "@/lib/engine/types";
import { MOOD_LABELS } from "@/lib/engine/catalog";
import {
  detectTriggers,
  journalFromSessions,
  topMoodCost,
} from "@/lib/engine/triggers";
import { formatDuration, percent } from "@/lib/engine/format";
import { deleteSession } from "@/lib/data/store";
import { Card } from "@/components/dashboard/primitives";

export function TriggersTab({ sessions }: { sessions: Session[] }) {
  const triggers = useMemo(() => detectTriggers(sessions), [sessions]);
  const journal = useMemo(() => journalFromSessions(sessions), [sessions]);
  const moodCost = useMemo(() => topMoodCost(sessions), [sessions]);
  const [refresh, setRefresh] = useState(0);

  const maxCost = moodCost[0]?.totalMs ?? 1;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        {journal.length > 0 ? (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Journal
            </h3>
            <ul className="mt-4 grid gap-2 md:grid-cols-1">
              {journal.slice(0, 12).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/50 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {MOOD_LABELS[entry.moodBefore]} → {entry.app} →{" "}
                      {formatDuration(entry.durationMs)}
                      {entry.moodAfter ? ` → ${MOOD_LABELS[entry.moodAfter]}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteSession(entry.id);
                      setRefresh((v) => v + 1);
                    }}
                    aria-label="Delete entry"
                    className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        {triggers.length > 0 ? (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Your loops
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {triggers.map((trigger) => (
                <li key={trigger.id} className="rounded-xl border border-border/70 bg-background/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Brain className="h-4 w-4 text-lavender" aria-hidden="true" />
                    {trigger.chain}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Instead: {trigger.suggestion}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Feeling → feed → outcome
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Start logging a mood before each session. After a few entries, the
              engine will connect the dots — like &quot;bored → YouTube → 45
              min → tired&quot; — and suggest a healthier alternative for the
              feeling at the start.
            </p>
          </Card>
        )}

        {moodCost.length > 0 ? (
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Which feelings cost the most screen time
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {moodCost.map((item) => (
                <div key={item.mood}>
                  <div className="mb-1 flex items-center justify-between text-xs font-medium">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.sessions} session{item.sessions === 1 ? "" : "s"} ·{" "}
                      {formatDuration(item.totalMs)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-lavender to-focus transition-all duration-500"
                      style={{ width: `${percent(item.totalMs, maxCost)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      <span className="hidden">{refresh}</span>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/engine/types";
import { analyzeInsights } from "@/lib/engine/insights";
import {
  Card,
  TONE_ICONS,
  TONE_STYLES,
  Pill,
} from "@/components/dashboard/primitives";
import {
  type ReflectionStats,
  analyzeReflections,
  loadReflectionLog,
} from "@/lib/reflection";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function CheckInPulse({ stats }: { stats: ReflectionStats }) {
  const { checkins, intentions, moods, reluctantPct, wastedMoodPct, chooseScrollPct, time } =
    stats;

  if (checkins === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-14 text-center">
        <MessageCircleQuestion className="h-10 w-10 text-primary/60" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-foreground">
          No check-ins yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Answer the questions on the BREAK TIME screen a few times and your
          honest answers will start painting a picture here.
        </p>
      </Card>
    );
  }

  const biggestIntention = intentions[0];
  const topMood = moods[0];

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-focus/30 bg-focus/10 text-focus-400">
          <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h4 className="font-heading text-base font-semibold text-foreground">
            Your check-in pulse
          </h4>
          <p className="text-sm text-muted-foreground">
            From the questions you answer when the alarm rings.
          </p>
        </div>
        <div className="ml-auto shrink-0 text-right">
          <p className="font-heading text-2xl font-semibold text-foreground tabular-nums">
            {checkins}
          </p>
          <p className="text-xs text-muted-foreground">check-ins</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {biggestIntention ? (
          <Pill className="bg-primary/10 text-primary">
            Mostly “{biggestIntention.label.toLowerCase()}” ({biggestIntention.count})
          </Pill>
        ) : null}
        {reluctantPct !== null ? (
          <Pill className="bg-coral/10 text-coral">
            {reluctantPct}% didn&apos;t really want to keep scrolling
          </Pill>
        ) : null}
        {chooseScrollPct !== null ? (
          <Pill className="bg-lavender/10 text-lavender">
            {chooseScrollPct}% chose to scroll on
          </Pill>
        ) : null}
        {wastedMoodPct !== null && wastedMoodPct > 0 ? (
          <Pill className="bg-amber/10 text-amber">
            {wastedMoodPct}% left feeling they wasted time
          </Pill>
        ) : null}
        {time && time.count > 0 ? (
          <Pill className="bg-focus/10 text-focus-400">
            {time.count} planned {round1(time.plannedAvg)}m, actually went {round1(time.actualAvg)}m
          </Pill>
        ) : null}
      </div>

      {topMood ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Most common exit feeling:{" "}
          <span className="font-semibold text-foreground">{topMood.label}</span>.
          {topMood.label === "I feel like I wasted my time"
            ? " That's the loop talking — next time, that feeling is a cue to stop before you start."
            : " Good signal to check whether the reason you started is the reason you stayed."}
        </p>
      ) : null}

      {moods.length > 1 ? (
        <div className="mt-4 space-y-2">
          {moods.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">
                {m.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-focus"
                  style={{ width: `${Math.round((m.count / moods[0].count) * 100)}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                {m.count}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export function InsightsTab({ sessions }: { sessions: Session[] }) {
  const insights = useMemo(() => analyzeInsights(sessions), [sessions]);
  const [reflectionStats, setReflectionStats] = useState<ReflectionStats | null>(null);

  useEffect(() => {
    setReflectionStats(analyzeReflections(loadReflectionLog()));
    const onFocus = () => setReflectionStats(analyzeReflections(loadReflectionLog()));
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (insights.length === 0 && !reflectionStats?.checkins) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Lightbulb className="h-10 w-10 text-primary/60" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-foreground">
          Not enough data yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Log a handful of scroll sessions — or answer the BREAK TIME questions
          — and the insight engine will surface peaks, trends, and high-pull
          apps.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {reflectionStats ? <CheckInPulse stats={reflectionStats} /> : null}

      {insights.length === 0 ? null : (
        <div className="grid gap-5">
          {insights.map((insight) => {
            const Icon = TONE_ICONS[insight.tone];
            return (
              <Card key={insight.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                        TONE_STYLES[insight.tone],
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-heading text-base font-semibold text-foreground">
                        {insight.title}
                      </h4>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {insight.body}
                      </p>
                    </div>
                  </div>
                  {insight.metric ? (
                    <div className="shrink-0 text-right">
                      <p className="font-heading text-2xl font-semibold text-foreground">
                        {insight.metric.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {insight.metric.label}
                      </p>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

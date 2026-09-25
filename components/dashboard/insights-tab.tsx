"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/engine/types";
import { analyzeInsights } from "@/lib/engine/insights";
import {
  Card,
  TONE_ICONS,
  TONE_STYLES,
} from "@/components/dashboard/primitives";

export function InsightsTab({ sessions }: { sessions: Session[] }) {
  const insights = useMemo(() => analyzeInsights(sessions), [sessions]);

  if (insights.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Lightbulb className="h-10 w-10 text-primary/60" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-foreground">
          Not enough data yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Log a handful of scroll sessions and the insight engine will surface
          peaks, trends, and high-pull apps.
        </p>
      </Card>
    );
  }

  return (
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
                  <p className="text-xs text-muted-foreground">{insight.metric.label}</p>
                </div>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

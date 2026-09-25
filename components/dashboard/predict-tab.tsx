"use client";

import { useMemo } from "react";
import { CalendarClock, Moon, Target } from "lucide-react";
import type { Session } from "@/lib/engine/types";
import { predictRisk } from "@/lib/engine/predict";
import { formatHour } from "@/lib/engine/format";
import {
  Card,
  ConfidenceBar,
  Pill,
} from "@/components/dashboard/primitives";

export function PredictTab({ sessions }: { sessions: Session[] }) {
  const predictions = useMemo(() => predictRisk(sessions), [sessions]);

  if (predictions.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <CalendarClock className="h-10 w-10 text-primary/60" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-foreground">
          No patterns to predict yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Once you have a couple of weeks of scroll data, the predictor will
          learn exactly when the risky windows tend to start.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {predictions.map((prediction, i) => (
        <Card key={prediction.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lavender/15 text-lavender">
                <Target className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {i === 0 ? "Most likely window" : "Secondary pattern"}
                </p>
                <h4 className="mt-1 font-heading text-lg font-semibold text-foreground">
                  {formatHour(prediction.windowStartHour, 0)} –{" "}
                  {formatHour(prediction.windowEndHour, 0)}
                </h4>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {prediction.message}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill className="bg-primary/10 text-primary">
                    ~{Math.round(prediction.averageSessionMs / 60_000)} min per run
                  </Pill>
                  <Pill className="bg-lavender/10 text-lavender">
                    Usually in {prediction.primaryApp}
                  </Pill>
                  <Pill className="bg-card">
                    Suggest reminder at {formatHour(prediction.reminderHour, prediction.reminderMin)}
                  </Pill>
                </div>
              </div>
            </div>
            <div className="w-full max-w-[200px] shrink-0">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Confidence</span>
                <span className="text-foreground">{prediction.confidence}%</span>
              </div>
              <ConfidenceBar value={prediction.confidence} />
            </div>
          </div>
        </Card>
      ))}

      <Card className="border-border/60">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5 text-lavender" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Predictions live entirely on your device. We never store your usage
            patterns anywhere else — the model is just your own history.
          </p>
        </div>
      </Card>
    </div>
  );
}

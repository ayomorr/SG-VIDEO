"use client";

import { useMemo, useState } from "react";
import { BellRing, ChevronRight, ShieldCheck, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BreakTimer, mmss } from "@/lib/hooks/use-break-timer";
import { goalsForMonth, loadGoalProfile, monthKey, monthLabel } from "@/lib/data/goals";
import {
  type ReflectionQuestion,
  logReflectionAnswer,
  pickReflectionSession,
} from "@/lib/data/reflection";

export function BreakReflection({ timer }: { timer: BreakTimer }) {
  const { durationMs, completeReflection } = timer;
  const [step, setStep] = useState(0);
  const [minutes, setMinutes] = useState("");
  const [doneCount, setDoneCount] = useState(0);

  // Read straight from storage rather than a hook: this modal mounts the
  // instant the alarm lands, before any state hook has hydrated, and a stale
  // empty profile would silently drop the goal questions.
  const session = useMemo(() => {
    const profile = loadGoalProfile();
    return pickReflectionSession(4, 5, {
      name: profile.name,
      goals: goalsForMonth(),
    });
  }, []);
  const name = useMemo(() => loadGoalProfile().name.trim(), []);
  const monthName = useMemo(() => monthLabel(monthKey()), []);

  const total = session.length;
  const question: ReflectionQuestion | undefined = session[step];
  const plannedMin = Number(minutes);

  const finish = () => {
    setDoneCount((n) => n + 1);
    completeReflection();
  };

  const advance = () => {
    if (step + 1 >= total) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const answerChoice = (value: string) => {
    if (!question) return;
    logReflectionAnswer(question.id, value, durationMs, question.goal);
    advance();
  };

  // Always advances. The typed number is a bonus, never a gate: this question
  // is optional, and an alarm that can't be dismissed is worse than a missing
  // answer. Rounds ask 4-5 questions, so this one lands often enough that a
  // hard stop here used to strand users with the alarm still ringing.
  const answerMinutes = () => {
    if (!question || !question.minutesInput) return;
    if (Number.isFinite(plannedMin) && plannedMin > 0) {
      logReflectionAnswer(question.id, String(plannedMin), durationMs);
    }
    advance();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-background/95 p-6 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Break reflection"
    >
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/80 p-7 shadow-card">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-coral/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-coral">
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            Break time
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {doneCount > 0
              ? "One second…"
              : `Question ${Math.min(step + 1, total)} of ${total}`}
          </span>
        </div>

        <p className="mt-5 font-heading text-3xl font-semibold leading-tight text-foreground">
          {name ? `Before you go back, ${name}.` : "Let's take a second."}{" "}
          You&apos;d been on the scroll for{" "}
          <span className="text-coral tabular-nums">{mmss(durationMs)}</span>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Answer before this alarm shuts up.
        </p>

        <div className="mt-7">
          {question ? (
            <>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {question.prompt}
              </h3>

              {question.goal ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Target className="h-3.5 w-3.5" aria-hidden="true" />
                  Your {monthName} goal
                </p>
              ) : null}

              {question.minutesInput ? (
                <div className="mt-5 space-y-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") answerMinutes();
                      }}
                      inputMode="numeric"
                      min={1}
                      placeholder="0"
                      aria-label={question.minutesInput.hint}
                      className="w-20 bg-transparent font-heading text-4xl font-semibold tabular-nums text-foreground outline-none"
                    />
                    <span className="text-sm text-muted-foreground">
                      {question.minutesInput.hint}
                    </span>
                  </label>

                  {Number.isFinite(plannedMin) && plannedMin > 0 ? (
                    <p className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-medium leading-relaxed text-primary">
                      {question.minutesInput.comparison(plannedMin, durationMs)}
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Optional — type how long you meant to scroll to see the
                      comparison, or just move on.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={answerMinutes}
                    className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95"
                  >
                    {step + 1 >= total ? "Done" : "Next"}
                  </button>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-2">
                  {question.options?.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => answerChoice(option.value)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      <span>{option.label}</span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-primary/50"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <ShieldCheck className="h-12 w-12 text-primary" aria-hidden="true" />
              <p className="mt-4 font-heading text-xl font-semibold text-foreground">
                Nice. That&apos;s real data.
              </p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                It&apos;ll quietly feed your Insights later.
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-center gap-1.5">
          {session.map((q, i) => (
            // Ids repeat across generated goal questions, prompts don't.
            <span
              key={q.prompt}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === step && !doneCount
                  ? "bg-primary"
                  : i < step || doneCount
                    ? "bg-muted"
                    : "bg-border",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
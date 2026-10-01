"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Plus, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_GOALS, MIN_GOALS } from "@/lib/data/goals";

export const NAME_PLACEHOLDER = "Tao";

/**
 * Faded examples offered as one-tap fills. All editable once they land.
 *
 * These are suggestions, not a default: nothing here is ever saved unless the
 * user taps it, and `MAX_GOALS` still caps what can be saved, so this list being
 * longer than the cap is deliberate.
 */
export const EXAMPLE_GOALS = [
  "Read 10 pages of a physical book a day",
  "30 minutes a day drawing, cooking, or crafting",
  "A 20-minute walk listening, no scrolling apps",
  "Talk to someone who matters, by call or text",
  "Plan the month ahead and write down the steps",
  "Pick one concrete step toward your work goals",
  "Complete my course",
  "Exercise regularly",
  "Read 2 books",
  "Spend more time with family",
];

/** Short forms for the faded placeholders, so the inputs stay readable. */
const EXAMPLE_HINTS = [
  "Read 10 pages of a physical book a day",
  "30 minutes drawing, cooking, or crafting",
  "A 20-minute walk, no apps",
  "Talk to someone who matters",
  "Plan the month ahead",
  "One step toward your work goals",
];

export function OnboardingName({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const trimmed = name.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        A nickname works best — I&apos;ll use it instead of your full name.
      </p>
      <input
        ref={ref}
        type="text"
        value={name}
        maxLength={40}
        placeholder={NAME_PLACEHOLDER}
        aria-label="What should I call you?"
        onChange={(e) => setName(e.target.value)}
        className="mt-5 h-14 w-full rounded-2xl border border-border/70 bg-background px-5 font-heading text-lg text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/60"
      />
      <button
        type="submit"
        disabled={!trimmed}
        className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

export function OnboardingGoals({
  monthName,
  name,
  initialGoals,
  submitLabel,
  onSubmit,
}: {
  monthName: string;
  /** Used in the greeting. Empty on first run, before the name is known. */
  name: string;
  /** Prefill, e.g. last month's goals when reviewing a new month. */
  initialGoals: string[];
  submitLabel: string;
  onSubmit: (goals: string[]) => void;
}) {
  const [goals, setGoals] = useState<string[]>(() => {
    const seeded = initialGoals.filter(Boolean).slice(0, MAX_GOALS);
    return seeded.length > 0 ? seeded : [""];
  });
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const filled = goals.filter((g) => g.trim().length > 0).length;
  const canSubmit = filled >= MIN_GOALS;

  const setGoal = (index: number, value: string) => {
    setGoals((prev) => prev.map((g, i) => (i === index ? value : g)));
  };

  const removeGoal = (index: number) => {
    setGoals((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const addGoal = () => {
    setGoals((prev) => (prev.length >= MAX_GOALS ? prev : [...prev, ""]));
  };

  /** Examples fill the first empty slot so nothing already typed is lost. */
  const fillExample = (example: string) => {
    setGoals((prev) => {
      const emptyAt = prev.findIndex((g) => g.trim().length === 0);
      if (emptyAt === -1) {
        return prev.length >= MAX_GOALS ? prev : [...prev, example];
      }
      const next = [...prev];
      next[emptyAt] = example;
      return next;
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(goals);
      }}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        {name
          ? `Nice to meet you, ${name}. What are you hoping to accomplish in ${monthName}?`
          : `What are you hoping to accomplish in ${monthName}?`}
      </p>

      <ul className="mt-5 space-y-2.5">
        {goals.map((goal, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              ref={index === 0 ? firstRef : undefined}
              type="text"
              value={goal}
              maxLength={120}
              placeholder={
                index < EXAMPLE_HINTS.length
                  ? EXAMPLE_HINTS[index]
                  : `Another goal for ${monthName}`
              }
              aria-label={`Goal ${index + 1}`}
              onChange={(e) => setGoal(index, e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  canSubmit &&
                  goals.length < MAX_GOALS
                ) {
                  e.preventDefault();
                  addGoal();
                }
              }}
              className="h-12 w-full rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-primary/60"
            />
            {goals.length > 1 ? (
              <button
                type="button"
                onClick={() => removeGoal(index)}
                aria-label={`Remove goal ${index + 1}`}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addGoal}
          disabled={goals.length >= MAX_GOALS}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add another
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">
          {filled}/{MAX_GOALS} goals
        </span>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer list-none text-xs text-muted-foreground transition-colors hover:text-primary">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Need ideas? Tap an example — you can edit it after
          </span>
        </summary>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {EXAMPLE_GOALS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => fillExample(example)}
              className={cn(
                "cursor-pointer rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground",
                "transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
              )}
            >
              {example}
            </button>
          ))}
        </div>
      </details>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {filled < MIN_GOALS ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          One goal is enough to get started.
        </p>
      ) : null}
    </form>
  );
}
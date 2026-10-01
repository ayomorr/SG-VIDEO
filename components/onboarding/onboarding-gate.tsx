"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Sparkles, Target, X } from "lucide-react";
import { LogoMark } from "@/components/logo";
import {
  OnboardingGoals,
  OnboardingName,
} from "@/components/onboarding/onboarding-steps";
import { useGoalProfile } from "@/lib/hooks/use-goal-profile";
import { onGoalEditRequest } from "@/lib/data/goals";

/**
 * Everything before the dashboard is reachable. Three shapes:
 *  - no name yet       -> first-run wizard (name, then goals)
 *  - name, no goals
 *    this month        -> "it's a new month" review, prefilled with the old ones
 *  - edit request from
 *    the Overview card -> name + goals in one pass, with a way out
 *
 * The name isn't written until goals are submitted, so a half-finished wizard
 * never leaves a name behind with no goals attached.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const profile = useGoalProfile();
  const [step, setStep] = useState<"name" | "goals">("name");
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    return onGoalEditRequest(() => {
      setDraftName(profile.name);
      setStep("goals");
      setEditing(true);
    });
  }, [profile.name]);

  if (!profile.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      </div>
    );
  }

  if (profile.complete && !editing) return <>{children}</>;

  // Someone with a name but no goals this month jumps straight to the review.
  const isFirstRun = !editing && profile.name.length === 0;
  const onNameStep = isFirstRun && step === "name";

  const save = (name: string, goals: string[]) => {
    profile.saveProfile(name, goals);
    setEditing(false);
    setStep("name");
  };

  const heading = onNameStep
    ? "Hey! Before we get started, what should I call you?"
    : isFirstRun
      ? `What are you hoping to accomplish in ${profile.monthName}?`
      : editing
        ? `${profile.monthName} goals`
        : `It\u2019s a new month, ${profile.name}. What are your goals for ${profile.monthName}?`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div
        className="absolute -right-32 -top-24 h-96 w-96 animate-float rounded-full bg-teal/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-32 h-96 w-96 animate-float-slow rounded-full bg-lavender/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-3">
          <LogoMark className="h-10 w-10" />
          <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
            Scroll Detect
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card/80 p-7 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {editing
                ? "Your goals"
                : isFirstRun
                  ? "Getting started"
                  : `${profile.monthName} goals`}
            </span>
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setStep("name");
                }}
                aria-label="Close without saving"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={onNameStep ? "name" : `goals-${profile.month}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="mt-5 font-heading text-2xl font-semibold leading-tight text-foreground">
                {heading}
              </h1>

              <div className="mt-4">
                {onNameStep ? (
                  <OnboardingName
                    onSubmit={(name) => {
                      setDraftName(name);
                      setStep("goals");
                    }}
                  />
                ) : (
                  <>
                    {editing ? (
                      <label className="mb-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Name
                        </span>
                        <input
                          type="text"
                          value={draftName}
                          maxLength={40}
                          onChange={(e) => setDraftName(e.target.value)}
                          aria-label="What should I call you?"
                          className="w-full bg-transparent text-sm text-foreground outline-none"
                        />
                      </label>
                    ) : null}

                    <OnboardingGoals
                      monthName={profile.monthName}
                      name={isFirstRun ? draftName : editing ? "" : profile.name}
                      initialGoals={
                        editing
                          ? profile.goals
                          : isFirstRun
                            ? []
                            : profile.carriedGoals
                      }
                      submitLabel={
                        editing
                          ? "Save goals"
                          : isFirstRun
                            ? "Save my goals"
                            : `Save ${profile.monthName} goals`
                      }
                      onSubmit={(goals) =>
                        save(draftName.trim() || profile.name, goals)
                      }
                    />
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {!onNameStep && !isFirstRun && !editing ? (
            <p className="mt-6 flex items-start gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <CalendarCheck
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal"
                aria-hidden="true"
              />
              I prefilled last month&apos;s goals — keep the ones that still
              apply, edit them, drop the rest, or add new ones.
            </p>
          ) : null}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Target className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Goals reset every month. Nothing here leaves your device.
        </p>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  clearAllData,
  loadSessions,
  onSessionsChange,
  resetToDemo,
} from "@/lib/store";
import type { Session } from "@/lib/engine/types";
import { useAwayTracker } from "@/lib/hooks/use-away-tracker";
import { mmss, useBreakTimer } from "@/lib/hooks/use-break-timer";
import { importSessionsFromQuery } from "@/lib/import-sessions";
import { DoomPhoneMark } from "@/components/logo";
import { TABS, type TabId } from "@/components/dashboard/tabs";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import { InsightsTab } from "@/components/dashboard/insights-tab";
import { PredictTab } from "@/components/dashboard/predict-tab";
import { TriggersTab } from "@/components/dashboard/triggers-tab";
import { CoachTab } from "@/components/dashboard/coach-tab";
import { TimerTab } from "@/components/dashboard/timer-tab";
import { BreakReflection } from "@/components/dashboard/break-reflection";

export function DashboardClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<TabId | null>("timer");
  const [hydrated, setHydrated] = useState(false);
  const timer = useBreakTimer();
  const [importNotice, setImportNotice] = useState<{ imported: number } | null>(
    null,
  );
  const tracker = useAwayTracker();

  useEffect(() => {
    const result = importSessionsFromQuery();
    if (result.imported > 0) setImportNotice(result);
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    setSessions(loadSessions());
    setHydrated(true);
    return onSessionsChange(() => setSessions(loadSessions()));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden pb-40 pt-24 md:pt-32">
      {timer.reflectionPending ? <BreakReflection timer={timer} /> : null}
      <div
        className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-teal/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -left-40 bottom-20 h-96 w-96 rounded-full bg-lavender/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        {importNotice ? (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-teal/30 bg-teal/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden="true" />
              <p className="text-sm text-foreground">
                Imported {importNotice.imported} scroll session
                {importNotice.imported === 1 ? "" : "s"} from your browser
                extension. They&apos;re feeding your predictions and insights now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImportNotice(null)}
              aria-label="Dismiss"
              className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <DoomPhoneMark className="hidden h-14 w-14 shrink-0 sm:block" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                On-device AI
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Your smart scrolling dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Detects haunted patterns, intervenes with context, and gives you a
                companion who&apos;s honest instead of lecture-y.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSessions(resetToDemo())}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reset demo data
            </button>
            <button
              type="button"
              onClick={() => setSessions(clearAllData())}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-coral/50 hover:text-coral"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear data
            </button>
          </div>
        </div>

        {!hydrated ? null : (
          <>
            {timer.phase === "running" && timer.warned ? (
              <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 shrink-0 text-amber" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-foreground">
                    Heads-up — your break has {timer.warnMin} min left.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("timer")}
                  className="shrink-0 cursor-pointer rounded-full bg-amber/20 px-4 py-2 text-sm font-semibold text-amber transition-colors hover:bg-amber/30"
                >
                  Open timer
                </button>
              </div>
            ) : null}
            {timer.phase === "done" ? (
              <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-coral/40 bg-coral/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 shrink-0 text-coral" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-foreground">
                    Break&apos;s over. You held off the feed for{" "}
                    <span className="font-semibold">{mmss(timer.durationMs)}</span>
                    {" "}— that one was yours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={timer.cancel}
                  className="shrink-0 cursor-pointer rounded-full bg-coral/20 px-4 py-2 text-sm font-semibold text-coral transition-colors hover:bg-coral/30"
                >
                  Done
                </button>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {TABS.map(({ id, label, icon: Icon, featured }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab((cur) => (cur === id ? null : id))}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border transition-all",
                    featured
                      ? cn(
                          "h-14 px-7 text-base font-bold tracking-tight shadow-lg",
                          tab === id
                            ? "scale-[1.06] border-primary bg-gradient-to-r from-primary to-[#2D6CDF] text-primary-foreground shadow-primary/30"
                            : "border-primary bg-primary/10 text-primary shadow-primary/10",
                        )
                      : cn(
                          "h-11 px-5 text-sm font-medium",
                          tab === id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        ),
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4", featured && "h-5 w-5")}
                    aria-hidden="true"
                  />
                  {label}
                </button>
              ))}
            </div>

            <p
              key={tab ?? "none"}
              className="mt-4 max-w-2xl animate-fade-in text-sm leading-relaxed text-muted-foreground"
            >
              {tab
                ? TABS.find((t) => t.id === tab)?.blurb
                : "Your overview and tools — tap a tab to switch."}
            </p>

            <div className="mt-6">
              {tab ? (
                <>
                  {tab === "overview" ? (
                    <OverviewTab sessions={sessions} tracker={tracker} />
                  ) : null}
                  {tab === "insights" ? <InsightsTab sessions={sessions} /> : null}
                  {tab === "predict" ? <PredictTab sessions={sessions} /> : null}
                  {tab === "triggers" ? <TriggersTab sessions={sessions} /> : null}
                  {tab === "coach" ? <CoachTab sessions={sessions} /> : null}
                  {tab === "timer" ? <TimerTab timer={timer} /> : null}
                </>
              ) : (
                <OverviewTab sessions={sessions} tracker={tracker} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

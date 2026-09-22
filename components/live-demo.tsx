"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { DoomPhoneMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const stepCopy = [
  {
    label: "Log a session",
    description:
      "Two taps in the dashboard — the app, the minutes, how it left you. There's no background scanner; you decide what counts.",
  },
  {
    label: "Spot the pattern",
    description:
      "Detection scores the run, insights explain the why, and predictions flag your riskiest hours before you reach them.",
  },
  {
    label: "Set a break timer",
    description:
      "A real countdown with a heads-up before the end. Go stretch, make tea — the timer keeps the appointment for you.",
  },
  {
    label: "It rings. You decide.",
    description:
      "The alarm fires whether you're in the tab or not. Step away, or keep going — the choice stays yours.",
  },
];

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pb-2 pt-3.5 text-[10px] font-medium text-muted-foreground">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.3 6.9.9-5 4.7 1.3 6.8-6.1-3.3-6.1 3.3L5.2 13.9.2 9.2l6.9-.9z" />
        </svg>
        <span>98%</span>
      </span>
    </div>
  );
}

function AppChip() {
  return (
    <div className="flex items-center gap-2.5 px-4">
      <DoomPhoneMark className="h-9 w-9" />
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">Scroll Detect</p>
        <p className="text-[10px] text-muted-foreground">Tonight · 2 sessions</p>
      </div>
    </div>
  );
}

function ScreenLog() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5">
        <DoomPhoneMark className="h-9 w-9" />
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">A social app</p>
          <p className="text-[10px] text-muted-foreground">22 min · 9:41p – 10:03p</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          Logged
        </span>
      </div>
      <div className="rounded-2xl bg-muted px-4 py-3 text-[11px] text-muted-foreground">
        Feeling before: so-so · after: drained
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-[11px] font-medium text-muted-foreground">
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add another session
      </div>
      <div className="mt-auto flex justify-center gap-1.5" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
      </div>
    </div>
  );
}

function ScreenInsight() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Latest run
          </p>
          <span className="rounded-full bg-lavender/15 px-2 py-0.5 text-[10px] font-semibold text-lavender">
            Drifting
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-foreground">
          You scroll longest in the 9–11p window, usually after work stress.
        </p>
      </div>
      <div className="rounded-2xl bg-muted px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Risk prediction
        </p>
        <p className="mt-1 text-xs text-foreground">
          High risk Thu 8–10pm · 72% chance of a long run
        </p>
      </div>
      <div className="rounded-2xl border border-teal/25 bg-teal/5 px-4 py-3 text-[11px] text-foreground">
        Insight: late-night scrolls push you to Spiral. Set a break timer before
        you reach the feed.
      </div>
    </div>
  );
}

function ScreenBreak() {
  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-8 pt-5">
      <div
        className="relative h-40 w-40 rounded-full"
        style={{
          background:
            "conic-gradient(#00C2A8 0deg 252deg, rgba(148,163,184,0.22) 252deg 360deg)",
        }}
      >
        <div className="absolute inset-3 flex flex-col items-center justify-center gap-1 rounded-full bg-card">
          <span className="font-heading text-4xl font-semibold tabular-nums tracking-tight text-foreground">
            07:42
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            break
          </span>
        </div>
      </div>
      <div className="w-full space-y-1.5 rounded-2xl bg-muted px-4 py-3 text-[11px] text-muted-foreground">
        <p className="flex justify-between">
          <span>Alarm</span>
          <span className="font-medium text-foreground">10:07 pm</span>
        </p>
        <p className="flex justify-between">
          <span>Heads-up before end</span>
          <span className="font-medium text-foreground">09:52 pm</span>
        </p>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <BellRing className="h-3.5 w-3.5 text-lavender" aria-hidden="true" />
        Rings even if this tab is closed
      </p>
    </div>
  );
}

function ScreenRing() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-14 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
        <span
          className="absolute inset-0 rounded-full border border-primary/30 animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <AlarmClock className="h-8 w-8 text-primary" aria-hidden="true" />
      </span>
      <p className="font-heading text-xl font-semibold text-foreground">
        Break&apos;s over.
      </p>
      <p className="-mt-2 max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground">
        You stepped away on purpose. Stretch, sip some water, and decide what&apos;s
        next on your terms.
      </p>
      <div className="mt-1 w-full space-y-2">
        <div className="w-full rounded-full bg-primary py-2.5 text-center text-[11px] font-semibold text-primary-foreground">
          Okay, back to it
        </div>
        <div className="w-full rounded-full bg-muted py-2.5 text-center text-[11px] font-medium text-foreground">
          +5 more quiet minutes
        </div>
      </div>
    </div>
  );
}

const screens = [ScreenLog, ScreenInsight, ScreenBreak, ScreenRing];

export function LiveDemo() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const Screen = screens[index];

  const next = useCallback(() => {
    setIndex((v) => (v + 1) % screens.length);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(next, 3400);
    return () => clearInterval(id);
  }, [playing, next]);

  return (
    <section id="demo" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Live demo"
          title="See the real flow, start to finish."
          description="Click the phone or tap through - this is exactly what your Scroll Detect dashboard does, with the demo data."
        />

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative mx-auto w-[300px] sm:w-[330px]">
              <div className="absolute -inset-8 -z-10 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
              <div
                role="button"
                tabIndex={0}
                aria-label={`Demo phone. Step ${index + 1} of ${screens.length}, ${stepCopy[index].label}. Activate to advance to the next step.`}
                onClick={next}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    next();
                  }
                }}
                className="cursor-pointer rounded-[3rem] border border-border bg-navy-950 p-3 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="pointer-events-none absolute left-1/2 top-3 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
                <div className="relative h-[560px] overflow-hidden rounded-[2.35rem] bg-card">
                  <StatusBar />
                  <div className="pb-2">
                    <AppChip />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 18, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -18, scale: 0.99 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="flex min-h-[400px] flex-col"
                    >
                      <Screen />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                {stepCopy.map((step, i) => (
                  <button
                    key={step.label}
                    type="button"
                    aria-label={`Go to step ${i + 1}: ${step.label}`}
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => setIndex(i)}
                    className={cn(
                      "h-2 flex-1 cursor-pointer rounded-full transition-all duration-300",
                      i <= index ? "bg-primary" : "bg-muted-foreground/25",
                    )}
                  />
                ))}
              </div>

              <div className="rounded-3xl border bg-card p-8 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Step {index + 1} of {stepCopy.length}
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-foreground">
                  {stepCopy[index].label}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {stepCopy[index].description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Previous step"
                  onClick={() =>
                    setIndex((v) => (v - 1 + screens.length) % screens.length)
                  }
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label={playing ? "Pause auto-play" : "Play auto-play"}
                  onClick={() => setPlaying((v) => !v)}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  aria-label="Next step"
                  onClick={next}
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow-teal transition-transform hover:-translate-y-0.5"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
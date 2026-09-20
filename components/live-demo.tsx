"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

const FEED_BLOCKS = [
  { w: "w-3/4", h: "h-2" },
  { w: "w-1/2", h: "h-2" },
  { w: "w-full", h: "h-14" },
  { w: "w-2/3", h: "h-2" },
  { w: "w-full", h: "h-10" },
];

const stepCopy = [
  {
    label: "Set your timer",
    description:
      "Scroll Guard starts a gentle countdown the moment the app opens. No alarms, just a quiet clock.",
  },
  {
    label: "Get the nudge",
    description:
      "At 80%, one question appears: 'Still valuable?' Answer with a tap.",
  },
  {
    label: "Auto-pause",
    description:
      "At zero, the feed gently tops out. You choose the next move.",
  },
  {
    label: "Done",
    description:
      "You set it down. Scroll Guard counts the win and moves on to your real life.",
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
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-focus to-lavender text-xs font-bold text-white">
        IG
      </span>
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">Instagram</p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[70%] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 px-4 pt-3" aria-hidden="true">
      {FEED_BLOCKS.map((block, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-full bg-muted-foreground/15",
            block.w,
            block.h,
          )}
        />
      ))}
    </div>
  );
}

function ScreenTimer() {
  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-8 pt-6">
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
            of 10 min
          </span>
        </div>
      </div>
      <div className="w-full rounded-2xl bg-muted px-4 py-3 text-center text-xs text-foreground">
        Intent: "Quick scroll - funny posts"
      </div>
      <div className="flex justify-center gap-2" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
      </div>
    </div>
  );
}

function ScreenNudge() {
  return (
    <div className="relative px-0 pb-8 pt-2">
      <div className="sticky top-0 z-10 px-4 pb-2 pt-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender/15 text-lavender">
              <BellRing className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-foreground">
              Still valuable?
            </p>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            You are 80% into your 10 minutes.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 rounded-full bg-muted px-2 py-1.5 text-center text-[11px] font-medium text-foreground">
              One more minute
            </span>
            <span className="flex-1 rounded-full bg-primary px-2 py-1.5 text-center text-[11px] font-semibold text-primary-foreground">
              I am good
            </span>
          </div>
        </div>
      </div>
      <FeedSkeleton />
    </div>
  );
}

function ScreenPause() {
  return (
    <div className="relative px-0 pb-8">
      <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-[2px]" />
      <div className="relative z-20 flex flex-col items-center gap-4 px-6 pb-6 pt-14">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <svg className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 1.2c3.4 1.4 6.5 2 8.1 2.3v6c0 5-3.9 8.4-8.1 10.2C5.8 17.9 1.9 14.5 1.9 9.5v-6C3.5 3.2 6.6 2.6 10 1.2Z" />
            <path d="M7.4 4.8h5.2L10 7.3l-2.6-2.5Zm-.1 5h5.4L10 12.4l-2.7-2.6Z" fill="#0B1B2B" />
          </svg>
        </span>
        <p className="font-heading text-xl font-semibold text-foreground">
          Time to land.
        </p>
        <p className="-mt-2 text-center text-xs leading-relaxed text-muted-foreground">
          You set a limit and you kept it. The feed can wait.
        </p>
        <div className="mt-1 w-full space-y-2">
          <div className="w-full rounded-full bg-primary py-2.5 text-center text-[11px] font-semibold text-primary-foreground">
            Close app and go
          </div>
          <div className="w-full rounded-full bg-muted py-2.5 text-center text-[11px] font-medium text-foreground">
            +5 quiet minutes (once)
          </div>
        </div>
      </div>
      <FeedSkeleton />
    </div>
  );
}

function ScreenDone() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-14 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
        <span className="absolute inset-0 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: "3s" }} />
        <Check className="h-8 w-8 text-primary" aria-hidden="true" />
      </span>
      <p className="font-heading text-xl font-semibold text-foreground">
        You set it down.
      </p>
      <div className="w-full rounded-2xl bg-muted px-4 py-3">
        <p className="text-xs text-muted-foreground">Tonight's scroll</p>
        <p className="mt-0.5 font-heading text-lg font-semibold text-foreground">
          10 min - streak 12
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        That's an hour more for you. Enjoy it.
      </p>
    </div>
  );
}

const screens = [ScreenTimer, ScreenNudge, ScreenPause, ScreenDone];

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
          title="See it happen, start to finish."
          description="Click the phone or tap through - this is exactly how a Scroll Guard session feels."
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
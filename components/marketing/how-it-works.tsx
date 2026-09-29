import type { ReactNode } from "react";
import { Brain, ClipboardList, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

function LogMock() {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
        Dashboard · tonight
      </p>
      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2.5">
        <LogoMark className="h-7 w-7" />
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">A social app</p>
          <p className="text-[10px] text-muted-foreground">22 min · 9:41p – 10:03p</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          Logged
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Feeling before: so-so</span>
        <span>After: drained</span>
      </div>
    </div>
  );
}

function InsightMock() {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-card">
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
      <div className="mt-3 rounded-xl bg-muted px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Risk prediction
        </p>
        <p className="mt-1 text-xs text-foreground">
          High risk Thu 8–10pm · 72% chance of a long run
        </p>
      </div>
    </div>
  );
}

function TimerMock() {
  return (
    <div className="relative mx-auto w-full max-w-[220px] rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-4 shadow-glow-teal">
      <span
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow-teal"
        aria-hidden="true"
      >
        The main feature
      </span>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
        Break timer
      </p>
      <p className="mt-3 text-center font-heading text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
        07:42
      </p>
      <div className="mt-4 space-y-1.5 rounded-xl bg-muted px-3 py-2.5 text-[10px] text-muted-foreground">
        <p className="flex justify-between">
          <span>Alarm</span>
          <span className="font-medium text-foreground">10:07 pm</span>
        </p>
        <p className="flex justify-between">
          <span>Heads-up before end</span>
          <span className="font-medium text-foreground">09:52 pm</span>
        </p>
      </div>
      <div className="mt-4">
        <Button asChild className="w-full">
          <a href="/app">
            Start a break timer
            <Timer className="h-5 w-5" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  );
}

const steps: {
  icon: typeof Brain;
  title: string;
  caption: string;
  mock: () => ReactNode;
  featured?: boolean;
}[] = [
  {
    icon: ClipboardList,
    title: "Log your scroll",
    caption:
      "Two taps in the dashboard — the app, the minutes, how it left you. There's no background scanner; you decide what counts.",
    mock: () => <LogMock />,
  },
  {
    icon: Brain,
    title: "Spot the pattern",
    caption:
      "On-device analysis scores every run, explains the why in insights, and predicts your riskiest hours before you reach them.",
    mock: () => <InsightMock />,
  },
  {
    icon: Timer,
    title: "Take a real break",
    caption:
      "Set a countdown that heads-up you before the end and rings when it's done — an alarm for stepping away, not a block.",
    mock: () => <TimerMock />,
    featured: true,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title="Three quiet steps. One clearer feed."
          description="No background tracking, no blocks. Scroll Detect shows you your pattern and lets you act on it."
        />

        <div className="relative grid gap-6 md:grid-cols-3">
          <div
            className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden="true"
          />
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.14} className="relative">
              <div className={cn(
                "flex h-full flex-col rounded-3xl border bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft",
                step.featured ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
              )}>
                <div className="mb-8 flex items-center gap-4">
                  <span className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-2xl border text-primary",
                    step.featured
                      ? "border-primary/50 bg-primary/20 shadow-glow-teal"
                      : "border-primary/30 bg-primary/10",
                  )}>
                    <step.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-sm font-semibold text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <div className="mb-6">{step.mock()}</div>
                <h3 className="font-heading text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {step.caption}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
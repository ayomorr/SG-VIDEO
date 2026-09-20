import type { ReactNode } from "react";
import { BellRing, PauseCircle, PenLine } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

function IntentMock() {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
        Before you open
      </p>
      <div className="mt-3 rounded-xl bg-muted px-3 py-2.5 text-xs text-foreground">
        "Quick scroll - funny posts"
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">I came for</span>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          10 min
        </span>
      </div>
    </div>
  );
}

function NudgeMock() {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lavender/15 text-lavender">
          <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold text-foreground">Still valuable?</p>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        You are 80% into your 10 minutes.
      </p>
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-full bg-muted px-2 py-1.5 text-center text-[10px] font-medium text-foreground">
          One more minute
        </span>
        <span className="flex-1 rounded-full bg-primary px-2 py-1.5 text-center text-[10px] font-semibold text-primary-foreground">
          I am good
        </span>
      </div>
    </div>
  );
}

function PauseMock() {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold text-foreground">Time to land.</p>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        You set your limit and you kept it. Nice.
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-0 rounded-full bg-primary" />
      </div>
    </div>
  );
}

const steps: {
  icon: typeof PenLine;
  title: string;
  caption: string;
  mock: () => ReactNode;
}[] = [
  {
    icon: PenLine,
    title: "Set your intent",
    caption:
      "Before an app opens, name why you are here. 'A quick look' or 'Ten minutes, I promise.' Now the timer knows your goal too.",
    mock: () => <IntentMock />,
  },
  {
    icon: BellRing,
    title: "Get a gentle nudge",
    caption:
      "When you are 80% in, Scroll Guard asks the only question that matters: 'Still valuable?' One tap answers honestly.",
    mock: () => <NudgeMock />,
  },
  {
    icon: PauseCircle,
    title: "Auto-pause and move on",
    caption:
      "At your limit the feed rests and the phone returns to you. Not blocked, not punished - just a breath before you decide.",
    mock: () => <PauseMock />,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title="Three small choices. One calmer feed."
          description="No guilt trips, no willpower workouts. Scroll Guard steps in gently, at exactly the moments that matter."
        />

        <div className="relative grid gap-6 md:grid-cols-3">
          <div
            className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden="true"
          />
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.14} className="relative">
              <div className="flex h-full flex-col rounded-3xl border bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                <div className="mb-8 flex items-center gap-4">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
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
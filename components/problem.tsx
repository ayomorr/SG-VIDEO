import { CalendarX2, MoonStar, Smartphone } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/counter";

const stats = [
  {
    icon: Smartphone,
    value: 6.9666,
    time: true,
    label: "of daily screen time goes to autopilot scrolling",
    source: "Global median, 2025",
  },
  {
    icon: CalendarX2,
    value: 112,
    suffix: " days",
    label: "of your life drifting away to the feed every decade",
    source: "Computed from average session length",
  },
  {
    icon: MoonStar,
    value: 39,
    suffix: "%",
    label: "of adults say late-night scrolling pushes their sleep back",
    source: "Sleep & screens survey, 2025",
  },
];

export function Problem() {
  return (
    <section id="problem" className="relative scroll-mt-24 py-20 md:py-28">
      <div
        className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-coral/40 to-transparent"
        aria-hidden="true"
      />
      <div className="container">
        <SectionHeading
          eyebrow="The problem"
          title="Nobody plans to scroll for two hours."
          description="Dopamine doesn't have a chime. So we fall in, look up, and wonder where the evening went. You're not weak — the feed is just very good at its job."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.12}>
              <Card className="group flex h-full flex-col gap-5 p-8 transition-colors hover:border-coral/40">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <stat.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span
                    className="h-1 w-10 rounded-full bg-coral/60 transition-all group-hover:w-16"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-heading text-5xl font-semibold tracking-tight text-foreground">
                  <Counter to={stat.value} time={stat.time} />
                  {stat.suffix ? (
                    <span className="text-3xl text-coral">{stat.suffix}</span>
                  ) : null}
                </p>
                <p className="-mt-2 leading-relaxed text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-auto text-xs uppercase tracking-wider text-muted-foreground/70">
                  {stat.source}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
            We’re not here to shame you.{" "}
            <span className="font-medium text-foreground">
              We’re here to give you back your time.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
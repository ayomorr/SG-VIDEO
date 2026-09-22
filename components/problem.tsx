import { CalendarX2, MoonStar, Smartphone } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/counter";

const stats: {
  icon: typeof Smartphone;
  value?: number;
  suffix?: string;
  time?: boolean;
  headline?: string;
  label: string;
  source?: string;
}[] = [
  {
    icon: Smartphone,
    value: 15,
    suffix: " days",
    label: "of every year go to autopilot scrolling — if a scroll takes just an hour a day.",
    source: "Simple arithmetic: 1 hour × 365",
  },
  {
    icon: CalendarX2,
    value: 152,
    suffix: " days",
    label: "of every decade slip away the same way — a little over five full months, counting only one hour a day.",
    source: "Simple arithmetic: 1 hour × 3,650",
  },
  {
    icon: MoonStar,
    headline: "After 11pm, it gets worse.",
    label: "Late-night scrolls run longest and hit sleep hardest — a pattern your own log will show you faster than any survey.",
    source: "See it in your dashboard after a week",
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
          title="It starts with one quick check."
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
                {stat.value !== undefined ? (
                  <p className="font-heading text-5xl font-semibold tracking-tight text-foreground">
                    <Counter to={stat.value} time={stat.time} />
                    {stat.suffix ? (
                      <span className="text-3xl text-coral">{stat.suffix}</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                    {stat.headline}
                  </p>
                )}
                <p className="-mt-2 leading-relaxed text-muted-foreground">
                  {stat.label}
                </p>
                {stat.source ? (
                  <p className="mt-auto text-xs uppercase tracking-wider text-muted-foreground/70">
                    {stat.source}
                  </p>
                ) : null}
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
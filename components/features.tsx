import {
  BellRing,
  Flame,
  Hourglass,
  MoonStar,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

const features = [
  {
    icon: Hourglass,
    title: "Per-app limits",
    description:
      "Instagram: 20 minutes. X: 15. Duolingo: unlimited. Separate clocks for separate vices - you set them per app.",
  },
  {
    icon: BellRing,
    title: "Smart nudge",
    description:
      "A quiet 'Still valuable?' at 80% in. The check-in is one tap, honest, and never pushy about it.",
  },
  {
    icon: PauseCircle,
    title: "Auto-pause",
    description:
      "When your limit hits zero, the feed rests. Not a block, not a wall - a soft stop you get to choose what to do with.",
  },
  {
    icon: MoonStar,
    title: "Quiet hours",
    description:
      "After 10pm the screen dims and slows. Sleep gets the late shift; the feed gets the morning.",
  },
  {
    icon: Flame,
    title: "Streaks",
    description:
      "Nights you put the phone down on time, logged and celebrated. Consistency, not perfection.",
  },
  {
    icon: ShieldCheck,
    title: "On-device privacy",
    description:
      "Everything stays on your phone. No account, no tracking, no middleman. Your scroll is nobody's business but yours.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to scroll on your own terms."
          description="Small, calm tools that stack into one big change. Designed to be felt, not noticed."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.1}>
              <div className="group flex h-full flex-col gap-5 rounded-3xl border bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-glow-teal">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glow-teal">
                  <feature.icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
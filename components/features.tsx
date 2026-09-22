import {
  Brain,
  CalendarClock,
  ClipboardList,
  Radar,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

const features = [
  {
    icon: ClipboardList,
    title: "Self-tracked scrolls",
    description:
      "No background scanner. You log a session in two taps — the app, the minutes, how it left you — and everything downstream runs on that honest data.",
  },
  {
    icon: Radar,
    title: "Doom-scroll detection",
    description:
      "Every logged run is scored from Calm to Spiral, with a single line on what's happening and one thing to try next.",
  },
  {
    icon: CalendarClock,
    title: "Risk predictions",
    description:
      "From your own history, Scroll Detect predicts your riskiest hours for a long run — so you can spot them coming.",
  },
  {
    icon: Brain,
    title: "Trigger insight",
    description:
      "It finds what links your spirals — late nights, certain apps, a mood — and surfaces the journal of your habits.",
  },
  {
    icon: Timer,
    title: "Break timer with alarm",
    description:
      "Set a focused break for any length. It heads-up you before the end, then rings — your alarm for stepping away.",
  },
  {
    icon: ShieldCheck,
    title: "On-device privacy",
    description:
      "Everything lives in your browser's storage on your device. No account, no tracking, no data sent anywhere.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Features"
          title="Built around your real scrolling, not a fantasy of lockdown."
          description="Small, quiet tools that add up over time. Designed to feel helpful, not heavy."
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
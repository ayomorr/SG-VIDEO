import { Star } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "I don't feel banned from Instagram. I just notice more now. It's the first screen tool that didn't feel like punishment.",
    name: "Maya R.",
    role: "Product designer, 34",
    initials: "MR",
    gradient: "from-teal to-focus",
  },
  {
    quote:
      "Quiet hours alone is worth it. My 11pm-scroll-until-1am loop just… stopped. I didn't will my way out; the app gave me a door.",
    name: "Dev P.",
    role: "Teacher, 41",
    initials: "DP",
    gradient: "from-focus to-lavender",
  },
  {
    quote:
      "The nudge. I keep apps because Scroll Guard asks one honest question and I actually answer it. That's the whole trick.",
    name: "Sam K.",
    role: "Nurse, 28",
    initials: "SK",
    gradient: "from-lavender to-teal",
  },
];

const mentions = ["The Verge", "TechCrunch", "Product Hunt", "WIRED", "Fast Company"];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28" aria-label="What people say">
      <div className="container">
        <SectionHeading
          eyebrow="Loved quietly"
          title="The scroll gets smaller. The evenings get longer."
          description="Real people, real streaks, no dramatic detox stories required."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.12}>
              <figure className="flex h-full flex-col gap-6 rounded-3xl border bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                <div className="flex gap-1" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="leading-relaxed text-foreground">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                      t.gradient,
                    )}
                    aria-hidden="true"
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-14 flex flex-col items-center gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              As seen in
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {mentions.map((name, i) => (
                <li
                  key={name}
                  className={cn(
                    "font-heading text-lg font-semibold tracking-tight text-muted-foreground/60 transition-colors hover:text-muted-foreground",
                    i % 2 === 0 ? "font-serif" : "",
                  )}
                >
                  {name}
                </li>
              ))}
            </ul>
            <p className="max-w-md text-center text-xs text-muted-foreground/70">
              Placeholder for real press logos. Swap these out when coverage lands.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
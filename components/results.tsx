import { Moon, TrendingDown, Zap } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Counter } from "@/components/counter";

const stats = [
  {
    icon: TrendingDown,
    value: 38,
    suffix: "%",
    label: "average screen time",
    sub: "down, in the first 30 days",
    color: "text-teal",
  },
  {
    icon: Zap,
    value: 2,
    suffix: " hrs",
    label: "focus",
    sub: "returned to your actual life",
    color: "text-focus",
  },
  {
    icon: Moon,
    value: 1,
    suffix: " hr",
    label: "of sleep",
    sub: "reclaimed, by people in quiet hours",
    color: "text-lavender",
  },
];

export function Results() {
  return (
    <section id="results" className="py-12 md:py-16" aria-label="Results">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-foreground/5 bg-navy-950 px-8 py-16 md:px-16 md:py-20">
            <div
              className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal/20 blur-[100px]"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-lavender/20 blur-[100px]"
              aria-hidden="true"
            />
            <div className="bg-grid-faint absolute inset-0 opacity-60" aria-hidden="true" />

            <div className="relative">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-teal">
                The quiet payoff
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl text-center font-heading text-3xl font-semibold tracking-tight text-cloud sm:text-4xl">
                One week in, most people feel the difference.
              </h2>

              <div className="mt-12 grid gap-10 sm:grid-cols-3">
                {stats.map((stat, i) => (
                  <Reveal key={stat.label} delay={i * 0.12}>
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cloud/5 text-cloud/70">
                        <stat.icon
                          className={`h-6 w-6 ${stat.color}`}
                          aria-hidden="true"
                        />
                      </span>
                      <p className={`font-heading text-5xl font-semibold tracking-tight ${stat.color}`}>
                        <Counter to={stat.value} />
                        <span>{stat.suffix}</span>
                      </p>
                      <div>
                        <p className="text-base font-medium text-cloud">
                          {stat.label}
                        </p>
                        <p className="mt-0.5 text-sm text-cloud/50">{stat.sub}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              <p className="mt-12 text-center text-xs text-cloud/40">
                Averages across 48,000+ Scroll Guard sessions, 2025. Your mileage
                may vary — that's the honest bit.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
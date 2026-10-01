import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

/**
 * The questions below are copied from the real generators in
 * `lib/data/reflection.ts` rather than written fresh, so the sample on the
 * marketing page cannot drift away from what a user actually gets asked.
 */
const goalFields = [
  "Complete my course",
  "Exercise regularly",
  "Read 2 books",
];

const details = [
  "Set once, then forgotten until the end of a break",
  "1\u20135 goals, all editable from the Overview tab",
  "Questions quote your own wording, not a template",
  "Last month\u2019s goals are offered, never assumed",
  "Only the current month ever reaches the questions",
  "Cleared with the rest of the local data",
];

export function MonthlyGoals() {
  return (
    <section
      id="goals"
      className="relative scroll-mt-24 overflow-hidden border-b border-border py-20 md:py-28"
    >
      <div
        className="absolute -right-32 top-0 h-[26rem] w-[26rem] animate-float rounded-full bg-lavender/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -left-32 bottom-0 h-[22rem] w-[22rem] animate-float-slow rounded-full bg-teal/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <SectionHeading
          eyebrow="Monthly goals"
          title="It asks what you were actually trying to do."
          description="A generic lecture about screen time is easy to nod off to. So the first time you open the app it asks your name and what you are trying to finish this month \u2014 and the questions at the end of a break are built out of that."
        />

        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <Reveal>
            <ul className="flex flex-col gap-3 border-l border-border pl-6">
              {details.map((detail) => (
                <li
                  key={detail}
                  className="flex gap-2.5 font-mono text-[12px] leading-relaxed text-muted-foreground"
                >
                  <span aria-hidden="true" className="text-primary">
                    &rarr;
                  </span>
                  {detail}
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-lg leading-relaxed text-muted-foreground">
              Goals reset on the first of the month. The new month opens with a
              short check-in rather than a blank slate, so you can keep what
              still matters and drop what quietly stopped mattering.
            </p>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal delay={0.06}>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Getting started
                </p>
                <h3 className="mt-3 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
                  Hey! Before we get started, what should I call you?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  A nickname works best &mdash; I&rsquo;ll use it instead of your
                  full name.
                </p>

                <p className="mt-6 text-sm font-medium text-foreground">
                  What do you want to get done this month?
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {goalFields.map((goal, i) => (
                    <li
                      key={goal}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted-foreground"
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Your break just ended
                </p>
                <h3 className="mt-3 text-balance font-heading text-lg font-semibold leading-snug tracking-[-0.02em] text-foreground">
                  You said &ldquo;Read 2 books&rdquo; is one of your goals this
                  month. Is this scroll getting you closer to it, or pulling you
                  away?
                </h3>
                <ul className="mt-4 flex flex-col gap-2">
                  {["Getting closer", "Pulling me away", "Honestly, not sure"].map(
                    (option) => (
                      <li
                        key={option}
                        className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground"
                      >
                        {option}
                      </li>
                    ),
                  )}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  The AI coach on the dashboard gets your name and this
                  month&rsquo;s goals too, and answers from them when you have no
                  API key set.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

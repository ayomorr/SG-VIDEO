import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Every claim here is something the code actually does, and the specifics are
 * the point — a generic three-step explainer would say "set a reminder" where
 * the truth is "three independent alarm layers re-asserted every 800ms".
 */
const beats: { title: string; body: string; facts?: string[] }[] = [
  {
    title: "Set the break",
    body: "Pick a preset, type a length, or tell it when you want to be finished. The timer takes a wake lock on that tap, so the countdown still reaches zero after the screen dims or the tab is backgrounded. A chime and a notification land before the break runs out, so you are not cut off mid-sentence. On a short break the lead time is trimmed rather than dropped, so the warning can never land on top of the alarm.",
  },
  {
    title: "The alarm rings",
    body: "Three independent layers have to fail before it goes quiet. If one dies mid-ring it is restarted, and if you close the tab while it is ringing, it is still owed when you come back.",
  },
  {
    title: "Answer, and it stops",
    body: "The alarm does not stop because you reached for it. It stops because you answered at least four questions drawn at random — one of them asks whether another 30 minutes is really okay, and the rest are built from whatever you said you wanted to finish this month. Then the timer resets and you are back to where you started.",
    facts: [
      "4\u20135 questions, drawn at random",
      "\u201cWill you be okay with another 30 minutes?\u201d",
      "Questions built from this month\u2019s goals",
      "Answers feed the pattern analysis",
      "No lock, no fullscreen, no forced pause",
    ],
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative scroll-mt-24 overflow-hidden border-b border-border py-20 md:py-28"
    >
      <div
        className="absolute -left-32 top-10 h-[26rem] w-[26rem] animate-float-slow rounded-full bg-lavender/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -right-32 -bottom-16 h-[22rem] w-[22rem] animate-float rounded-full bg-teal/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <SectionHeading
          eyebrow="How it works"
          title="What runs while you are away."
          description="Three things happen after you press start, and the last two are the reason this is not a reminder app."
        />

        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            What happens after you press start, in three steps.
          </caption>
          <thead className="hidden md:table-header-group">
            <tr className="border-y border-border">
              <th
                scope="col"
                className="w-16 py-3 pr-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                No.
              </th>
              <th
                scope="col"
                className="w-52 py-3 pr-6 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Step
              </th>
              <th
                scope="col"
                className="py-3 pr-6 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                What happens
              </th>
              <th
                scope="col"
                className="w-64 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                In detail
              </th>
            </tr>
          </thead>
          <tbody>
            {beats.map((beat, i) => (
              <tr
                key={beat.title}
                className="block border-b border-border py-6 last:border-b-0 md:table-row md:py-0"
              >
                <td className="block pb-1 md:table-cell md:w-16 md:py-7 md:pr-4 md:align-top">
                  <Reveal delay={i * 0.06}>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Reveal>
                </td>
                <td className="block pb-2 md:table-cell md:w-52 md:py-7 md:pr-6 md:align-top">
                  <Reveal delay={i * 0.06}>
                    <h3 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">
                      {beat.title}
                    </h3>
                  </Reveal>
                </td>
                <td className="block md:table-cell md:py-7 md:pr-6 md:align-top">
                  <Reveal delay={i * 0.06}>
                    <p className="max-w-2xl leading-relaxed text-muted-foreground">
                      {beat.body}
                    </p>
                  </Reveal>
                </td>
                <td className="block pt-4 md:table-cell md:w-64 md:py-7 md:align-top">
                  {beat.facts ? (
                    <Reveal delay={i * 0.06}>
                      <ul className="flex flex-col gap-2.5 border-l border-border pl-5">
                        {beat.facts.map((fact) => (
                          <li
                            key={fact}
                            className="flex gap-2.5 font-mono text-[12px] leading-relaxed text-muted-foreground"
                          >
                            <span aria-hidden="true" className="text-primary">
                              &rarr;
                            </span>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Reveal>
          <div className="mt-12 flex flex-col items-start gap-4">
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              A web page cannot pause the apps on your phone, and this does not
              pretend otherwise. It does not lock your screen either.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
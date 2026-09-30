import { Reveal } from "@/components/marketing/reveal";
import { InstallButton } from "@/components/marketing/install-button";

export function FinalCta() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      aria-label="Get started"
    >
      <div
        className="absolute -left-40 top-0 h-[28rem] w-[28rem] animate-float rounded-full bg-lavender/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -right-40 bottom-0 h-[24rem] w-[24rem] animate-float-slow rounded-full bg-teal/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <Reveal>
          <div className="grid gap-10 border-t border-border pt-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
            <div className="flex flex-col items-start gap-6">
              <h2 className="max-w-lg text-balance font-heading text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-4xl md:text-[2.5rem] md:leading-[1.08]">
                Set the break now. Decide at the end of it.
              </h2>
              <p className="max-w-md leading-relaxed text-muted-foreground">
                That is the whole deal. No account, nothing stored on a server,
                and an alarm that is still owed to you tomorrow morning if you
                ignore it tonight.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <InstallButton />
              </div>
            </div>

            <dl className="grid content-start gap-px self-start bg-border">
              {[
                ["Cost", "Free, no account"],
                ["Platform", "Any modern browser"],
                ["Access", "Add to home screen"],
                ["Data", "Stays in this browser"],
              ].map(([term, detail]) => (
                <div
                  key={term}
                  className="flex items-baseline justify-between gap-4 bg-background py-4"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {term}
                  </dt>
                  <dd className="text-right text-sm text-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
import { Button } from "@/components/ui/button";
import { InstallButton } from "@/components/marketing/install-button";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border pb-20 pt-32 md:pb-28 md:pt-40">
      <div
        className="bg-grid-faint absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]"
        aria-hidden="true"
      />
      <div
        className="absolute -right-40 top-0 h-[30rem] w-[30rem] animate-float rounded-full bg-teal/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -left-40 bottom-0 h-[26rem] w-[26rem] animate-float-slow rounded-full bg-lavender/20 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <div className="flex flex-col items-start gap-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Free &middot; no account required
          </p>

          <h1 className="max-w-[16ch] text-balance font-heading text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-foreground">
            You cannot snooze this alarm.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Set how long you want to be away. Scroll Detect warns you just before the
            break is over, rings the moment it ends, and keeps ringing until you
            have answered a few questions about why you started scrolling in the
            first place.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="xl" variant="outline">
              <a href="/app">Open the app</a>
            </Button>
            <InstallButton />
          </div>

          <dl className="mt-4 grid w-full max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Warning
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">
                Minutes before the end
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Alarm
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">
                Siren, kept alive until dismissed
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Stops when
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">You answer the questions</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
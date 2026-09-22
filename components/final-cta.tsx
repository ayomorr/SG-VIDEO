import Link from "next/link";
import { LayoutDashboard, Sparkles } from "lucide-react";
import { InstallButton } from "@/components/install-button";
import { Reveal } from "@/components/reveal";

export function FinalCta() {
  return (
    <section className="py-12 md:py-16" aria-label="Get started">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-gradient-brand px-8 py-16 text-center md:px-16 md:py-24">
            <div
              className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-navy-950/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="bg-grid-faint absolute inset-0 opacity-40" aria-hidden="true" />

            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
              <p className="font-heading text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-tight text-white">
                Your evenings are waiting.
              </p>
              <p className="max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                Install Scroll Detect from any browser — no App Store, no account.
                A dashboard, a coach, and a break timer that give your focus back.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <InstallButton />
                <Link
                  href="/app"
                  className="inline-flex h-14 items-center gap-2 rounded-full border border-white/30 px-8 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Open the AI dashboard
                </Link>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-white/60">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                No store. No account. No ads.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
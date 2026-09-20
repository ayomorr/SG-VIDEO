import { DownloadButtons } from "@/components/download-buttons";
import { QRCode } from "@/components/qr-code";
import { Reveal } from "@/components/reveal";
import { siteConfig } from "@/lib/site";

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
                One download. A few honest limits. A week from now, your phone
                won't be running your nights.
              </p>
              <DownloadButtons className="justify-center" />
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
                <QRCode size={120} caption="Or scan to get it" />
                <p className="max-w-[200px] pb-1 text-left text-xs leading-relaxed text-white/75">
                  {siteConfig.storeMeta.price}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
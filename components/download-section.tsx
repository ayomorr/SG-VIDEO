import { Apple, Smartphone, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { DownloadButtons } from "@/components/download-buttons";
import { QRCode } from "@/components/qr-code";
import { EmailCapture } from "@/components/email-capture";
import { InstallPanel } from "@/components/install-panel";
import { siteConfig } from "@/lib/site";

export function DownloadSection() {
  return (
    <section id="download" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Get it"
          title="Get Scroll Guard"
          description="Two taps and it's on your phone. No account, no sign-up, no catch."
        />

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <Reveal>
            <div className="flex flex-col gap-8">
              <DownloadButtons />
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Prefer a link? We'll send it to your inbox.
                </p>
                <EmailCapture
                  cta="Get a download link"
                  placeholder="you@example.com"
                  note="One email, straight to install. No lists, no spam."
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground" aria-label="Store details">
                <span className="flex items-center gap-2">
                  <Apple className="h-4 w-4" aria-hidden="true" />
                  iOS 15+
                </span>
                <span className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  Android 8+
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  {siteConfig.storeMeta.size}
                </span>
                <span className="text-mist">{siteConfig.storeMeta.price}</span>
              </div>

              <InstallPanel />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex flex-col items-center gap-2">
              <QRCode />
              <p className="mt-4 max-w-[220px] text-center text-sm leading-relaxed text-muted-foreground">
                Point your camera at the code. Download reminder served.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
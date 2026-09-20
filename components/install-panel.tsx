"use client";

import { useEffect, useState } from "react";
import { Download, Info, MonitorCheck } from "lucide-react";

type PromptEvent = Event & { prompt: () => Promise<void> };

const steps = [
  "Open the address-bar menu (the \u22EE / Share icon in Chrome, Edge, or Safari).",
  'Choose "Install Scroll Guard" or "Add to Dock".',
  "It opens as its own app — and keeps working offline.",
];

export function InstallPanel({ headline = "Prefers a laptop?" }: { headline?: string }) {
  const [installEvent, setInstallEvent] = useState<PromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as PromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <div className="hidden rounded-2xl border border-border/80 bg-card/60 p-5 md:block">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <MonitorCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{headline}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Scroll Guard installs as an app on Windows, macOS and Linux too — and
            keeps your streaks even offline.
          </p>
          <button
            type="button"
            onClick={install}
            className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95"
          >
            {installEvent ? "Install Scroll Guard" : open ? "Hide steps" : "How to install"}
            {installEvent ? (
              <Download className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Info className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {open && !installEvent ? (
        <ol className="mt-4 space-y-2 border-t border-border pt-4">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
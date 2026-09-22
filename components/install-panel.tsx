"use client";

import { useEffect, useState } from "react";
import { Download, Info, MonitorCheck } from "lucide-react";

type PromptEvent = Event & { prompt: () => Promise<void> };

const androidSteps = [
  "Open the address bar menu in Chrome or Edge.",
  'Choose "Install app" or "Add to Home screen".',
  "Approve the prompt and launch Scroll Detect like a native app.",
];

const iPhoneSteps = [
  "Open this page in Safari on your iPhone.",
  'Tap the Share button and choose "Add to Home Screen".',
  "Tap Add and use Scroll Detect from your home screen.",
];

export function InstallPanel({ headline = "Prefers a laptop?" }: { headline?: string }) {
  const [installEvent, setInstallEvent] = useState<PromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const platform = navigator.platform || "";
    const userAgent = navigator.userAgent || "";
    const appleDevice = /iPhone|iPad|iPod/.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(appleDevice);

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

  const steps = isIOS ? iPhoneSteps : androidSteps;

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      return;
    }

    setOpen((v) => !v);
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
            Install Scroll Detect as an app on desktop or mobile. It opens faster, stays
            offline, and keeps your focus without the App Store friction.
          </p>
          <button
            type="button"
            onClick={install}
            className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95"
          >
            {installEvent ? "Install Scroll Detect" : open ? "Hide steps" : isIOS ? "Add to Home Screen" : "How to install"}
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
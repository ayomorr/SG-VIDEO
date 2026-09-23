"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ButtonSize } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInstallState } from "@/lib/hooks/use-install-state";

type Placement = "bottom" | "top";

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

export function InstallButton({
  className,
  size = "xl",
  fullWidth = false,
  placement = "bottom",
}: {
  className?: string;
  size?: ButtonSize;
  fullWidth?: boolean;
  placement?: Placement;
}) {
  const { installEvent, installed } = useInstallState();
  const [open, setOpen] = useState(false);
  const isIOS =
    /iPhone|iPad|iPod/.test(navigator.userAgent || "") ||
    ((navigator.platform || "") === "MacIntel" && navigator.maxTouchPoints > 1);

  const steps = isIOS ? iPhoneSteps : androidSteps;

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      return;
    }
    setOpen((v) => !v);
  };

  if (installed) {
    return (
      <Button size={size} asChild className={cn(fullWidth && "w-full")}>
        <a href="/app">
          Open the app
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </a>
      </Button>
    );
  }

  const label = installEvent
    ? "Install Scroll Detect"
    : open
      ? "Hide steps"
      : isIOS
        ? "Add to Home Screen"
        : "Install app";

  return (
    <div className={cn("relative", fullWidth && "w-full", className)}>
      <Button size={size} onClick={install} className={cn(fullWidth && "w-full")}>
        {label}
        {installEvent ? (
          <Download className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Info className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>

      <AnimatePresence>
        {open && !installEvent ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute z-20 w-80 rounded-2xl border border-border/80 bg-card p-5 shadow-soft",
              placement === "bottom"
                ? "left-0 top-full mt-3"
                : "bottom-full left-0 mb-3",
            )}
          >
            <ol className="space-y-2">
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
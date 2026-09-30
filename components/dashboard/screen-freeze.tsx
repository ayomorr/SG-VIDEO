"use client";

import { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mmss } from "@/lib/hooks/use-break-timer";
import { getFreezeRemainingMs, isFreezing } from "@/lib/focus/freeze";

/**
 * The lock screen shown while the freeze is running. It deliberately offers no
 * dismiss control: the countdown is the only exit, and it was set by the user
 * before the break started. The text says so plainly rather than pretending the
 * app has locked their phone, because it has not — this is a focus lock on the
 * page, and a determined user can still close the tab.
 */
export function ScreenFreeze() {
  const [remaining, setRemaining] = useState(getFreezeRemainingMs);
  const [active, setActive] = useState(isFreezing);

  useEffect(() => {
    setRemaining(getFreezeRemainingMs());
    setActive(isFreezing());
    const id = window.setInterval(() => {
      setRemaining(getFreezeRemainingMs());
      setActive(isFreezing());
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  if (!active) return null;

  const totalMinutes = Math.ceil(remaining / 60_000);
  const progress = totalMinutes > 0 ? remaining / (totalMinutes * 60_000) : 0;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-background p-6 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-label="Screen frozen"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 38%, rgba(0,194,168,0.16), transparent 70%), radial-gradient(50% 40% at 50% 100%, rgba(167,156,255,0.14), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Screen frozen
        </span>

        <p className="mt-7 font-heading text-7xl font-semibold tabular-nums tracking-tight text-foreground">
          {mmss(remaining)}
        </p>

        <div
          className="mx-auto mt-7 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <p className="mt-7 text-sm leading-relaxed text-muted-foreground">
          This is the freeze you set before the break. It lifts on its own when
          the timer runs out — there is no button to skip it.
        </p>

        <p className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <Sparkles className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
          <span className="text-left">
            About {totalMinutes} minute{totalMinutes === 1 ? "" : "s"} without the
            scroll is what this is for. You set it, so it runs.
          </span>
        </p>
      </div>
    </div>
  );
}

/** Small inline status chip for the timer screen while a freeze is pending. */
export function FreezePendingChip({
  remainingMs,
  className,
}: {
  remainingMs: number;
  className?: string;
}) {
  if (remainingMs <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary",
        className,
      )}
    >
      <Lock className="h-3 w-3" aria-hidden="true" />
      Frozen {mmss(remainingMs)}
    </span>
  );
}

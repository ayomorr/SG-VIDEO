import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight, Severity } from "@/lib/engine/types";

export const SEVERITY_STYLES: Record<Severity, string> = {
  calm: "bg-teal/10 text-teal-400",
  mindful: "bg-focus/10 text-focus-400",
  drifting: "bg-lavender/10 text-lavender",
  deep: "bg-coral/10 text-coral",
  spiral: "bg-coral/20 text-coral animate-pulse-soft",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  calm: "Calm",
  mindful: "Mostly mindful",
  drifting: "Drifting",
  deep: "Deep scroll",
  spiral: "Scroll spiral",
};

export const TONE_STYLES: Record<Insight["tone"], string> = {
  info: "border-focus/30 bg-focus/10 text-focus-400",
  good: "border-teal/30 bg-teal/10 text-teal-400",
  warn: "border-coral/30 bg-coral/10 text-coral",
};

export const TONE_ICONS: Record<Insight["tone"], typeof Info> = {
  info: Info,
  good: CheckCircle2,
  warn: AlertTriangle,
};

export function ZapStatus({ tracking }: { tracking: boolean }) {
  if (!tracking) return <ShieldAlert className="h-5 w-5" aria-hidden="true" />;
  return <Zap className="h-5 w-5" aria-hidden="true" />;
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/70 p-6 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal to-focus transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Pill className={SEVERITY_STYLES[severity]}>{SEVERITY_LABELS[severity]}</Pill>
  );
}

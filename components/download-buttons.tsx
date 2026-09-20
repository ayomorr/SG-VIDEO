import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702" />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sg-play" x1="0" y1="0" x2="24" y2="24">
          <stop stopColor="#00C2A8" />
          <stop offset="1" stopColor="#2D6CDF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#sg-play)"
        d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6L12.504 12.02 1.337.924zm12.207 10.065l3.258-3.238L3.45.195A1.466 1.466 0 0 0 2.504.016l11.04 10.973zm0 2.067L2.307 23.989c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"
      />
    </svg>
  );
}

function Badge({
  href,
  disabled,
  icon,
  eyebrow,
  title,
  className,
  children,
}: {
  href?: string;
  disabled?: boolean;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  className?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      <span className="flex items-center gap-3">
        {icon}
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
            {eyebrow}
          </span>
          <span className="text-base font-semibold tracking-tight">{title}</span>
        </span>
      </span>
      {children}
    </>
  );

  const classes = cn(
    "inline-flex h-16 items-center rounded-2xl px-5 transition-all duration-300",
    disabled
      ? "pointer-events-none opacity-50 saturate-50"
      : "hover:-translate-y-0.5 hover:shadow-glow-teal active:translate-y-0",
    className,
  );

  if (disabled) {
    return <div className={classes}>{inner}</div>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {inner}
    </a>
  );
}

export function DownloadButtons({
  className,
  live = siteConfig.isLive,
}: {
  className?: string;
  live?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Badge
        disabled={!live}
        href={siteConfig.appStoreUrl}
        eyebrow="Download on the"
        title="App Store"
        icon={<AppleIcon className="h-9 w-9 text-white" />}
        className="bg-black text-white shadow-soft"
      >
        {!live ? (
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
            Soon
          </span>
        ) : null}
      </Badge>
      <Badge
        disabled={!live}
        href={siteConfig.playStoreUrl}
        eyebrow="GET IT ON"
        title="Google Play"
        icon={<PlayIcon className="h-7 w-7" />}
        className="bg-white text-black shadow-soft"
      >
        {!live ? (
          <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold text-black">
            Soon
          </span>
        ) : null}
      </Badge>
    </div>
  );
}
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

function FloatingCard({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        "glass absolute z-20 hidden rounded-2xl px-4 py-3 text-left shadow-card sm:block",
        className,
      )}
    >
      {children}
    </div>
  );
}

function FeedSkeleton() {
  const rows = [
    { w: "w-2/3", h: "h-2", delay: "" },
    { w: "w-1/2", h: "h-2", delay: "" },
    { w: "w-11/12", h: "h-16", delay: "mt-3" },
    { w: "w-3/4", h: "h-2", delay: "" },
    { w: "w-2/5", h: "h-2", delay: "" },
    { w: "w-11/12", h: "h-12", delay: "mt-3" },
  ];
  return (
    <div className="flex flex-col gap-2 px-4 pt-2" aria-hidden="true">
      {rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-full bg-muted-foreground/20",
            row.w,
            row.h,
            row.delay,
          )}
        />
      ))}
    </div>
  );
}

export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative mx-auto w-[290px] sm:w-[330px]", className)}
      aria-hidden="true"
    >
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/25 blur-3xl animate-pulse-soft" />

      <FloatingCard className="-left-20 top-16 sm:-left-28" style={{ animation: "float 7s ease-in-out infinite" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          Intent set
        </p>
        <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-foreground">
          “Quick scroll · 10 min”
        </p>
      </FloatingCard>

      <FloatingCard
        className="-right-6 bottom-28 sm:-right-24"
        style={{ animation: "float-slow 9s ease-in-out infinite" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-lavender">
          Nudge
        </p>
        <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-foreground">
          Still valuable?
        </p>
      </FloatingCard>

      <FloatingCard
        className="bottom-2 left-1/2 -translate-x-1/2 sm:left-6"
        style={{ animation: "float 8s ease-in-out 1.2s infinite" }}
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" />
          Streak · 12 nights set down
        </p>
      </FloatingCard>

      <div className="relative rounded-[3rem] border border-foreground/10 bg-navy-950 p-3 shadow-2xl">
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

        <div className="relative overflow-hidden rounded-[2.35rem] bg-navy-900">
          <div className="flex items-center justify-between px-6 pb-1 pt-3.5 text-[10px] font-medium text-cloud/60">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.9 6.3 6.9.9-5 4.7 1.3 6.8-6.1-3.3-6.1 3.3L5.2 13.9.2 9.2l6.9-.9z" />
              </svg>
              <span>98%</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-focus to-lavender text-xs font-bold text-white">
              IG
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-cloud">Instagram</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cloud/10">
                <div className="h-full w-[70%] rounded-full bg-primary" />
              </div>
            </div>
          </div>

          <FeedSkeleton />

          <div className="px-4 pb-6 pt-4">
            <div className="flex items-center justify-between rounded-2xl border border-cloud/10 bg-navy-950/80 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 1.2c3.4 1.4 6.5 2 8.1 2.3v6c0 5-3.9 8.4-8.1 10.2C5.8 17.9 1.9 14.5 1.9 9.5v-6C3.5 3.2 6.6 2.6 10 1.2Z" />
                    <path d="M7.4 4.8h5.2L10 7.3l-2.6-2.5Zm-.1 5h5.4L10 12.4l-2.7-2.6Z" fill="#0B1B2B" />
                  </svg>
                </div>
                <span className="font-heading text-lg font-semibold tabular-nums text-cloud">
                  07:42
                </span>
              </div>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                10 min left
              </span>
            </div>
          </div>

          <div
            className="absolute inset-0 z-20 bg-navy-950 animate-dim"
          />
          <div
            className="absolute inset-0 z-20 flex items-center justify-center animate-shield"
          >
<div className="relative flex h-40 w-40 items-center justify-center rounded-full">
                <div className="absolute inset-0 rounded-full border border-primary/40 animate-ping" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-3 rounded-full bg-primary/15 blur-xl" />
                <LogoMark className="relative h-24 w-24 drop-shadow-[0_6px_24px_rgba(0,194,168,0.5)]" />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
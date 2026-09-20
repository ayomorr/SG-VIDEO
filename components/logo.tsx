import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sg-shield" x1="4" y1="2" x2="28" y2="30">
          <stop stopColor="#00C2A8" />
          <stop offset="1" stopColor="#2D6CDF" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.2c5.4 2.3 10.7 3.3 13.4 3.8v9.7c0 8.1-6.3 13.6-13.4 16.4C9 29.3 2.6 23.8 2.6 15.7V6c2.7-.5 8-1.5 13.4-3.8Z"
        fill="url(#sg-shield)"
      />
      <path
        d="M11.8 9.2h8.4l-4.2 5.1 4.2 5.1h-8.4l4.2-5.1-4.2-5.1Z"
        fill="#0B1B2B"
        fillOpacity="0.92"
      />
      <circle cx="16" cy="5" r="1.1" fill="#0B1B2B" fillOpacity="0.9" />
    </svg>
  );
}

export function Logo({
  className,
  iconClass,
}: {
  className?: string;
  iconClass?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={iconClass} />
      <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
        Scroll Guard
      </span>
    </span>
  );
}
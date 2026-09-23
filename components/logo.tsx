import { cn } from "@/lib/utils";

const SPIRAL_PATH =
  "M32.00 29.22 L30.78 29.35 L29.59 29.59 L28.43 29.94 L27.31 30.40 L26.25 30.95 L25.25 31.59 L24.31 32.32 L23.46 33.13 L22.69 34.01 L22.00 34.95 L21.41 35.94 L20.92 36.98 L20.53 38.06 L20.24 39.15 L20.05 40.27 L19.97 41.39 L20.00 42.50 L20.12 43.60 L20.35 44.68 L20.67 45.72 L21.09 46.73 L21.59 47.68 L22.18 48.58 L22.84 49.42 L23.57 50.18 L24.37 50.87 L25.22 51.48 L26.12 52.00 L27.05 52.44 L28.02 52.78 L29.00 53.03 L30.00 53.19 L31.00 53.25 L32.00 53.22 L32.98 53.10 L33.94 52.89 L34.87 52.60 L35.77 52.22 L36.61 51.76 L37.41 51.23 L38.15 50.64 L38.82 49.98 L39.43 49.27 L39.96 48.51 L40.41 47.71 L40.79 46.88 L41.09 46.02 L41.30 45.15 L41.43 44.26 L41.48 43.38 L41.45 42.50 L41.33 41.64 L41.14 40.79 L40.87 39.98 L40.53 39.20 L40.12 38.46 L39.65 37.76 L39.12 37.12 L38.54 36.54 L37.91 36.02 L37.24 35.56 L36.54 35.17 L35.81 34.85 L35.06 34.60 L34.30 34.43 L33.53 34.32 L32.76 34.29 L32.00 34.33 L31.25 34.44 L30.53 34.62 L29.83 34.86 L29.16 35.16 L28.53 35.52 L27.94 35.94 L27.39 36.40 L26.90 36.91 L26.46 37.45 L26.08 38.03 L25.76 38.64 L25.50 39.26 L25.29 39.90 L25.16 40.55 L25.08 41.21 L25.06 41.86 L25.11 42.50 L25.21 43.13 L25.38 43.74 L25.59 44.32 L25.86 44.88 L26.17 45.40 L26.53 45.89 L26.92 46.34 L27.35 46.74 L27.81 47.09 L28.30 47.40 L28.81 47.65 L29.33 47.86 L29.86 48.01 L30.40 48.11 L30.94 48.16 L31.48 48.16 L32.00 48.11 L32.51 48.01 L33.00 47.87 L33.47 47.68 L33.92 47.45 L34.33 47.19 L34.72 46.89 L35.06 46.56 L35.38 46.20 L35.65 45.82 L35.88 45.43 L36.07 45.02 L36.22 44.60 L36.32 44.17 L36.39 43.75 L36.41 43.32 L36.39 42.91 L36.33 42.50 L36.24 42.11 L36.11 41.73 L35.95 41.38 L35.76 41.04 L35.54 40.74 L35.30 40.46 L35.04 40.21 L34.76 39.99 L34.46 39.80 L34.16 39.64 L33.85 39.52 L33.53 39.43 L33.21 39.37 L32.90 39.34 L32.59 39.35 L32.29 39.38 L32.00 39.44 L31.72 39.53 L31.47 39.64 L31.23 39.78 L31.00 39.93 L30.81 40.10 L30.63 40.29 L30.48 40.48 L30.35 40.69 L30.24 40.90 L30.16 41.11 L30.10 41.33 L30.07 41.54 L30.06 41.75 L30.07 41.95 L30.10 42.15 L30.15 42.33 L30.22 42.50 L30.30 42.66 L30.40 42.80 L30.51 42.92 L30.62 43.03 L30.74 43.12 L30.87 43.20 L31.00 43.25 L31.13 43.29 L31.26 43.31 L31.38 43.32 L31.50 43.31 L31.61 43.28 L31.71 43.25 L31.80 43.20 L31.88 43.14 L31.95 43.07 L32.00 43.00";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sd-mark" x1="8" y1="8" x2="56" y2="56">
          <stop stopColor="#00C2A8" />
          <stop offset="0.5" stopColor="#2D6CDF" />
          <stop offset="1" stopColor="#A79CFF" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="#0B1B2B" />
      <rect
        x="20.5"
        y="8"
        width="23"
        height="48"
        rx="6.5"
        fill="#0B1B2B"
        stroke="url(#sd-mark)"
        strokeWidth="2"
      />
      <rect
        x="23.5"
        y="12.5"
        width="17"
        height="39"
        rx="3.5"
        fill="#101F30"
      />
      <path
        d="M32 20 V26"
        stroke="url(#sd-mark)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M27.5 25.5 L32 30.5 L36.5 25.5"
        stroke="url(#sd-mark)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="32" cy="36.2" r="2.2" fill="url(#sd-mark)" />
      <circle cx="32" cy="44.5" r="6" fill="#071321" />
      <circle
        cx="32"
        cy="44.5"
        r="6"
        stroke="url(#sd-mark)"
        strokeWidth="2"
        fill="none"
        opacity="0.9"
      />
      <rect
        x="29.25"
        y="14.75"
        width="5.5"
        height="2"
        rx="1"
        fill="#F7F9FC"
        fillOpacity="0.85"
      />
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
        Scroll Detect
      </span>
    </span>
  );
}

/** Companion mark: a phone whose feed slides down into the vortex. */
export function DoomPhoneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sd-phone" x1="8" y1="8" x2="56" y2="56">
          <stop stopColor="#00C2A8" />
          <stop offset="0.5" stopColor="#2D6CDF" />
          <stop offset="1" stopColor="#A79CFF" />
        </linearGradient>
      </defs>
      <rect x="20.5" y="8" width="23" height="48" rx="6.5" fill="#0B1B2B" stroke="#F7F9FC" strokeOpacity="0.55" strokeWidth="2" />
      <rect x="23.5" y="12.5" width="17" height="39" rx="3.5" fill="#101F30" />
      <rect x="29.25" y="14.75" width="5.5" height="2" rx="1" fill="#F7F9FC" fillOpacity="0.85" />
      {(() => {
        const span = 0.5;
        const tx = 16.7;
        const ty = 15.1;
        return (
          <path
            transform={`translate(${tx} ${ty}) scale(${span})`}
            d={SPIRAL_PATH}
            stroke="url(#sd-phone)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })()}
      <circle cx="32" cy="36.7" r="1.3" fill="url(#sd-phone)" />
      <path
        d="M32 20.5 V28.5"
        stroke="#F7F9FC"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M29 26.5 L32 29.5 L35 26.5"
        stroke="#F7F9FC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      <rect x="30" y="47.5" width="4" height="1.4" rx="0.7" fill="#F7F9FC" fillOpacity="0.5" />
    </svg>
  );
}
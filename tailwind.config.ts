import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      colors: {
        border: "rgb(var(--border) / 0.14)",
        input: "rgb(var(--border) / 0.24)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        navy: {
          950: "#0B1B2B",
          900: "#0F2136",
          800: "#12263D",
          700: "#16314A",
          600: "#1C3A58",
        },
        teal: {
          DEFAULT: "#00C2A8",
          600: "#00B7A0",
          400: "#2BD4BE",
          dim: "#0E847B",
        },
        focus: {
          DEFAULT: "#2D6CDF",
          400: "#5B8BF0",
          600: "#1E55B8",
        },
        coral: {
          DEFAULT: "#FF6B5A",
          dim: "#B84A3F",
          soft: "#46201C",
        },
        amber: {
          DEFAULT: "#F5A623",
          dim: "#B8790F",
          soft: "#3D2E0C",
        },
        cloud: "#F7F9FC",
        lavender: {
          DEFAULT: "#A79CFF",
          soft: "#E9E6FF",
          dim: "#4A4380",
        },
        mist: "#94A3B8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 20px 50px -12px rgba(2, 10, 20, 0.28), 0 4px 16px -6px rgba(2, 10, 20, 0.14)",
        card: "0 1px 2px rgba(2, 10, 20, 0.2), 0 12px 32px -12px rgba(2, 10, 20, 0.22)",
        "glow-teal": "0 16px 44px -12px rgba(0, 194, 168, 0.4)",
        "glow-lavender": "0 16px 44px -12px rgba(167, 156, 255, 0.35)",
        "glow-focus": "0 16px 44px -12px rgba(45, 108, 223, 0.4)",
        "inner-ring": "inset 0 0 0 1px rgba(247, 249, 252, 0.06)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(120deg, #00C2A8 0%, #2D6CDF 55%, #A79CFF 120%)",
        "gradient-hero": "radial-gradient(60rem 30rem at 80% -10%, rgba(0,194,168,0.16), transparent 60%), radial-gradient(45rem 26rem at 10% 110%, rgba(167,156,255,0.14), transparent 60%)",
        "radial-teal": "radial-gradient(circle, rgba(0,194,168,0.28), transparent 70%)",
        "radial-lavender": "radial-gradient(circle, rgba(167,156,255,0.3), transparent 70%)",
        "grid-faint":
          "linear-gradient(rgb(var(--foreground) / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--foreground) / 0.035) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1.5deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.96)" },
        },
        shield: {
          "0%": { opacity: "0", transform: "scale(0.7)" },
          "18%": { opacity: "1", transform: "scale(1.06)" },
          "30%": { transform: "scale(1)" },
          "70%": { opacity: "1", transform: "scale(1)" },
          "88%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "0", transform: "scale(0.7)" },
        },
        dim: {
          "0%": { opacity: "0" },
          "18%": { opacity: "0.85" },
          "70%": { opacity: "0.85" },
          "88%": { opacity: "0" },
          "100%": { opacity: "0" },
        },
        breathe: {
          "0%, 100%": { transform: "rotate(-4deg) scale(0.96)", opacity: "0.7" },
          "50%": { transform: "rotate(4deg) scale(1.04)", opacity: "1" },
        },
        tick: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.3s ease-out",
        "accordion-up": "accordion-up 0.3s ease-out",
        float: "float 7s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3.5s ease-in-out infinite",
        shield: "shield 7s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        dim: "dim 7s ease-in-out infinite",
        breathe: "breathe 14s ease-in-out infinite",
        shimmer: "shimmer 2.6s linear infinite",
        "fade-in": "fade-in 0.4s ease-out",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
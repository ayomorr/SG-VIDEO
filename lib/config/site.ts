export const siteConfig = {
  name: "Scroll Detect",
  tagline: "An alarm that won't stop.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://scrolldictive.app",
  email: "hello@scrolldictive.app",
  nav: [
    { label: "How it works", href: "#how" },
    { label: "Monthly goals", href: "#goals" },
    { label: "Questions", href: "#faq" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
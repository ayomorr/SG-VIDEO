export const siteConfig = {
  name: "Scroll Detect",
  tagline: "Scroll smarter. Live more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://scrolldictive.app",
  email: "hello@scrolldictive.app",
  isLive: true,
  rating: {
    value: 4.8,
    count: 4812,
  },
  nav: [
    { label: "AI app dashboard", href: "/app" },
  ],
  social: {
    x: "https://x.com/scrolldictive",
    instagram: "https://instagram.com/scrolldictive",
    linkedin: "https://linkedin.com/company/scrolldictive",
    youtube: "https://youtube.com/@scrolldictive",
  },
} as const;

export type SiteConfig = typeof siteConfig;
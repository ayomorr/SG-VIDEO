export const siteConfig = {
  name: "Scroll Detect",
  tagline: "Scroll smarter. Live more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://scrolldictive.app",
  email: "hello@scrolldictive.app",
  isLive: true,
  appStoreUrl: "https://apps.apple.com/app/scrolldictive/id0000000000",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.scrolldictive.app",
  downloadPath: "/download",
  storeMeta: {
    size: "9.4 MB",
    platforms: ["iOS 15+", "Android 8+"],
    price: "Free · No ads",
  },
  rating: {
    value: 4.8,
    count: 4812,
  },
  nav: [
    { label: "How it works", href: "#how" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
    { label: "AI dashboard", href: "/app" },
  ],
  social: {
    x: "https://x.com/scrolldictive",
    instagram: "https://instagram.com/scrolldictive",
    linkedin: "https://linkedin.com/company/scrolldictive",
    youtube: "https://youtube.com/@scrolldictive",
  },
} as const;

export type SiteConfig = typeof siteConfig;
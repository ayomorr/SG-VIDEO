export const siteConfig = {
  name: "Scroll Guard",
  tagline: "Scroll smarter. Live more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://scrollguard.app",
  email: "hello@scrollguard.app",
  isLive: true,
  appStoreUrl: "https://apps.apple.com/app/scroll-guard/id0000000000",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.scrollguard.app",
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
  ],
  social: {
    x: "https://x.com/scrollguard",
    instagram: "https://instagram.com/scrollguard",
    linkedin: "https://linkedin.com/company/scroll-guard",
    youtube: "https://youtube.com/@scrollguard",
  },
} as const;

export type SiteConfig = typeof siteConfig;
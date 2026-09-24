import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Scroll Detect — Scroll smarter. Live more.",
    template: "%s — Scroll Detect",
  },
  description:
    "Scroll Detect helps you keep the evening you actually wanted. Log your own scrolling, learn what drags you into a spiral, and let a break timer do the remembering — private by design, no account needed.",
  applicationName: siteConfig.name,
  keywords: [
    "doomscrolling",
    "screen time",
    "app blocker",
    "digital wellbeing",
    "reduce screen time",
    "scroll less",
    "quiet hours",
  ],
  openGraph: {
    title: "Scroll Detect — Scroll smarter. Live more.",
description:
    "Your phone shouldn't steal your night. Scroll Detect gives your evenings back — no background tracking, no blocking, no account.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scroll Detect — Scroll smarter. Live more.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scroll Detect — Scroll smarter. Live more.",
    description:
      "Your phone shouldn't steal your night. Scroll Detect gives your evenings back.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Scroll Detect",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [
      { url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
    "theme-color": "#0B1B2B",
    "application-name": "Scroll Detect",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B1B2B" },
    { media: "(prefers-color-scheme: light)", color: "#F7F9FC" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Scroll Detect",
  url: siteConfig.url,
  description:
    "Anti-doomscrolling web app that helps adults take back their screen time. Session logging, doom-scroll detection, risk predictions, trigger insights, break timer with alarm, and on-device privacy.",
  applicationCategory: "HealthAndFitnessApplication",
  operatingSystem: "iOS, Android",
  offers: {
    "@type": "Offer",
    name: "Scroll Detect",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: siteConfig.rating.value.toString(),
    ratingCount: siteConfig.rating.count.toString(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} bg-background font-sans text-foreground antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>
          <main id="main">{children}</main>
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
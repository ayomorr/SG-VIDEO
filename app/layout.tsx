import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/lib/config/site";
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

/**
 * Bundled in app/fonts and used for the timer digits and small stat figures. A
 * monospace face with true tabular figures is what makes a countdown read as a
 * number rather than as shifting text.
 */
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description:
    "An alarm you cannot snooze. Scroll Detect warns you just before your break is over, rings when it ends, and keeps ringing until you have answered at least four questions about why you started scrolling.",
  applicationName: siteConfig.name,
  keywords: [
    "break reminder",
    "doomscrolling",
    "focus timer",
    "digital wellbeing",
    "screen break reminder",
    "phone alarm",
  ],
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description:
      "Set a break. It warns you just before it's over, rings when the break ends, and will not stop until you have answered at least four questions.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description:
      "Set a break. It warns you just before it's over, rings when the break ends, and will not stop until you have answered at least four questions.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent",
  },
  // The phone mark, in every form the browsers and OSes ask for. All generated
  // from app/icon.svg — see scripts/gen-icons.js.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: [
      { url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
    "theme-color": "#0B1B2B",
    "application-name": siteConfig.name,
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
  name: siteConfig.name,
  url: siteConfig.url,
  description:
    "An alarm for taking breaks that cannot be snoozed: a heads-up before the end, and an alarm that keeps ringing until the reflection is answered. Sessions, insights and timer state stay in the browser.",
  applicationCategory: "HealthAndFitnessApplication",
  operatingSystem: "iOS, Android",
  offers: {
    "@type": "Offer",
    name: siteConfig.name,
    price: "0",
    priceCurrency: "USD",
  },
  // No `aggregateRating` here on purpose. There are no real reviews to report,
  // and invented rating markup is a manual-action risk, not a ranking trick.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${geistMono.variable} bg-background font-sans text-foreground antialiased`}
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
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Home } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { DownloadButtons } from "@/components/download-buttons";
import { QRCode } from "@/components/qr-code";
import { EmailCapture } from "@/components/email-capture";
import { InstallPanel } from "@/components/install-panel";
import { siteConfig } from "@/lib/site";

type Platform = "apple" | "android" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  const touch = navigator.maxTouchPoints > 1;
  const iOS =
    /iphone|ipod/.test(ua) ||
    (/ipad/.test(ua) || (navigator.platform === "MacIntel" && touch));
  const android = /android/.test(ua);
  if (iOS) return "apple";
  if (android) return "android";
  return null;
}

export function DownloadPageClient() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    if (!platform) return;
    const url =
      platform === "apple"
        ? siteConfig.appStoreUrl
        : siteConfig.playStoreUrl;
    const t = setTimeout(() => {
      setRedirecting(true);
      window.location.href = url;
    }, 900);
    return () => clearTimeout(t);
  }, [platform]);

  const storeName =
    platform === "apple" ? "App Store" : platform === "android" ? "Google Play" : null;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-6 pb-24 pt-32 md:pt-40">
      <div
        className="absolute right-0 top-0 h-72 w-72 rounded-full bg-teal/15 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-0 h-72 w-72 rounded-full bg-lavender/15 blur-[100px]"
        aria-hidden="true"
      />

      <LogoMark className="h-16 w-16" />

      <h1 className="mt-6 text-center font-heading text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
        Get Scroll Guard
      </h1>
      <p className="mt-4 max-w-xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
        {redirecting && storeName
          ? `Opening the ${storeName}…`
          : "Free to start. iOS & Android. Two taps and your evenings are yours again."}
      </p>

      {platform && !redirecting ? (
        <div className="mt-8 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" aria-hidden="true" />
          Detected: {storeName}. Redirecting…
        </div>
      ) : null}

      <div
        className={`mt-10 w-full rounded-[2rem] border bg-card p-8 shadow-soft md:p-12 ${
          redirecting ? "opacity-60" : ""
        }`}
      >
        <DownloadButtons className="justify-center" />
        <div className="my-8 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            or get it by email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="mx-auto max-w-sm">
          <EmailCapture
            cta="Send download link"
            note="We'll send the right store link in one quick email."
          />
        </div>

        <div className="mt-8">
          <InstallPanel headline="Prefers a laptop?" />
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-8">
          <QRCode size={132} />
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {siteConfig.storeMeta.size} · {siteConfig.storeMeta.price}
          </p>
        </div>
      </div>

      <a
        href="/"
        className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        Back to home
      </a>
    </main>
  );
}
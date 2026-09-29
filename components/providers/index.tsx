"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Production only. The SW caches same-origin assets with
    // stale-while-revalidate, which in dev means a chunk edit silently keeps
    // serving the previous build. The alarm does not depend on the SW — the
    // notification path falls back to the plain Notification constructor.
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}
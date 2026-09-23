"use client";

import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void> };

const INSTALLED_KEY = "scrolldictive.installed.v1";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function rememberInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    // Storage may be unavailable; non-fatal.
  }
}

/**
 * One-time install flow. Once installed (or already running standalone), it
 * stops offering installation and sends the user to the app landing page.
 */
export function useInstallState() {
  const [installEvent, setInstallEvent] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(INSTALLED_KEY) === "1";
    } catch {
      // Storage may be unavailable.
    }
    setInstalled(stored || isStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as PromptEvent);
    };
    const onInstalled = () => {
      rememberInstalled();
      setInstalled(true);
      setInstallEvent(null);
      if (typeof window !== "undefined" && window.location.pathname !== "/app") {
        window.location.assign("/app");
      }
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return { installEvent, installed };
}
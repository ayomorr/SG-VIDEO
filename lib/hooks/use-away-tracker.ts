"use client";

import { useEffect, useRef, useState } from "react";
import { addSession } from "@/lib/store";
import { uuid } from "@/lib/engine/format";

const SETTING_KEY = "scrolldictive.awaytrack.v1";
/** An away spell shorter than this is noise (quick tab switch, dialog, etc.). */
const MIN_AWAY_MS = 45_000;
/** Spells longer than this are probably sleep, not scrolling — don't log them. */
const MAX_AWAY_MS = 2 * 60 * 60_000;
const LIVE_TICK_MS = 1_000;

export function loadAwayTracking(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(SETTING_KEY) !== "0";
}

export function saveAwayTracking(on: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SETTING_KEY, on ? "1" : "0");
}

export interface AwayTrackerState {
  tracking: boolean;
  toggle: () => void;
  awayNow: boolean;
  awayMs: number;
}

function logAway(startAt: number, endAt: number) {
  try {
    addSession({
      id: `away-${uuid()}`,
      app: "Other apps",
      category: "other",
      startAt,
      endAt,
      moodBefore: null,
      moodAfter: null,
      note: "Auto-detected: away from Scroll Detect",
      source: "auto",
    });
  } catch {
    // Storage may be unavailable; non-fatal.
  }
}

/**
 * Watches the page lifecycle (`visibilitychange`, `blur`/`focus`,
 * `pagehide`/`pageshow`) and logs a continuous scrolling run whenever the user
 * leaves Scroll Detect for another app and comes back.
 *
 * The web can never name the other app, so the run is logged as "Other apps".
 * Spells under 45s are ignored; spells over 2h are treated as sleep.
 */
export function useAwayTracker(): AwayTrackerState {
  const [tracking, setTracking] = useState(true);
  const [awayNow, setAwayNow] = useState(false);
  const [awayMs, setAwayMs] = useState(0);

  const trackingRef = useRef(true);
  const hiddenAtRef = useRef<number | null>(null);
  const firstRef = useRef(false);

  useEffect(() => {
    setTracking(loadAwayTracking());
  }, []);

  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  const toggle = () => {
    setTracking((prev) => {
      const next = !prev;
      saveAwayTracking(next);
      return next;
    });
  };

  useEffect(() => {
    const startedHidden = document.visibilityState === "hidden";
    firstRef.current = !startedHidden;

    const beginAway = () => {
      if (!firstRef.current) {
        firstRef.current = true;
        return;
      }
      if (hiddenAtRef.current == null) {
        hiddenAtRef.current = Date.now();
        setAwayNow(true);
      }
    };

    const endAway = () => {
      const hidden = hiddenAtRef.current;
      if (hidden == null) {
        if (!firstRef.current) firstRef.current = true;
        return;
      }
      const endAt = Date.now();
      const away = endAt - hidden;
      hiddenAtRef.current = null;
      setAwayNow(false);

      if (trackingRef.current && away >= MIN_AWAY_MS && away <= MAX_AWAY_MS) {
        logAway(hidden, endAt);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") beginAway();
      else endAway();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", beginAway);
    window.addEventListener("focus", endAway);
    window.addEventListener("pagehide", beginAway);
    window.addEventListener("pageshow", endAway);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", beginAway);
      window.removeEventListener("focus", endAway);
      window.removeEventListener("pagehide", beginAway);
      window.removeEventListener("pageshow", endAway);
    };
  }, []);

  useEffect(() => {
    if (!awayNow) {
      setAwayMs(0);
      return;
    }
    const id = window.setInterval(() => {
      const started = hiddenAtRef.current;
      if (started == null) return;
      setAwayMs(Math.min(Date.now() - started, MAX_AWAY_MS));
    }, LIVE_TICK_MS);
    return () => clearInterval(id);
  }, [awayNow]);

  return { tracking, toggle, awayNow, awayMs };
}
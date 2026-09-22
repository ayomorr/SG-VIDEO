"use client";

import { useEffect, useRef, useState } from "react";

const SETTING_KEY = "scrolldictive.awaytrack.v1";
/** Spells longer than this just show a capped timer — they are never logged. */
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

/**
 * Watches the page lifecycle (`visibilitychange`, `blur`/`focus`,
 * `pagehide`/`pageshow`) and reports how long the user was away — it never
 * guesses that away-time was scrolling. The web can't name the other app, so
 * Scroll Detect never writes a session from absence: scrolling is only
 * recorded when the user logs it (log form, live scroll run, or import).
 */
export function useAwayTracker(): AwayTrackerState {
  const [tracking, setTracking] = useState(true);
  const [awayNow, setAwayNow] = useState(false);
  const [awayMs, setAwayMs] = useState(0);

  const hiddenAtRef = useRef<number | null>(null);
  const firstRef = useRef(false);

  useEffect(() => {
    setTracking(loadAwayTracking());
  }, []);

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
      hiddenAtRef.current = null;
      setAwayNow(false);
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
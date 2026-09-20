"use client";

import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function Counter({
  to,
  duration = 1600,
  time = false,
  className,
}: {
  to: number;
  duration?: number;
  time?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;

    const format = (value: number) => {
      if (time) {
        const hours = Math.floor(value);
        const minutes = String(Math.round((value % 1) * 60)).padStart(2, "0");
        return `${hours}h ${minutes}m`;
      }
      return String(Math.round(value));
    };

    const finalText = format(to);

    if (reduce) {
      el.textContent = finalText;
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce, time]);

  return (
    <span ref={ref} className={className} aria-label={`${to}${time ? " hours and minutes" : ""}`}>
      {time ? "0h 00m" : "0"}
    </span>
  );
}
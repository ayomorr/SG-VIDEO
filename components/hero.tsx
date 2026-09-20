"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, Check, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/phone-mockup";

const primaryLabel = "Download the app";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-screen items-center overflow-hidden pb-24 pt-32 md:pt-36"
    >
      <div className="bg-grid-faint absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

      <motion.div
        aria-hidden="true"
        style={reduce ? undefined : { y: blobY }}
        className="absolute -right-40 top-10 h-[30rem] w-[30rem] rounded-full bg-teal/20 blur-[120px]"
      />
      <motion.div
        aria-hidden="true"
        style={reduce ? undefined : { y: blobY }}
        className="absolute -left-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-lavender/20 blur-[120px]"
      />

      <div className="container relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-8">
          <motion.div style={reduce ? undefined : { y: textY, opacity: fade }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-start gap-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" aria-hidden="true" />
                Anti-doomscrolling, zero quitting required
              </span>

              <h1 className="font-heading text-[clamp(2.6rem,6vw,4.2rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                Your phone shouldn’t{" "}
                <span className="text-gradient">steal your night.</span>
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Scroll Guard gives your evenings back — without quitting the
                apps you love. Set an intention, get a gentle nudge, and let a
                quiet timer do the remembering for you.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="xl">
                  <a href="/download">{primaryLabel}</a>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <a href="#how">
                    <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    See how it works
                  </a>
                </Button>
              </div>

              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Free to start", "iOS & Android", "Private by design"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ),
                )}
              </ul>

              <a
                href="#problem"
                className="mt-2 hidden items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-primary lg:flex"
              >
                Scroll to see the problem
                <ArrowDown className="h-3.5 w-3.5 animate-bounce" aria-hidden="true" />
              </a>
            </motion.div>
          </motion.div>

          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
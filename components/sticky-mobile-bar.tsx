"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const label = "Download";

export function StickyMobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        >
          <div className="glass border-t border-white/10 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold text-foreground">
                  Get Scroll Guard
                </p>
                <p className="text-xs text-muted-foreground">
                  Free · No ads · Private by design
                </p>
              </div>
              <a
                href="#download"
                className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-transform active:scale-95"
              >
                {label}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
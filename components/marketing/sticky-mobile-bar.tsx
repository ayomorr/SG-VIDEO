"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { InstallButton } from "@/components/marketing/install-button";

export function StickyMobileBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hidden = pathname === "/app";

  return (
    <AnimatePresence>
      {!hidden && visible ? (
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
                  Get Scroll Detect
                </p>
                <p className="text-xs text-muted-foreground">
                  Free · No ads · Private by design
                </p>
              </div>
              <InstallButton size="md" placement="top" />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
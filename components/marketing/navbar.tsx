"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { InstallButton } from "@/components/marketing/install-button";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container">
        <nav
          aria-label="Main"
          className={cn(
            "mt-3 flex h-16 items-center justify-between gap-3 rounded-full px-4 transition-all duration-300 md:px-5",
            scrolled || open ? "glass shadow-card" : "border border-transparent",
          )}
        >
          <a
            href="#top"
            className="flex items-center gap-2 rounded-full focus-visible:outline-2"
            aria-label="Scroll Detect home"
          >
            <Logo iconClass="h-8 w-8" />
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:block">
              <InstallButton size="sm" />
            </div>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="glass mt-2 overflow-hidden rounded-3xl p-3 shadow-soft md:hidden"
            >
              <ul className="flex flex-col gap-1">
                {siteConfig.nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
                <li className="pt-2">
                  <InstallButton size="lg" fullWidth />
                </li>
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
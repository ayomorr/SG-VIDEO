import { ArrowUp } from "lucide-react";
import { Logo } from "@/components/logo";
import { siteConfig } from "@/lib/config/site";

const columns = [
  {
    title: "Use it",
    links: [
      { label: "Add to home screen", href: "/app" },
      { label: "Add to home", href: "/#top" },
    ],
  },
  {
    title: "Read",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Questions", href: "#faq" },
    ],
  },
  {
    title: "Contact",
    links: [{ label: "Email us", href: `mailto:${siteConfig.email}` }],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border pb-28 pt-14 md:pb-12">
      <div
        className="absolute -left-24 -top-16 h-[18rem] w-[18rem] animate-float-slow rounded-full bg-teal/10 blur-[100px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5">
            <a href="#top" aria-label="Scroll Detect home" className="inline-flex w-fit">
              <Logo slogan="Scroll less, live more" />
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              An alarm you cannot snooze, and nothing else.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {column.title}
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {year} Scroll Detect.
          </p>
          <a
            href="#top"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
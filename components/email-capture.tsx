"use client";

import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "done" | "error";

export function EmailCapture({
  cta = "Notify me",
  placeholder = "you@example.com",
  note,
  align = "start",
  compact = false,
}: {
  cta?: string;
  placeholder?: string;
  note?: string;
  align?: "start" | "center";
  compact?: boolean;
}) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent: "link" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4",
          align === "center" && "justify-center text-center",
        )}
        role="status"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className={cn(align === "center" && "text-left")}>
          <p className="text-sm font-semibold text-foreground">
            You're in. Check your inbox.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We'll send your download link in a minute or two.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className={cn("flex flex-col gap-3", !compact && "sm:flex-row")}>
        <label htmlFor={uid} className="sr-only">
          Email address
        </label>
        <Input
          id={uid}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className={cn("h-12", !compact && "sm:max-w-xs")}
          aria-describedby={status === "error" ? `${uid}-error` : undefined}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={cn(
            "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60",
            compact && "w-full",
          )}
        >
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
          {status === "sending" ? "Sending…" : cta}
        </button>
      </div>

      {status === "error" ? (
        <p
          id={`${uid}-error`}
          className={cn("mt-2 text-xs font-medium text-coral", align === "center" && "text-center")}
          role="alert"
        >
          That email didn't look right — double-check and try again.
        </p>
      ) : null}

      {note ? (
        <p
          className={cn(
            "mt-3 text-xs text-muted-foreground",
            align === "center" && "text-center",
          )}
        >
          {note}
        </p>
      ) : null}
    </form>
  );
}
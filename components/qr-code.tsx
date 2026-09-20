"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

export function QRCode({
  size = 148,
  className,
  caption = "Scan to download",
}: {
  size?: number;
  className?: string;
  caption?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/download`);
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="rounded-3xl bg-white p-4 shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow-teal">
        {url ? (
          <QRCodeSVG
            value={url}
            size={size}
            level="M"
            marginSize={0}
            fgColor="#0B1B2B"
            bgColor="#FFFFFF"
          />
        ) : (
          <div
            className="rounded-lg bg-mist/20"
            style={{ width: size, height: size }}
            aria-hidden="true"
          />
        )}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{caption}</p>
    </div>
  );
}
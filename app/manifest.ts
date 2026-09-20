import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scroll Guard — Scroll smarter. Live more.",
    short_name: "Scroll Guard",
    description:
      "Scroll Guard gives your evenings back without quitting social media. Set an intention, get a gentle nudge, and let a quiet timer do the remembering.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B1B2B",
    theme_color: "#0B1B2B",
    categories: ["productivity", "utilities", "health"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
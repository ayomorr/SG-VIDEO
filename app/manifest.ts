import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scroll Detect — Scroll smarter. Live more.",
    short_name: "Scroll Detect",
    description:
      "Scroll Detect helps you keep the evening you actually wanted. Log your own scrolling, learn what drags you into a spiral, and let a break timer do the remembering.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
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
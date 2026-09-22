import { DownloadPageClient } from "@/components/download-page-client";

export const metadata = {
  title: "Download",
  description:
    "Get Scroll Detect on your iPhone or Android. Free to start, private by design, and ready in two taps.",
  alternates: {
    canonical: "/download",
  },
};

export default function DownloadPage() {
  return <DownloadPageClient />;
}
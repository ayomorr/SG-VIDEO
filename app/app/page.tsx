import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export const metadata: Metadata = {
  title: "Smart dashboard",
  description:
    "Scroll Detect's on-device AI: detect doomscrolling patterns, get contextual interventions, personalized insights, risky-period predictions, and an accountability companion.",
  alternates: {
    canonical: "/app",
  },
};

export default function AppPage() {
  return (
    <OnboardingGate>
      <DashboardClient />
    </OnboardingGate>
  );
}
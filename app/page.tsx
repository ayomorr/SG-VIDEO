import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { LiveDemo } from "@/components/live-demo";
import { Testimonials } from "@/components/testimonials";
import { Results } from "@/components/results";
import { DownloadSection } from "@/components/download-section";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <LiveDemo />
      <Testimonials />
      <Results />
      <DownloadSection />
      <Faq />
      <FinalCta />
    </>
  );
}
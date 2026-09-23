import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Faq />
      <FinalCta />
    </>
  );
}
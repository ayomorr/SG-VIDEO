import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MonthlyGoals } from "@/components/marketing/monthly-goals";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <MonthlyGoals />
      <Faq />
      <FinalCta />
    </>
  );
}
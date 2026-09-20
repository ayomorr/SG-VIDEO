import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

const faqs = [
  {
    q: "Is my data really private?",
    a: "Yes. Everything — your limits, your streaks, your quiet hours — lives on your device only. Scroll Guard has no account system, no analytics, and nothing that phones home. If we can't see your data, neither can anyone else.",
  },
  {
    q: "Will Scroll Guard block my apps?",
    a: "No, and that's on purpose. Scroll Guard pauses — it never blocks, locks, or punishes. When a limit ends, the app takes a breath and hands the decision back to you. A coach, not a warden.",
  },
  {
    q: "Does it drain my battery?",
    a: "Barely. Scroll Guard doesn't run a background scanner. It's a lightweight countdown engine that checks in only when an app you've set a limit on opens — most days that's less than 1% of your battery.",
  },
  {
    q: "Which platforms are supported?",
    a: "Scroll Guard runs on iOS 15+ and Android 8+. iPhone and Android phones are both first-class citizens. Watch and desktop versions are on the roadmap.",
  },
  {
    q: "Is Scroll Guard really free?",
    a: "Completely. No free trial countdown, no subscription, no paywall hiding the useful features. It's free to download and free to keep using, forever. If we ever add optional extras, the basics stay free.",
  },
  {
    q: "Where is my data stored?",
    a: "On your phone. Full stop. We don't run a Scroll Guard server for your data, so there's nothing to store. You can export your streaks anytime — they're yours to keep and take wherever you like.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions people actually ask."
          description="Short answers, no fine print. Anything else? Write to hello@scrollguard.app."
        />

        <Reveal>
          <Accordion type="single" collapsible className="mx-auto flex max-w-3xl flex-col gap-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
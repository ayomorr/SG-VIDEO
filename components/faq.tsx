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
    a: "Your sessions, insights, timers, and coach history live in your browser's local storage on your device — Scroll Detect has no account system and no server database of your scrolling. The only thing that can leave your device is the optional AI Coach: if you configure an AI provider key, a short anonymous summary of your week is sent to that provider. That feature is off by default.",
  },
  {
    q: "Will Scroll Detect block my apps?",
    a: "It can't, and it doesn't try. A website can't pause or lock other apps on your phone. Instead it makes your own scrolling visible — patterns, triggers, predictions, an honest coach — and leaves every decision to you. No blocking, no locks, no punishment.",
  },
  {
    q: "Does it drain my battery?",
    a: "It's a web app, not a background scanner. It only runs while you have the dashboard or the break timer open in a tab, and all the counting is lightweight. When it's closed, it uses nothing.",
  },
  {
    q: "Which platforms are supported?",
    a: "Any modern browser. It installs as a Progressive Web App from Android Chrome or iOS Safari (iOS 16.4+, which also gives you notifications) — no App Store or Play Store needed. Wrapping it in native iOS/Android apps is on the roadmap.",
  },
  {
    q: "Is Scroll Detect really free?",
    a: "Yes. Right now there's no account, no subscription, and nothing to pay for. If optional extras are ever added, the core stays free.",
  },
  {
    q: "Where is my data stored?",
    a: "In your browser's local storage on your device. We don't run a server that stores your sessions, so there's nothing to hand over. You can reset or clear all of it from the dashboard's data controls at any time.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions people actually ask."
          description="Straight answers about how this PWA really works — no fine print, no store promises."
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
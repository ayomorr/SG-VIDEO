import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

const faqs = [
  {
    q: "Can it actually block my apps?",
    a: "No, and it does not claim to. A web page has no way to pause another app on your phone \u2014 anything offering that needs an accessibility service, a VPN, or a device admin prompt, and all three can see everything you do. Scroll Detect holds the one surface it does control: the screen in front of you.",
  },
  {
    q: "How do I make the alarm stop?",
    a: "By answering the questions it raises when the break ends. One to three are drawn at random, and the pool includes \u201cIf you continue scrolling for another 30 minutes, will you be okay with that?\u201d and \u201cHow do you feel after this session?\u201d The alarm does not stop because you reached for it. It stops because you answered.",
  },
  {
    q: "What if I close the tab, or my phone dies?",
    a: "The break is tracked against wall-clock time rather than a counter, so it still ends on schedule. If the tab was closed while the alarm was owed, it re-arms the moment you open the app again \u2014 the same way an alarm clock you ignored is still owed when you wake up.",
  },
  {
    q: "Can I turn the alarm down or off?",
    a: "You can mute it, and pick between two recordings. But mute only silences the siren itself \u2014 when the break ends, the vibration and the notification still fire. There is no switch that turns off the whole alarm, which is the difference between this and a kitchen timer.",
  },
  {
    q: "Where is my data stored?",
    a: "In this browser's local storage, on this device. There is no account system and no database of your scrolling. Sessions, insights, timer preferences and reflection answers all stay local, and the dashboard has a control to wipe them.",
  },
  {
    q: "Is the coach sending my data somewhere?",
    a: "Only if you configure an AI provider key yourself, and even then only the message you typed plus a short summary. Unset that key and a local rules engine answers instead. Nothing else on this page talks to a server about your scrolling.",
  },
  {
    q: "Which devices does this work on?",
    a: "Any modern browser. It installs as a PWA from Android Chrome or iOS Safari \u2014 iOS needs 16.4+ for notifications, and the alarm relies on notification permission plus a wake lock, which is why it asks for both when you press start rather than burying them in settings.",
  },
  {
    q: "Does it cost anything?",
    a: "No. No subscription, no account, no ads. If that ever changes the timer itself stays free.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-24 overflow-hidden border-b border-border py-20 md:py-28"
    >
      <div
        className="absolute -right-32 top-0 h-[24rem] w-[24rem] animate-float rounded-full bg-teal/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="absolute -left-32 bottom-0 h-[20rem] w-[20rem] animate-float-slow rounded-full bg-amber/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <SectionHeading
          eyebrow="Questions"
          title="The parts other apps in this category skip."
          description="Including the one about what it cannot do."
        />

        <Reveal>
          <Accordion
            type="single"
            collapsible
            className="flex max-w-3xl flex-col border-t border-border"
          >
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="border-b border-border"
              >
                <AccordionTrigger className="text-left text-base hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
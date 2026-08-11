import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I book a ride?",
    answer:
      "Open JhapaRide, enter your pickup and destination, choose bike or car, and confirm. A nearby verified rider will accept your request.",
  },
  {
    question: "How is the fare calculated?",
    answer:
      "Fares are based on a base fare plus a per-kilometer and per-minute rate for your chosen service, shown to you before you confirm the ride.",
  },
  {
    question: "How do I become a rider?",
    answer:
      "Register as a rider, complete the onboarding wizard with your license and vehicle documents, and wait for admin verification.",
  },
  {
    question: "Is JhapaRide available everywhere in Jhapa?",
    answer:
      "We currently cover major towns including Birtamode, Damak, Bhadrapur, Mechinagar, Kakarbhitta and more. Check the coverage page for the full list.",
  },
  {
    question: "How do I cancel?",
    answer:
      "You can cancel from your active ride screen before the rider arrives. A cancellation reason is required and repeated cancellations may incur a fee.",
  },
  {
    question: "How do payments work?",
    answer:
      "You can pay by cash or through your JhapaRide wallet. Online payment options are being rolled out for select areas.",
  },
  {
    question: "How do I report a problem?",
    answer:
      "Use the Support section in your dashboard to open a ticket about a ride, payment, or safety issue — our team will follow up.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-secondary/30 py-20 sm:py-28">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}

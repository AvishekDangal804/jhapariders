import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";

const reasons = [
  "Built local to Jhapa — routes and pricing that make sense for our towns",
  "Transparent pricing shown before you book, no surprises",
  "Every rider is identity and vehicle verified",
  "Fast matching with nearby riders",
  "Live tracking on every trip",
  "Reliable support whenever you need it",
];

export function WhyJhapaRideSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <SectionHeading
          align="left"
          eyebrow="Why JhapaRide"
          title="Made for Jhapa, not adapted from somewhere else"
          description="We designed JhapaRide around how people actually move around Birtamode, Damak, Kakarbhitta and beyond."
        />
        <ul className="grid gap-4 sm:grid-cols-2">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-sm text-foreground/90">{reason}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

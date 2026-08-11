import Link from "next/link";
import {
  BadgeCheck,
  FileCheck2,
  History,
  LifeBuoy,
  ShieldAlert,
  Star,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

const points = [
  { icon: BadgeCheck, title: "Verified riders", description: "Every rider goes through identity verification before approval." },
  { icon: FileCheck2, title: "Vehicle verification", description: "Registration and insurance documents are checked by our team." },
  { icon: ShieldAlert, title: "Trip sharing & SOS", description: "Share your live trip and trigger emergency alerts if you need help." },
  { icon: Star, title: "Ratings both ways", description: "Passengers and riders rate each other after every completed ride." },
  { icon: History, title: "Full ride history", description: "Every trip is logged with route, fare and time for your records." },
  { icon: LifeBuoy, title: "Responsive support", description: "Our support team is reachable for any issue during your ride." },
];

export function SafetySection() {
  return (
    <section id="safety" className="bg-secondary/30 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Safety"
          title="Safety is built into every ride"
          description="From verification to live tracking, JhapaRide is designed so you always feel in control."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {points.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/safety">Learn About Safety</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

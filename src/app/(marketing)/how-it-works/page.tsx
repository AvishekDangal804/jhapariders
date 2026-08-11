import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works",
  description: "See exactly how booking, matching and paying for a JhapaRide trip works.",
};

const details = [
  {
    title: "Enter destination",
    body: "Set your pickup point (use your current location or search) and where you're headed. You can drag the map pin to fine-tune either point.",
  },
  {
    title: "Choose ride",
    body: "Pick bike or car based on your trip. Parcel delivery is coming soon. Each option shows an upfront fare estimate before you commit.",
  },
  {
    title: "Connect with rider",
    body: "We match you with the nearest verified, online rider offering that service. You'll see their name, vehicle and rating as soon as they accept.",
  },
  {
    title: "Arrive safely",
    body: "Track the ride live on the map. When you arrive, pay by cash or wallet, then rate your rider to help keep the platform trustworthy.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How It Works"
        title="From destination to drop-off"
        description="A closer look at each step of a JhapaRide trip."
      />
      <HowItWorksSection />

      <Container className="max-w-3xl py-16 sm:py-20">
        <div className="space-y-10">
          {details.map((d, i) => (
            <div key={d.title} className="flex gap-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{d.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/passenger/book">Book a Ride</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}

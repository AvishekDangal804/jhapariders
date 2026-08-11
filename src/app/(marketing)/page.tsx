import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { TrustSection } from "@/components/site/trust-section";
import { ServicesSection } from "@/components/site/services-section";
import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { WhyJhapaRideSection } from "@/components/site/why-jhaparide-section";
import { BecomeRiderSection } from "@/components/site/become-rider-section";
import { SafetySection } from "@/components/site/safety-section";
import { CoverageSection } from "@/components/site/coverage-section";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { FaqSection } from "@/components/site/faq-section";

export const metadata: Metadata = {
  title: "JhapaRide — Fast & Reliable Rides Across Jhapa",
  description:
    "Book safe and affordable bike and car rides across Jhapa with JhapaRide.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustSection />
      <ServicesSection />
      <HowItWorksSection />
      <WhyJhapaRideSection />
      <BecomeRiderSection />
      <SafetySection />
      <CoverageSection />
      <TestimonialsSection />
      <FaqSection />
    </>
  );
}

import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { SafetySection } from "@/components/site/safety-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Safety",
  description: "How JhapaRide keeps passengers and riders safe on every trip.",
};

export default function SafetyPage() {
  return (
    <>
      <PageHero
        eyebrow="Safety"
        title="Your safety comes first"
        description="Verification, tracking, and support are built into every JhapaRide trip from start to finish."
      />

      <Container className="max-w-3xl py-16">
        <Alert>
          <ShieldAlert className="size-4" />
          <AlertTitle>About the SOS feature</AlertTitle>
          <AlertDescription>
            The in-app SOS button notifies JhapaRide support and logs your trip location for
            follow-up. It does not automatically contact police or emergency services in your
            area &mdash; in a real emergency, always call local emergency services directly.
          </AlertDescription>
        </Alert>
      </Container>

      <SafetySection />
    </>
  );
}

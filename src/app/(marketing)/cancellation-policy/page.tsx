import type { Metadata } from "next";
import { LegalDocument } from "@/components/shared/legal-document";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Cancellation Policy" };

export default function CancellationPolicyPage() {
  return (
    <LegalDocument
      title="Cancellation Policy"
      description={`Guidelines for cancelling a ride on ${siteConfig.name}.`}
      updated="August 2026"
      sections={[
        {
          heading: "1. Passenger cancellations",
          paragraphs: [
            "Passengers can cancel a ride any time before it starts. You'll be asked to select a reason: changed plans, wrong pickup, long wait, emergency, or other.",
            "Cancelling shortly after a rider has been assigned and is already en route may incur a small cancellation fee, configurable by JhapaRide admin, to compensate the rider's time.",
          ],
        },
        {
          heading: "2. Rider cancellations",
          paragraphs: [
            "Riders may cancel a ride if they are unable to complete it, providing a reason. Frequent rider cancellations are tracked and may affect a rider's standing on the platform.",
          ],
        },
        {
          heading: "3. No-driver-found",
          paragraphs: [
            "If no rider accepts a request within the matching window, the ride is automatically marked as no driver found and no charge applies.",
          ],
        },
        {
          heading: "4. Record keeping",
          paragraphs: [
            "Every cancellation is recorded with the ride, the cancelling party, and the reason, so administrators can review patterns and address misuse.",
          ],
        },
      ]}
    />
  );
}

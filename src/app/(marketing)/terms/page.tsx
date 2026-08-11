import type { Metadata } from "next";
import { LegalDocument } from "@/components/shared/legal-document";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description={`The terms that govern your use of ${siteConfig.name}.`}
      updated="August 2026"
      sections={[
        {
          heading: "1. Acceptance of terms",
          paragraphs: [
            `By creating an account or using ${siteConfig.name}, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform.`,
          ],
        },
        {
          heading: "2. Who can use JhapaRide",
          paragraphs: [
            "You must be at least 18 years old to register as a rider partner. Passengers must provide accurate registration information and keep their account details up to date.",
          ],
        },
        {
          heading: "3. Rides and fares",
          paragraphs: [
            "Fare estimates are calculated before a ride is confirmed based on distance, time, and the applicable service pricing. The final fare is calculated server-side at the end of the trip and may differ slightly from the estimate due to route or traffic changes.",
          ],
        },
        {
          heading: "4. Rider verification",
          paragraphs: [
            "Riders must complete identity, license and vehicle verification before accepting rides. JhapaRide may suspend or reject a rider account that fails verification or violates platform policies.",
          ],
        },
        {
          heading: "5. Payments and commission",
          paragraphs: [
            "JhapaRide charges a platform commission on completed rides, disclosed to riders in their earnings dashboard. Commission rates may be updated by JhapaRide from time to time; changes apply to future rides only.",
          ],
        },
        {
          heading: "6. Conduct",
          paragraphs: [
            "Passengers and riders are expected to treat each other respectfully. Harassment, fraud, or unsafe behavior may result in account suspension.",
          ],
        },
        {
          heading: "7. Limitation of liability",
          paragraphs: [
            "JhapaRide facilitates connections between passengers and independent rider partners and is not liable for the conduct of either party during a ride, to the fullest extent permitted by law.",
          ],
        },
        {
          heading: "8. Changes to these terms",
          paragraphs: [
            "We may update these terms as the platform evolves. Continued use of JhapaRide after changes are posted constitutes acceptance of the updated terms.",
          ],
        },
      ]}
    />
  );
}

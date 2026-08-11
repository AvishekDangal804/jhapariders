import type { Metadata } from "next";
import { LegalDocument } from "@/components/shared/legal-document";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description={`How ${siteConfig.name} collects, uses and protects your information.`}
      updated="August 2026"
      sections={[
        {
          heading: "1. Information we collect",
          paragraphs: [
            "Account details (name, email, phone, address), ride data (pickup/destination, routes, fares), rider verification documents, and approximate or precise location while using the app.",
          ],
        },
        {
          heading: "2. How we use your information",
          paragraphs: [
            "To match passengers with riders, calculate fares, process payments, verify rider identity and vehicles, provide support, and improve the platform.",
          ],
        },
        {
          heading: "3. Location data",
          paragraphs: [
            "We collect location data to show pickup/drop-off points, calculate routes and fares, and share a rider's live location with the matched passenger during an active ride only.",
          ],
        },
        {
          heading: "4. Document storage",
          paragraphs: [
            "Rider identity and vehicle documents are stored securely and are only accessible to the rider who uploaded them and authorized JhapaRide administrators for verification purposes.",
          ],
        },
        {
          heading: "5. Sharing of information",
          paragraphs: [
            "We do not sell personal data. Limited ride information (rider name, vehicle, live location) is shared with the matched passenger for the duration of a trip, and vice versa.",
          ],
        },
        {
          heading: "6. Your choices",
          paragraphs: [
            "You can edit your profile information at any time from your account. You may request account deletion by contacting support.",
          ],
        },
        {
          heading: "7. Security",
          paragraphs: [
            "We use database-level access controls (row level security) so users can only access their own private data, and administrators can only access what is required to operate the platform.",
          ],
        },
      ]}
    />
  );
}

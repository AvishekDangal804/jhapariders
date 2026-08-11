import type { Metadata } from "next";
import { LegalDocument } from "@/components/shared/legal-document";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund Policy"
      description={`How refunds are handled on ${siteConfig.name}.`}
      updated="August 2026"
      sections={[
        {
          heading: "1. Eligible refunds",
          paragraphs: [
            "Refunds may be issued for overcharged fares, duplicate charges, a ride that was cancelled by the rider after payment, or a verified service issue reported through support.",
          ],
        },
        {
          heading: "2. How refunds are processed",
          paragraphs: [
            "Approved refunds are credited to your JhapaRide wallet as a ledgered refund transaction. Wallet balances are never overwritten directly — every credit or debit is recorded individually.",
          ],
        },
        {
          heading: "3. Requesting a refund",
          paragraphs: [
            "Open a support ticket from your dashboard under the payment problem category, including the ride ID and a description of the issue. Our team reviews and responds as quickly as possible.",
          ],
        },
        {
          heading: "4. Timeframe",
          paragraphs: [
            "Refund requests should be submitted within 7 days of the ride. Requests outside this window will be reviewed on a case-by-case basis.",
          ],
        },
      ]}
    />
  );
}

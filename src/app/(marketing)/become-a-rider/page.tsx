import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { BecomeRiderSection } from "@/components/site/become-rider-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNpr, splitCommission } from "@/lib/fare";

export const metadata: Metadata = {
  title: "Become a Rider",
  description: "Register as a JhapaRide rider partner and start earning on your own schedule.",
};

const steps = [
  { title: "Personal information", description: "Full name, phone, email and address." },
  { title: "Driving license", description: "A valid license matching your vehicle type." },
  { title: "Vehicle details", description: "Type, brand, model and registration number." },
  { title: "Documents", description: "Registration and insurance documents." },
  { title: "Emergency contact", description: "Someone we can reach if needed." },
  { title: "Submit application", description: "Our team reviews and verifies within a few days." },
];

const requirements = [
  "18 years or older",
  "Valid driving license for your vehicle type",
  "Vehicle registered and insured",
  "A smartphone to run the rider app",
  "Willingness to serve one or more JhapaRide service areas",
];

const exampleSplit = splitCommission(500, 0.15);

export default function BecomeARiderPage() {
  return (
    <>
      <PageHero
        eyebrow="Become a Rider"
        title="Drive with JhapaRide"
        description="Turn spare hours into income, with transparent commission and weekly payouts."
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Onboarding steps</h2>
            <ol className="mt-6 space-y-6">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold">Requirements</h2>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Example earnings on a ride</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ride fare</dt>
                    <dd className="font-medium">{formatNpr(exampleSplit.fare)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Platform commission ({exampleSplit.commissionRate * 100}%)
                    </dt>
                    <dd className="font-medium">-{formatNpr(exampleSplit.platformShare)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base">
                    <dt className="font-semibold">You earn</dt>
                    <dd className="font-bold text-primary">{formatNpr(exampleSplit.riderShare)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Commission rate is set by JhapaRide admin and applied consistently. This is an
                  illustrative example for the platform&apos;s proposed commercial model.
                </p>
              </CardContent>
            </Card>

            <Button size="lg" className="w-full" asChild>
              <Link href="/register?role=rider">Start Rider Registration</Link>
            </Button>
          </div>
        </div>
      </Container>

      <BecomeRiderSection />
    </>
  );
}

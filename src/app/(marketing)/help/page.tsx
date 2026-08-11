import type { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  LifeBuoy,
  ShieldAlert,
  UserCog,
  UserRoundCog,
  Car,
} from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaqSection } from "@/components/site/faq-section";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Find answers or get support for ride, payment, and account issues on JhapaRide.",
};

const categories = [
  { icon: Car, title: "Ride problem", description: "Issues during or after a trip." },
  { icon: CreditCard, title: "Payment problem", description: "Fare, wallet or refund questions." },
  { icon: UserRoundCog, title: "Rider problem", description: "Concerns about a rider partner." },
  { icon: UserCog, title: "Passenger problem", description: "Concerns about a passenger." },
  { icon: LifeBuoy, title: "Account problem", description: "Login, profile, or verification issues." },
  { icon: ShieldAlert, title: "Safety issue", description: "Report a safety concern from a trip." },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help Center"
        title="How can we help?"
        description="Browse a category below, or sign in to open a support ticket from your dashboard."
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="mt-3 text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Still need help?{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Contact support
          </Link>
          .
        </p>
      </Container>

      <FaqSection />
    </>
  );
}

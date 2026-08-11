import type { Metadata } from "next";
import { Bike, Car, Package } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_PRICING, formatNpr } from "@/lib/fare";

export const metadata: Metadata = {
  title: "Services",
  description: "Bike rides, car rides, and parcel delivery across Jhapa with upfront, transparent pricing.",
};

const serviceDetails = [
  {
    id: "bike",
    icon: Bike,
    title: "Bike Ride",
    status: "live" as const,
    description:
      "Our most popular service. A quick, affordable way to get across town on the back of a verified rider's bike.",
    pricing: DEFAULT_PRICING.bike,
  },
  {
    id: "car",
    icon: Car,
    title: "Car Ride",
    status: "live" as const,
    description:
      "Comfortable, weather-proof rides for individuals, groups, or when you're carrying more than a bike can hold.",
    pricing: DEFAULT_PRICING.car,
  },
  {
    id: "parcel",
    icon: Package,
    title: "Parcel Delivery",
    status: "coming-soon" as const,
    description:
      "Send documents and small packages across Jhapa using the same rider network. In active development.",
    pricing: null,
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Choose the ride that fits your trip"
        description="Every fare is calculated before you confirm — no surprises at drop-off."
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {serviceDetails.map(({ id, icon: Icon, title, status, description, pricing }) => (
            <Card key={id} id={id} className="scroll-mt-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  {status === "coming-soon" ? <Badge variant="secondary">Coming Soon</Badge> : null}
                </div>
                <CardTitle className="mt-3 text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>

                {pricing ? (
                  <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Base fare</dt>
                      <dd className="font-medium">{formatNpr(pricing.baseFare)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Per km</dt>
                      <dd className="font-medium">{formatNpr(pricing.perKm)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Per minute</dt>
                      <dd className="font-medium">{formatNpr(pricing.perMinute)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Minimum fare</dt>
                      <dd className="font-medium">{formatNpr(pricing.minimumFare)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
                    Pricing will be published closer to launch.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Rates shown are current base pricing set by JhapaRide and may include a surge multiplier
          during high demand or waiting charges for delays. Final fare is always calculated and
          confirmed before your ride starts.
        </p>
      </Container>
    </>
  );
}

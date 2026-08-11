import Link from "next/link";
import { Bike, Car, Package } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: Bike,
    title: "Bike Ride",
    description: "Affordable everyday transportation for quick trips across town.",
    href: "/services#bike",
    status: "live" as const,
  },
  {
    icon: Car,
    title: "Car Ride",
    description: "Comfortable rides for individuals and groups, rain or shine.",
    href: "/services#car",
    status: "live" as const,
  },
  {
    icon: Package,
    title: "Parcel Delivery",
    description: "Send packages and documents across Jhapa, door to door.",
    href: "/services#parcel",
    status: "coming-soon" as const,
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Services"
          title="Everything you need to move around Jhapa"
          description="One platform for daily commutes, longer trips, and sending things across town."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, description, href, status }) => (
            <Card key={title} className="group relative overflow-hidden transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  {status === "coming-soon" ? (
                    <Badge variant="secondary">Coming Soon</Badge>
                  ) : null}
                </div>
                <CardTitle className="mt-3 text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
                {status === "live" ? (
                  <Link
                    href={href}
                    className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    Learn more &rarr;
                  </Link>
                ) : (
                  <span className="mt-4 inline-block text-sm font-medium text-muted-foreground">
                    Coming soon to JhapaRide
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

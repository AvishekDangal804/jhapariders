import type { Metadata } from "next";
import Link from "next/link";
import { Bike, Headset, LineChart, Code2 } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Careers",
  description: "Future opportunities to join the JhapaRide team.",
};

const positions = [
  {
    icon: Bike,
    title: "Rider Partner",
    type: "Flexible / Gig",
    description: "Drive with JhapaRide and earn on your own schedule across Jhapa.",
    href: "/become-a-rider",
  },
  {
    icon: Headset,
    title: "Customer Support",
    type: "Future opening",
    description: "Help passengers and riders resolve issues quickly and fairly.",
    href: "/contact",
  },
  {
    icon: LineChart,
    title: "Operations",
    type: "Future opening",
    description: "Manage service area growth, rider verification, and city operations.",
    href: "/contact",
  },
  {
    icon: Code2,
    title: "Technology",
    type: "Future opening",
    description: "Build the platform that powers rides across Jhapa.",
    href: "/contact",
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Help build the future of local transportation"
        description="JhapaRide is a portfolio product build. The roles below represent the kind of team a real launch would need."
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          {positions.map(({ icon: Icon, title, type, description, href }) => (
            <Card key={title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline">{type}</Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
                <Button variant="link" className="mt-3 px-0" asChild>
                  <Link href={href}>Learn more &rarr;</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}

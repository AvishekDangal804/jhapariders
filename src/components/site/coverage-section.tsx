import Link from "next/link";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { MapView } from "@/components/shared/map-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { jhapaServiceAreas } from "@/config/service-areas";

export function CoverageSection() {
  const active = jhapaServiceAreas.filter((a) => a.isActive);

  return (
    <section id="coverage" className="py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Coverage"
            title="Serving towns across Jhapa"
            description="JhapaRide currently operates in these areas, with more being added as we grow."
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {active.map((area) => (
              <Badge key={area.slug} variant="secondary" className="text-sm">
                {area.name}
              </Badge>
            ))}
          </div>
          <Button variant="link" className="mt-4 px-0" asChild>
            <Link href="/coverage">View full coverage map &rarr;</Link>
          </Button>
        </div>

        <MapView
          markers={active.map((a) => ({ id: a.slug, label: a.name, lat: a.lat, lng: a.lng }))}
        />
      </Container>
    </section>
  );
}

import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { MapView } from "@/components/shared/map-view";
import { Badge } from "@/components/ui/badge";
import { jhapaServiceAreas } from "@/config/service-areas";

export const metadata: Metadata = {
  title: "Coverage",
  description: "See which towns and municipalities across Jhapa are currently served by JhapaRide.",
};

export default function CoveragePage() {
  const active = jhapaServiceAreas.filter((a) => a.isActive);
  const upcoming = jhapaServiceAreas.filter((a) => !a.isActive);

  return (
    <>
      <PageHero
        eyebrow="Coverage"
        title="Where JhapaRide operates"
        description="We're expanding steadily across Jhapa. Service areas are managed by our team and can change as coverage grows."
      />

      <Container className="py-16 sm:py-20">
        <MapView
          markers={jhapaServiceAreas.map((a) => ({
            id: a.slug,
            label: a.name,
            lat: a.lat,
            lng: a.lng,
            variant: a.isActive ? "primary" : "muted",
          }))}
          className="aspect-[16/9]"
        />

        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold">Active service areas</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.map((a) => (
                <Badge key={a.slug} className="text-sm">
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Coming soon</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {upcoming.map((a) => (
                <Badge key={a.slug} variant="outline" className="text-sm">
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

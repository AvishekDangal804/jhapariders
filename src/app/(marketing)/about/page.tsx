import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { jhapaServiceAreas } from "@/config/service-areas";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about JhapaRide's mission to make local transportation in Jhapa faster, safer and more transparent.",
};

const stats = [
  { label: "Service areas", value: `${jhapaServiceAreas.filter((a) => a.isActive).length}+` },
  { label: "Ride types", value: "3" },
  { label: "Region", value: "Jhapa, Nepal" },
  { label: "Support", value: "24/7" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Built in Jhapa, for Jhapa"
        description="JhapaRide is a local ride-hailing platform designed around how people actually move between Birtamode, Damak, Kakarbhitta and the towns around them."
      />

      <Container className="max-w-3xl py-16 sm:py-20">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold">Our story</h2>
            <p className="mt-3 text-muted-foreground">
              JhapaRide started from a simple observation: most ride-hailing apps are built for big
              cities and then loosely adapted for everywhere else. Jhapa deserves a platform designed
              around its own towns, roads, and daily commute patterns from day one &mdash; not an
              afterthought.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Our mission</h2>
            <p className="mt-3 text-muted-foreground">
              To give passengers a fast, safe and transparent way to get around Jhapa, and to give
              local riders a reliable way to earn &mdash; on a platform that treats both sides fairly.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">What we stand for</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>Transparent pricing shown before every ride</li>
              <li>Verified riders and vehicles</li>
              <li>Fair, published commission rates</li>
              <li>Support that responds to real people in Jhapa</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-6 rounded-2xl border bg-secondary/30 p-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

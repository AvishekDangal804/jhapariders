import Link from "next/link";
import { BarChart3, Clock, ListChecks, Wallet } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

const perks = [
  { icon: Clock, label: "Flexible hours" },
  { icon: Wallet, label: "Transparent earnings" },
  { icon: ListChecks, label: "Easy onboarding" },
  { icon: BarChart3, label: "Weekly & monthly analytics" },
];

export function BecomeRiderSection() {
  return (
    <section id="become-a-rider" className="py-20 sm:py-28">
      <Container>
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 lg:px-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Earn on your own schedule.
              </h2>
              <p className="mt-4 max-w-md text-primary-foreground/85">
                Turn your bike or car into an income source. Get ride requests near you,
                track your earnings, and get paid — all from the JhapaRide rider app.
              </p>
              <Button size="lg" variant="secondary" className="mt-8" asChild>
                <Link href="/become-a-rider">Become a Rider</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {perks.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur-sm"
                >
                  <Icon className="size-6" />
                  <p className="mt-3 text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

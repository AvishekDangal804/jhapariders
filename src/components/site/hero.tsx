import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { BookingWidget } from "@/components/site/booking-widget";
import { HeroIllustration } from "@/components/site/hero-illustration";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-140 bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-blue-100),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-blue-950),transparent)]"
        aria-hidden="true"
      />
      <Container className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Now serving Jhapa, Nepal
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Your Ride. Your Jhapa.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground text-pretty">
            Fast, safe and affordable rides across Jhapa &mdash; from Birtamode to
            Kakarbhitta, book a bike, car or parcel delivery in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/passenger/book">Book a Ride</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/become-a-rider">Become a Rider</Link>
            </Button>
          </div>

          <div className="mt-10 lg:hidden">
            <BookingWidget />
          </div>
        </div>

        <div className="relative hidden lg:block">
          <HeroIllustration />
          <BookingWidget className="absolute -bottom-10 -left-10 hidden xl:block" />
        </div>
      </Container>
    </section>
  );
}

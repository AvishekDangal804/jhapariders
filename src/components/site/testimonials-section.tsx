import { Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";

// Clearly-labeled demo testimonials — fictional feedback used to illustrate
// the product experience. Never presented as real customer quotes.
const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Passenger, Birtamode",
    quote:
      "Booking a bike ride to college takes me less than a minute now, and the fare is always shown upfront.",
  },
  {
    name: "Nisha Gurung",
    role: "Passenger, Damak",
    quote:
      "I like being able to track exactly where my rider is. It makes waiting so much less stressful.",
  },
  {
    name: "Bibek Karki",
    role: "Rider Partner, Kakarbhitta",
    quote:
      "The earnings dashboard is clear and I can see exactly how much I make after commission on every ride.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="What people say" title="Loved by passengers and riders alike" />
        <div className="mt-4 flex justify-center">
          <Badge variant="outline">Demo customer feedback</Badge>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border bg-card p-6">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="block text-muted-foreground">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

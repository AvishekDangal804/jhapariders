import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";

const steps = [
  { number: "01", title: "Enter destination", description: "Tell us your pickup point and where you're headed." },
  { number: "02", title: "Choose ride", description: "Pick a bike, car, or parcel delivery and see your fare upfront." },
  { number: "03", title: "Connect with rider", description: "A nearby verified rider accepts and heads your way." },
  { number: "04", title: "Arrive safely", description: "Track your trip live and pay when you reach your destination." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="How It Works" title="Book a ride in four simple steps" />

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              <span className="text-5xl font-bold text-primary/15">{step.number}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              {i < steps.length - 1 ? (
                <div
                  className="absolute top-6 right-[-16px] hidden h-px w-8 bg-border lg:block"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

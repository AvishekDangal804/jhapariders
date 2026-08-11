import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { siteConfig } from "@/config/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the JhapaRide team.",
};

const info = [
  { icon: Mail, label: "Email", value: siteConfig.supportEmail },
  { icon: Phone, label: "Phone", value: siteConfig.supportPhone },
  { icon: MapPin, label: "Location", value: siteConfig.region },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Questions, feedback, or partnership ideas — send us a message."
      />

      <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Reach us directly</h2>
          <div className="mt-6 space-y-5">
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Contact details shown are placeholders for this demo build and are not a live support
            line.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <ContactForm />
        </div>
      </Container>
    </>
  );
}

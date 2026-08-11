import { BadgeCheck, Clock, MapPinned, ShieldCheck, Wallet } from "lucide-react";
import { Container } from "@/components/shared/container";

const items = [
  { icon: BadgeCheck, label: "Verified Riders" },
  { icon: Wallet, label: "Secure Payments" },
  { icon: MapPinned, label: "Live Tracking" },
  { icon: ShieldCheck, label: "Transparent Pricing" },
  { icon: Clock, label: "24/7 Support" },
];

export function TrustSection() {
  return (
    <section className="border-y bg-secondary/30 py-10">
      <Container>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

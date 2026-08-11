import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/shared/container";
import { siteConfig } from "@/config/site";

// Static branded maintenance screen. Once `system_settings.platform_status`
// exists in the database (Phase 3), middleware will redirect all traffic
// here whenever an admin sets the platform to MAINTENANCE (Phase 6/68).
export const metadata: Metadata = {
  title: "Under Maintenance",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-secondary/30">
      <Container className="flex max-w-lg flex-col items-center py-20 text-center">
        <Logo iconClassName="h-10 w-10" className="text-lg" />
        <div className="mt-8 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wrench className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
          We&apos;ll be right back
        </h1>
        <p className="mt-3 text-muted-foreground">
          {siteConfig.name} is currently undergoing scheduled maintenance. We&apos;re working to
          get things running smoothly again as quickly as possible.
        </p>
        <p className="mt-8 text-xs text-muted-foreground">
          For urgent matters, reach us at {siteConfig.supportEmail}
        </p>
      </Container>
    </main>
  );
}

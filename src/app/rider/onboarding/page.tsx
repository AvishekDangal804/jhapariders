import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/brand/logo";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Rider Onboarding" };

export default async function RiderOnboardingPage() {
  const state = await requireRiderState();
  if (state.hasCompletedOnboarding) redirect("/rider");

  return (
    <main className="min-h-svh bg-secondary/20">
      <div className="border-b bg-background py-4">
        <Container className="max-w-2xl">
          <Logo />
        </Container>
      </div>
      <Container className="max-w-2xl py-8">
        <OnboardingWizard userId={state.user.id} riderProfileId={state.riderProfileId} />
      </Container>
    </main>
  );
}

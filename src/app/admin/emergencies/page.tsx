import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { EmergencyList } from "@/components/emergencies/emergency-list";
import { getEmergencyEvents } from "@/lib/emergencies/queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Emergencies" };

export default async function AdminEmergenciesPage() {
  await requireProfile("admin");
  const events = await getEmergencyEvents();

  return (
    <Container className="max-w-3xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Emergencies</h1>
      <EmergencyList initial={events} />
    </Container>
  );
}

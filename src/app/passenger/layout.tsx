import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { passengerNav } from "@/config/passenger-nav";
import { requireProfile } from "@/lib/supabase/require-profile";

export default async function PassengerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireProfile("passenger");

  return (
    <DashboardShell user={user} navItems={passengerNav}>
      {children}
    </DashboardShell>
  );
}

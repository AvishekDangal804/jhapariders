import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { riderNav, riderMobileNav } from "@/config/rider-nav";
import { requireRiderState } from "@/lib/supabase/require-rider";

export default async function RiderDashboardLayout({ children }: { children: React.ReactNode }) {
  const state = await requireRiderState();

  if (!state.hasCompletedOnboarding) {
    redirect("/rider/onboarding");
  }

  return (
    <DashboardShell
      user={state.user}
      navItems={riderNav}
      mobileNavItems={riderMobileNav}
      headerRight={
        <Link
          href="/rider/notifications"
          className="hidden rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Link>
      }
    >
      {children}
    </DashboardShell>
  );
}

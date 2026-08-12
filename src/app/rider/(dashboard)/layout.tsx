import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { riderNav, riderMobileNav } from "@/config/rider-nav";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";
import { requireRiderState } from "@/lib/supabase/require-rider";

export default async function RiderDashboardLayout({ children }: { children: React.ReactNode }) {
  const state = await requireRiderState();

  if (!state.hasCompletedOnboarding) {
    redirect("/rider/onboarding");
  }

  const unreadCount = await getUnreadNotificationCount(state.user.id);

  return (
    <DashboardShell
      user={state.user}
      navItems={riderNav}
      mobileNavItems={riderMobileNav}
      headerRight={
        <NotificationBell userId={state.user.id} href="/rider/notifications" initialUnreadCount={unreadCount} />
      }
    >
      {children}
    </DashboardShell>
  );
}

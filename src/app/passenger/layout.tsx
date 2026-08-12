import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { passengerNav, passengerMobileNav } from "@/config/passenger-nav";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export default async function PassengerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireProfile("passenger");
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <DashboardShell
      user={user}
      navItems={passengerNav}
      mobileNavItems={passengerMobileNav}
      headerRight={
        <NotificationBell userId={user.id} href="/passenger/notifications" initialUnreadCount={unreadCount} />
      }
    >
      {children}
    </DashboardShell>
  );
}

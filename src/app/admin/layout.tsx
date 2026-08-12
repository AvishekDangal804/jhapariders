import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { adminNav, adminMobileNav } from "@/config/admin-nav";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireProfile("admin");
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <DashboardShell
      user={user}
      navItems={adminNav}
      mobileNavItems={adminMobileNav}
      headerRight={<NotificationBell userId={user.id} href="/admin/notifications" initialUnreadCount={unreadCount} />}
    >
      {children}
    </DashboardShell>
  );
}

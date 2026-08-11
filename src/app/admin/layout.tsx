import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { adminNav, adminMobileNav } from "@/config/admin-nav";
import { requireProfile } from "@/lib/supabase/require-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireProfile("admin");

  return (
    <DashboardShell user={user} navItems={adminNav} mobileNavItems={adminMobileNav}>
      {children}
    </DashboardShell>
  );
}

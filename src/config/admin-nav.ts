import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const adminNav: DashboardNavItem[] = [
  { label: "Overview", href: "/admin", icon: "Home", exact: true },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Riders", href: "/admin/riders", icon: "ShieldCheck" },
  { label: "Rides", href: "/admin/rides", icon: "Car" },
  { label: "Payments", href: "/admin/payments", icon: "CreditCard" },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: "Wallet" },
  { label: "Analytics", href: "/admin/analytics", icon: "TrendingUp" },
  { label: "Coupons", href: "/admin/coupons", icon: "Ticket" },
  { label: "Emergencies", href: "/admin/emergencies", icon: "AlertTriangle" },
  { label: "Support", href: "/admin/support", icon: "LifeBuoy" },
  { label: "Pricing", href: "/admin/pricing", icon: "Package" },
  { label: "Service Areas", href: "/admin/service-areas", icon: "MapPin" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "FileClock" },
];

// The bottom nav only shows the first 4 of these (DashboardShell reserves a
// 5th slot for "More", which lists all 14 sections in adminNav) — an admin
// checking their phone is most likely triaging something urgent, so
// Emergencies/Support/Withdrawals get priority over the browsing-heavy
// list pages (Users/Riders/Rides/Payments etc., still one tap away).
export const adminMobileNav: DashboardNavItem[] = [
  adminNav[0],
  adminNav.find((item) => item.href === "/admin/emergencies")!,
  adminNav.find((item) => item.href === "/admin/support")!,
  adminNav.find((item) => item.href === "/admin/withdrawals")!,
];

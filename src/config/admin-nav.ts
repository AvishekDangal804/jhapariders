import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const adminNav: DashboardNavItem[] = [
  { label: "Overview", href: "/admin", icon: "Home", exact: true },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Riders", href: "/admin/riders", icon: "ShieldCheck" },
  { label: "Rides", href: "/admin/rides", icon: "Car" },
  { label: "Payments", href: "/admin/payments", icon: "CreditCard" },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: "Wallet" },
  { label: "Pricing", href: "/admin/pricing", icon: "Package" },
  { label: "Service Areas", href: "/admin/service-areas", icon: "MapPin" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "FileClock" },
];

export const adminMobileNav: DashboardNavItem[] = [
  adminNav[0],
  adminNav[1],
  adminNav[2],
  adminNav[3],
  adminNav[4],
];

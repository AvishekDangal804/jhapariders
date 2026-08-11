import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const riderNav: DashboardNavItem[] = [
  { label: "Home", href: "/rider", icon: "Home", exact: true },
  { label: "Requests", href: "/rider/requests", icon: "Bell" },
  { label: "History", href: "/rider/history", icon: "Clock" },
  { label: "Earnings", href: "/rider/earnings", icon: "Star" },
  { label: "Wallet", href: "/rider/wallet", icon: "Wallet" },
  { label: "Documents", href: "/rider/documents", icon: "Package" },
];

export const riderMobileNav: DashboardNavItem[] = [
  riderNav[0],
  riderNav[1],
  riderNav[2],
  riderNav[4],
  riderNav[5],
];

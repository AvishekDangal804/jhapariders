import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const riderNav: DashboardNavItem[] = [
  { label: "Home", href: "/rider", icon: "Home", exact: true },
  { label: "Requests", href: "/rider/requests", icon: "Bell" },
  { label: "History", href: "/rider/history", icon: "Clock" },
  { label: "Earnings", href: "/rider/earnings", icon: "Star" },
  { label: "Wallet", href: "/rider/wallet", icon: "Wallet" },
  { label: "Documents", href: "/rider/documents", icon: "Package" },
  { label: "Support", href: "/rider/support", icon: "LifeBuoy" },
];

// The bottom nav only shows the first 4 of these (DashboardShell reserves a
// 5th slot for "More", which lists every item in riderNav) — pick the ones
// riders check most often; History/Documents/Support are still one tap away.
export const riderMobileNav: DashboardNavItem[] = [
  riderNav[0],
  riderNav[1],
  riderNav[3],
  riderNav[4],
];

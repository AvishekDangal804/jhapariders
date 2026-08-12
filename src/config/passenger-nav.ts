import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const passengerNav: DashboardNavItem[] = [
  { label: "Home", href: "/passenger", icon: "Home", exact: true },
  { label: "Ride", href: "/passenger/book", icon: "Bike" },
  { label: "History", href: "/passenger/history", icon: "Clock" },
  { label: "Wallet", href: "/passenger/wallet", icon: "Wallet" },
  { label: "Alerts", href: "/passenger/notifications", icon: "Bell" },
  { label: "Support", href: "/passenger/support", icon: "LifeBuoy" },
];

// The bottom nav only shows the first 4 of these (DashboardShell reserves a
// 5th slot for "More", which lists every item in passengerNav) — Alerts has
// its own header bell too, so Support/Alerts being one tap away is fine.
export const passengerMobileNav: DashboardNavItem[] = [
  passengerNav[0],
  passengerNav[1],
  passengerNav[2],
  passengerNav[3],
];

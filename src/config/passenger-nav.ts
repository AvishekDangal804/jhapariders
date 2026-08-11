import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const passengerNav: DashboardNavItem[] = [
  { label: "Home", href: "/passenger", icon: "Home", exact: true },
  { label: "Ride", href: "/passenger/book", icon: "Bike" },
  { label: "History", href: "/passenger/history", icon: "Clock" },
  { label: "Wallet", href: "/passenger/wallet", icon: "Wallet" },
  { label: "Alerts", href: "/passenger/notifications", icon: "Bell" },
];
